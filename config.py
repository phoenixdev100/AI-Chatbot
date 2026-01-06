# Flask Development Configuration

# Enable debug mode
DEBUG = True

# Enable auto-reload
USE_RELOADER = True

# Watch additional file types
TEMPLATES_AUTO_RELOAD = True

# Session configuration
SECRET_KEY = 'dev-secret-key-change-in-production'
SESSION_TYPE = 'filesystem'
PERMANENT_SESSION_LIFETIME = 86400  # 24 hours in seconds

# Upload configuration
UPLOAD_FOLDER = 'uploads'
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB

# Allowed file extensions
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'py', 'js', 'html', 'css'}
