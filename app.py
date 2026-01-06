from flask import Flask, request, jsonify, render_template, send_from_directory, session
import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
from werkzeug.utils import secure_filename
from flask_cors import CORS
from flask_socketio import SocketIO
from datetime import timedelta

app = Flask(__name__)
app.secret_key = os.urandom(24)  # Secret key for sessions
app.config['SESSION_TYPE'] = 'filesystem'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=24)
app.config['TEMPLATES_AUTO_RELOAD'] = True  # Auto-reload templates
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")
load_dotenv()

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'py', 'js', 'html', 'css'}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Configure Gemini API
API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=API_KEY) if API_KEY else None

# Store conversation history (in production, use a database)
conversations = {}

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
        return """You are Phoenix AI, a friendly and helpful coding assistant. Be warm and conversational while helping with code:
        - Provide exactly what the user asks for - stay focused on their needs
        - Use a friendly, approachable tone (you can use emojis occasionally 😊)
        - When giving code, use markdown code blocks with the language specified
        - Keep explanations clear but concise - explain the "why" when helpful
        - If something is unclear, ask friendly follow-up questions
        - Celebrate their progress and encourage learning
        - Be patient and supportive, especially with beginners
        Remember: You're not just a code generator, you're a helpful friend who happens to be great at coding!"""
    else:
        return """You are Phoenix AI, a warm and friendly AI assistant. Be conversational and helpful:
        - Answer what the user asks - be direct but friendly
        - Use a natural, conversational tone (emojis are welcome when appropriate 😊)
        - Keep responses focused but don't be robotic - add personality!
        - If you're not sure what they need, ask clarifying questions
        - Be encouraging and positive
        - Remember context from the conversation
        Think of yourself as a helpful friend who's always ready to assist!"""

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/api/clear-history', methods=['POST'])
def clear_history():
    try:
        if 'session_id' in session:
            session_id = session['session_id']
            if session_id in conversations:
                conversations[session_id] = []
        return jsonify({"success": True, "message": "Conversation history cleared"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        if not client:
            return jsonify({"error": "API key not configured. Please set GEMINI_API_KEY in .env file"}), 500

        # Get or create session ID
        if 'session_id' not in session:
            session['session_id'] = os.urandom(16).hex()
        
        session_id = session['session_id']
        
        # Initialize conversation history for this session
        if session_id not in conversations:
            conversations[session_id] = []

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

        # Build conversation history with context
        conversation_history = system_message + "\n\n"
        
        # Add previous messages for context (keep last 10 exchanges)
        history_limit = 10
        recent_history = conversations[session_id][-history_limit:] if len(conversations[session_id]) > history_limit else conversations[session_id]
        
        for msg in recent_history:
            conversation_history += f"{msg['role']}: {msg['content']}\n\n"
        
        # Add current user message
        conversation_history += f"User: {full_message}"

        # Make API request with full conversation context
        try:
            response = client.models.generate_content(
                model='models/gemini-2.5-flash',
                contents=conversation_history,
                config=types.GenerateContentConfig(
                    temperature=0.7,
                    max_output_tokens=2000,
                )
            )
            
            if not response or not response.text:
                return jsonify({"error": "No response from AI model"}), 500
                
            ai_message = response.text.strip()
            
            # Save to conversation history
            conversations[session_id].append({"role": "User", "content": full_message})
            conversations[session_id].append({"role": "Phoenix AI", "content": ai_message})
            
            # Limit conversation history size (keep last 50 messages)
            if len(conversations[session_id]) > 50:
                conversations[session_id] = conversations[session_id][-50:]
            
            return jsonify({"response": ai_message})
            
        except Exception as e:
            error_message = str(e)
            print(f"API Error: {error_message}")  # Debug logging
            import traceback
            traceback.print_exc()  # Print full traceback
            if "quota" in error_message.lower():
                return jsonify({"error": "API quota exceeded. Please check your Gemini API usage."}), 429
            elif "api key" in error_message.lower():
                return jsonify({"error": "Invalid API key. Please check your GEMINI_API_KEY."}), 401
            else:
                return jsonify({"error": f"API Error: {error_message}"}), 500

    except Exception as e:
        print(f"Server Error: {str(e)}")  # Debug logging
        import traceback
        traceback.print_exc()  # Print full traceback
        return jsonify({"error": f"Server Error: {str(e)}"}), 500

if __name__ == '__main__':
    try:
        print("\n=== AI Chatbot Server ===")
        print("API Configuration:")
        print(f"Using: Google Gemini API")
        print(f"API Key configured: {'Yes' if client else 'No'}")
        if API_KEY:
            print(f"API Key (length): {len(API_KEY)} characters")
        print("----------------------------------------")
        print("Server Configuration:")
        print("- Debug Mode: Enabled")
        print("- Auto-Reload: Enabled (watching .py, .html, .css, .js files)")
        print("- Upload Folder:", UPLOAD_FOLDER)
        print("- Max Content Length:", MAX_CONTENT_LENGTH, "bytes")
        print("----------------------------------------")
        
        # Configure extra files to watch for auto-reload
        import glob
        extra_dirs = ['static', 'templates']
        extra_files = []
        
        for extra_dir in extra_dirs:
            for dirname, dirs, files in os.walk(extra_dir):
                for filename in files:
                    filename = os.path.join(dirname, filename)
                    if os.path.isfile(filename):
                        extra_files.append(filename)
        
        # Run with auto-reload watching all files
        socketio.run(
            app, 
            debug=True,
            use_reloader=True,
            extra_files=extra_files
        )
    except Exception as e:
        print(f"Failed to start server: {str(e)}")
