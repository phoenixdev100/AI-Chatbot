# Development Guide - Auto-Reload Feature

## 🔄 Auto-Reload Configuration

Your Phoenix AI Chatbot is configured with **comprehensive auto-reload** functionality. The server will automatically restart whenever you make changes to:

### Watched File Types:
- ✅ **Python files** (`.py`) - Backend code
- ✅ **HTML templates** (`.html`) - UI templates
- ✅ **CSS stylesheets** (`.css`) - Styling
- ✅ **JavaScript files** (`.js`) - Frontend logic

## 🚀 How to Use

### Option 1: Run with Python (Recommended)
```bash
python app.py
```

### Option 2: Use the Development Script (Windows)
```bash
run_dev.bat
```

## 📝 What Happens When You Save a File?

1. **You save a file** (e.g., `static/css/style.css`)
2. **Flask detects the change** automatically
3. **Server restarts** in ~1-2 seconds
4. **Browser refreshes** (you may need to manually refresh)
5. **Changes are live!** ✨

## 💡 Tips for Best Experience

### 1. **Browser Auto-Refresh** (Optional)
Install a browser extension like "Live Reload" or "Auto Refresh" to automatically refresh your browser when files change.

### 2. **Clear Browser Cache**
If changes don't appear:
- Press `Ctrl + F5` (Windows) or `Cmd + Shift + R` (Mac) to hard refresh
- Or open DevTools (F12) and disable cache

### 3. **Watch the Console**
The terminal will show:
```
 * Detected change in 'static/css/style.css', reloading
 * Restarting with watchdog (windowsapi)
```

## 🛠️ Configuration Details

### Files Being Watched:
The server watches these directories:
- `app.py` and all Python files
- `templates/` - All HTML files
- `static/` - All CSS, JS, and other static files

### Auto-Reload Settings:
```python
# In app.py
app.config['TEMPLATES_AUTO_RELOAD'] = True
socketio.run(app, debug=True, use_reloader=True, extra_files=[...])
```

## ⚠️ Important Notes

1. **Debug Mode**: Auto-reload only works in debug mode (enabled by default in development)
2. **Production**: Auto-reload is automatically disabled in production for security
3. **Large Files**: Very large files might cause slower reload times
4. **Multiple Changes**: If you save multiple files quickly, the server will restart once after all changes

## 🔧 Troubleshooting

### Server Not Reloading?
1. Check if debug mode is enabled (should see "Debug mode: on" in console)
2. Ensure you're editing files in the project directory
3. Try restarting the server manually

### Changes Not Appearing?
1. Hard refresh your browser (`Ctrl + F5`)
2. Clear browser cache
3. Check browser console for errors (F12)

### Server Reloading Too Often?
- This is normal if you're using auto-save in your editor
- Each save triggers a reload
- Consider disabling auto-save or increasing the delay

## 🎯 Development Workflow

```
1. Start server: python app.py
2. Open browser: http://localhost:5000
3. Edit files in your code editor
4. Save changes (Ctrl + S)
5. Server auto-restarts (watch console)
6. Refresh browser to see changes
7. Repeat! 🔄
```

## 📚 Additional Resources

- [Flask Documentation - Debug Mode](https://flask.palletsprojects.com/en/2.3.x/quickstart/#debug-mode)
- [Werkzeug Reloader](https://werkzeug.palletsprojects.com/en/2.3.x/serving/#reloader)

---

**Happy Coding! 🚀**
