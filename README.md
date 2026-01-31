# <div align="center">🤖 AI Chatbot</div>

<div align="center">
A modern, responsive AI chatbot web application built with Flask and Google Gemini API. Experience seamless conversations with an intelligent AI assistant.
</div>

<img src="https://raw.githubusercontent.com/phoenixdev100/ai-chatbot/main/static/images/dashboard-preview.png" alt="AI Dashboard Preview" width="800"/>

## <div align="center">✨ Features</div>

- 💬 Real-time chat interface with typing indicators
- 🎨 Modern and responsive design
- 🤖 Integration with Google Gemini API
- ⌨️ Auto-expanding text input
- ⚡ Support for both click and Enter key message sending
- 🌙 Dark mode support

## <div align="center">🚀 Quick Start</div>

### Prerequisites

- Python 3.8 or higher
- Google Gemini API key (get it from [Google AI Studio](https://aistudio.google.com/app/apikey))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/phoenixdev100/ai-chatbot.git
   cd ai-chatbot
   ```

2. **Create and activate a virtual environment**
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   ```bash
   # Copy the example environment file
   cp .env.example .env

   # Edit .env and add your Gemini API key
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

### Running the Application

1. **Start the Flask server**
   ```bash
   py app.py
   ```
   or
   ```bash
   python app.py
   ```

2. **Open your browser**
   Navigate to [http://localhost:5000](http://localhost:5000)

## <div align="center">📁 Project Structure</div>

```
ai-chatbot/
├── app.py              # Flask application
├── requirements.txt    # Python dependencies
├── .env               # Environment variables
├── static/
│   ├── css/
│   │   └── style.css  # Stylesheet
│   └── js/
│       └── main.js    # Frontend JavaScript
└── templates/
    └── index.html     # Main HTML template
```

## <div align="center">🤝 Contributing</div>

We welcome contributions! Here's how you can help:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## <div align="center">📝 License</div>

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## <div align="center">🙏 Acknowledgments</div>

- Google for their powerful Gemini API
- Flask for the web framework
- All contributors who have helped improve this project
