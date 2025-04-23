from flask import Flask, request, jsonify, render_template, send_from_directory
import os
from dotenv import load_dotenv
import requests
from werkzeug.utils import secure_filename
from flask_cors import CORS
from flask_socketio import SocketIO

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")
load_dotenv()

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'py', 'js', 'html', 'css'}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

API_URL = "https://api.together.xyz/v1/chat/completions"
API_KEY = os.getenv("TOGETHER_API_KEY")

HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def process_file(file):
    if not file:
        return None
        
    filename = secure_filename(file.filename)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)
    
    # Process different file types
    if filename.endswith(('.txt', '.py', '.js', '.html', '.css')):
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    elif filename.endswith(('.jpg', '.jpeg', '.png', '.gif')):
        return f"[Image uploaded: {filename}]"
    elif filename.endswith('.pdf'):
        return f"[PDF uploaded: {filename}]"
    else:
        return f"[File uploaded: {filename}]"

def is_code_request(message):
    code_keywords = [
        "write a", "create a", "implement", "code", "function", "class",
        "script", "program", "algorithm", "syntax", "example code",
        "how to code", "how to implement", "write code", "coding example",
        "code sample", "programming", "debug", "fix code", "error in code"
    ]
    message_lower = message.lower()
    return any(keyword in message_lower for keyword in code_keywords)

def get_system_message(is_code):
    if is_code:
        return """You are a helpful coding assistant. When providing code examples:
        1. Include clear comments explaining the code
        2. Use proper formatting with markdown code blocks (```)
        3. Specify the programming language
        4. Add brief explanations before and after the code
        5. Follow best practices and conventions"""
    else:
        return """You are a helpful AI assistant. Provide clear and concise responses.
        Keep your answers natural and conversational. Only use code blocks when specifically
        discussing code or technical concepts that require them."""

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        if not API_KEY:
            return jsonify({"error": "API key not configured. Please set TOGETHER_API_KEY in .env file"}), 500

        message = request.form.get('message', '').strip()
        files = request.files.getlist('files[]')
        
        # Process uploaded files
        file_contents = []
        for file in files:
            if file and allowed_file(file.filename):
                content = process_file(file)
                if content:
                    file_contents.append(f"\nFile: {file.filename}\nContent:\n{content}\n")

        # Combine message and file contents
        full_message = message
        if file_contents:
            file_text = "\n".join(file_contents)
            full_message = f"{message}\n\nI have uploaded the following files for your reference:\n{file_text}\nPlease analyze these files and help me with my request."

        # Detect if this is a code-related request
        is_code = is_code_request(full_message)
        system_message = get_system_message(is_code)

        # Prepare API request
        payload = {
            "model": "mistralai/Mixtral-8x7B-Instruct-v0.1",
            "messages": [
                {"role": "system", "content": system_message},
                {"role": "user", "content": full_message}
            ],
            "temperature": 0.7,
            "max_tokens": 2000,
        }

        # Make API request
        try:
            response = requests.post(API_URL, headers=HEADERS, json=payload, timeout=30)
            response.raise_for_status()
            
            response_data = response.json()
            if not response_data.get("choices"):
                return jsonify({"error": "No response from AI model"}), 500
                
            ai_message = response_data["choices"][0]["message"]["content"].strip()
            return jsonify({"response": ai_message})
            
        except requests.exceptions.Timeout:
            return jsonify({"error": "Request timed out. Please try again."}), 504
        except requests.exceptions.RequestException as e:
            return jsonify({"error": f"API Error: {str(e)}"}), 500

    except Exception as e:
        return jsonify({"error": f"Server Error: {str(e)}"}), 500

if __name__ == '__main__':
    try:
        print("\n=== AI Chatbot Server ===")
        print("API Configuration:")
        print(f"API URL: {API_URL}")
        print(f"API Key (length): {len(API_KEY)} characters")
        print("----------------------------------------")
        print("Server Configuration:")
        print("- Debug Mode: Enabled")
        print("- Upload Folder:", UPLOAD_FOLDER)
        print("- Max Content Length:", MAX_CONTENT_LENGTH, "bytes")
        print("----------------------------------------")
        socketio.run(app, debug=True)
    except Exception as e:
        print(f"Failed to start server: {str(e)}")
