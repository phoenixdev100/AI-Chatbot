document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const newChatButton = document.getElementById('new-chat');
    const clearHistoryButton = document.getElementById('clear-history');
    const themeToggleButton = document.getElementById('theme-toggle');
    const settingsButton = document.getElementById('settings-button');
    const exportChatButton = document.getElementById('export-chat');
    const uploadButton = document.getElementById('upload-button');
    const codeButton = document.getElementById('code-button');
    const filePreview = document.getElementById('file-preview');
    const quickActions = document.querySelectorAll('.action-chip');
    
    let isProcessing = false;
    let currentFiles = [];

    // Initialize theme
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon();

    // Initialize chat history
    let conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
    let currentConversation = {
        id: generateId(),
        title: 'New Chat',
        messages: []
    };

    // Event Listeners
    userInput.addEventListener('input', () => {
        adjustTextareaHeight();
        sendButton.disabled = !userInput.value.trim();
    });

    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !isProcessing) {
            e.preventDefault();
            const message = userInput.value.trim();
            if (message) {
                sendMessage(message);
            }
        }
    });

    sendButton.addEventListener('click', () => {
        const message = userInput.value.trim();
        if (message && !isProcessing) {
            sendMessage(message);
        }
    });

    // Quick action buttons
    quickActions.forEach(button => {
        button.addEventListener('click', () => {
            const action = button.dataset.action;
            let template = '';
            
            switch(action) {
                case 'debug':
                    template = 'Help me debug this code:\n```\n\n```';
                    break;
                case 'explain':
                    template = 'Explain this concept:\n';
                    break;
                case 'write':
                    template = 'Help me write a function that:\n';
                    break;
                case 'optimize':
                    template = 'Help me optimize this code:\n```\n\n```';
                    break;
            }
            
            userInput.value = template;
            userInput.focus();
            adjustTextareaHeight();
            sendButton.disabled = false;
        });
    });

    // Theme toggle
    themeToggleButton.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon();
    });

    // New chat button
    newChatButton.addEventListener('click', startNewChat);
    
    // Clear history button
    clearHistoryButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all chat history? This cannot be undone.')) {
            conversations = [];
            localStorage.removeItem('conversations');
            startNewChat();
        }
    });

    // Export chat button
    exportChatButton.addEventListener('click', () => {
        const chatContent = currentConversation.messages.map(msg => 
            `${msg.role.toUpperCase()}: ${msg.content}`
        ).join('\n\n');
        
        const blob = new Blob([chatContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-export-${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // File upload
    uploadButton.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = '.txt,.js,.py,.html,.css,.json,.pdf,.jpg,.jpeg,.png,.gif';
        
        input.onchange = (e) => {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                currentFiles = files;
                
                // Show file preview
                filePreview.innerHTML = files.map(file => `
                    <div class="file-item">
                        <i class="fas fa-file"></i>
                        <span>${file.name}</span>
                        <button class="remove-file" onclick="this.parentElement.remove(); currentFiles = currentFiles.filter(f => f.name !== '${file.name}');">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `).join('');
                
                // Enable send button if there's a message or files
                sendButton.disabled = !(userInput.value.trim() || currentFiles.length > 0);
                
                // Add a message about the uploaded files
                if (!userInput.value.trim()) {
                    userInput.value = `I have uploaded ${files.length} file${files.length > 1 ? 's' : ''}. Please analyze ${files.length > 1 ? 'them' : 'it'}.`;
                    adjustTextareaHeight();
                }
            }
        };
        
        input.click();
    });

    // Helper functions
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    function adjustTextareaHeight() {
        userInput.style.height = 'auto';
        userInput.style.height = Math.min(userInput.scrollHeight, 200) + 'px';
    }

    function updateThemeIcon() {
        const theme = document.documentElement.getAttribute('data-theme');
        const icon = themeToggleButton.querySelector('i');
        icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }

    function addMessage(content, isUser = false, isError = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const messageHeader = document.createElement('div');
        messageHeader.className = 'message-header';
        
        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        const icon = document.createElement('i');
        icon.className = isUser ? 'fas fa-user' : 'fas fa-robot';
        avatar.appendChild(icon);
        
        const sender = document.createElement('span');
        sender.className = 'sender';
        sender.textContent = isUser ? 'You' : 'Phoenix AI';
        
        messageHeader.appendChild(avatar);
        messageHeader.appendChild(sender);
        
        const messageText = document.createElement('div');
        messageText.className = 'message-text';

        // Process markdown-style formatting
        const processMarkdown = (text) => {
            // Handle bold text
            text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            // Handle italic text
            text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
            // Handle inline code
            text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
            // Handle links
            text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
            // Handle lists
            text = text.replace(/^\s*[-*]\s+(.+)$/gm, '<li>$1</li>');
            text = text.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
            // Handle line breaks
            text = text.replace(/\n/g, '<br>');
            return text;
        };
        
        if (content.includes('```')) {
            // Split content by code blocks
            const parts = content.split(/(```[\s\S]*?```)/g);
            parts.forEach(part => {
                if (part.startsWith('```') && part.endsWith('```')) {
                    // Extract language and code
                    const lines = part.slice(3, -3).split('\n');
                    const language = lines[0].trim();
                    const code = lines.slice(1).join('\n');

                    // Create code block elements
                    const pre = document.createElement('pre');
                    const codeEl = document.createElement('code');
                    if (language) {
                        codeEl.className = `language-${language}`;
                    }
                    codeEl.textContent = code;
                    pre.appendChild(codeEl);
                    messageText.appendChild(pre);

                    // Apply syntax highlighting
                    if (window.hljs) {
                        hljs.highlightElement(codeEl);
                    }
                } else if (part.trim()) {
                    // Process regular text with markdown
                    const textDiv = document.createElement('div');
                    textDiv.className = 'text-content';
                    textDiv.innerHTML = processMarkdown(part);
                    messageText.appendChild(textDiv);
                }
            });
        } else {
            // Process regular text with markdown
            messageText.innerHTML = processMarkdown(content);
        }
        
        messageContent.appendChild(messageHeader);
        messageContent.appendChild(messageText);
        messageDiv.appendChild(messageContent);
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function addTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message ai-message typing-indicator';
        typingDiv.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return typingDiv;
    }

    async function sendMessage(message) {
        if (isProcessing) return;
        
        try {
            isProcessing = true;
            userInput.disabled = true;
            sendButton.disabled = true;
            
            // Add user message
            let displayMessage = message;
            if (currentFiles.length > 0) {
                const fileList = currentFiles.map(f => f.name).join(', ');
                displayMessage += `\n\nUploaded files: ${fileList}`;
            }
            addMessage(displayMessage, true);
            
            // Clear input
            userInput.value = '';
            userInput.style.height = 'auto';
            
            // Show typing indicator
            const typingIndicator = addTypingIndicator();
            
            // Prepare form data
            const formData = new FormData();
            formData.append('message', message);
            currentFiles.forEach(file => {
                formData.append('files[]', file);
            });
            
            // Send request
            const response = await fetch('/api/chat', {
                method: 'POST',
                body: formData
            });
            
            // Remove typing indicator
            typingIndicator.remove();
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.response) {
                // Add AI response
                addMessage(data.response, false);
                
                // Save to conversation history
                currentConversation.messages.push(
                    { role: 'user', content: displayMessage },
                    { role: 'assistant', content: data.response }
                );
                saveCurrentConversation();
            } else {
                throw new Error('Empty response from server');
            }
            
        } catch (error) {
            console.error('Error:', error);
            addMessage('Sorry, there was an error processing your request. Please try again.', false, true);
        } finally {
            isProcessing = false;
            userInput.disabled = false;
            sendButton.disabled = !userInput.value.trim();
            userInput.focus();
            currentFiles = [];
            filePreview.innerHTML = '';
        }
    }

    function startNewChat() {
        // Save current conversation if it has messages
        if (currentConversation.messages.length > 0) {
            saveCurrentConversation();
        }
        
        // Clear chat messages
        chatMessages.innerHTML = '';
        
        // Create new conversation
        currentConversation = {
            id: generateId(),
            title: 'New Chat',
            messages: []
        };
        
        // Add welcome message
        addMessage('👋 Welcome to Phoenix AI! How can I help you today?', false);
        
        // Reset input
        userInput.value = '';
        userInput.style.height = 'auto';
        sendButton.disabled = true;
        currentFiles = [];
        filePreview.innerHTML = '';
    }

    function saveCurrentConversation() {
        const index = conversations.findIndex(c => c.id === currentConversation.id);
        if (index !== -1) {
            conversations[index] = currentConversation;
        } else {
            conversations.unshift(currentConversation);
        }
        
        // Keep only last 10 conversations
        conversations = conversations.slice(0, 10);
        localStorage.setItem('conversations', JSON.stringify(conversations));
    }
});
