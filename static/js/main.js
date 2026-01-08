document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const newChatButton = document.getElementById('new-chat');
    const themeToggleButton = document.getElementById('theme-toggle');
    const uploadButton = document.getElementById('upload-button');
    const codeButton = document.getElementById('code-button');
    const filePreview = document.getElementById('file-preview');
    const conversationList = document.querySelector('.conversation-list');

    // Sidebar Elements
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebarMaximize = document.getElementById('sidebar-maximize');

    let isProcessing = false;
    let currentFiles = [];

    // Initialize sidebar state
    const sidebarState = localStorage.getItem('sidebarState') || 'expanded';
    if (sidebarState === 'collapsed') {
        sidebar.classList.add('collapsed');
    }

    // Initialize theme
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon();

    // Event Listeners for Sidebar
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.add('collapsed');
            localStorage.setItem('sidebarState', 'collapsed');
            // Show maximize button, hide minimize button
            sidebarToggle.style.display = 'none';
            if (sidebarMaximize) {
                sidebarMaximize.style.display = 'flex';
            }
        });
    }

    // Maximize button to expand sidebar
    if (sidebarMaximize) {
        sidebarMaximize.addEventListener('click', () => {
            sidebar.classList.remove('collapsed');
            localStorage.setItem('sidebarState', 'expanded');
            // Show minimize button, hide maximize button
            sidebarMaximize.style.display = 'none';
            if (sidebarToggle) {
                sidebarToggle.style.display = 'flex';
            }
        });
    }

    // Allow expanding sidebar by clicking logo in collapsed mode
    const logoElement = document.querySelector('.logo');
    if (logoElement) {
        logoElement.addEventListener('click', () => {
            if (sidebar.classList.contains('collapsed')) {
                sidebar.classList.remove('collapsed');
                localStorage.setItem('sidebarState', 'expanded');
                // Show minimize button, hide maximize button
                if (sidebarMaximize) {
                    sidebarMaximize.style.display = 'none';
                }
                if (sidebarToggle) {
                    sidebarToggle.style.display = 'flex';
                }
            }
        });
    }

    // Initialize chat history
    let conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
    let currentConversation = {
        id: generateId(),
        title: 'New Chat',
        messages: [],
        timestamp: Date.now()
    };

    // Render conversation history
    renderConversationList();

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

    function addTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message ai-message typing-indicator';
        typingDiv.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return typingDiv;
    }

    function typewriterEffect(element, text, speed = 15) {
        return new Promise((resolve) => {
            let index = 0;
            const interval = setInterval(() => {
                if (index < text.length) {
                    element.textContent += text.charAt(index);
                    index++;
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                } else {
                    clearInterval(interval);
                    resolve();
                }
            }, speed);
        });
    }

    function addMessage(content, isUser = false, isError = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
        if (isError) messageDiv.classList.add('error-message');

        // Create Avatar (Direct child of messageDiv)
        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        const icon = document.createElement('i');
        icon.className = isUser ? 'fas fa-user' : 'fas fa-robot';
        avatar.appendChild(icon);
        messageDiv.appendChild(avatar);

        // Content Container
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';

        const messageText = document.createElement('div');
        messageText.className = 'message-text';

        // Process markdown-style formatting
        const processMarkdown = (text) => {
            text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
            text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
            text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
            text = text.replace(/^\s*[-*]\s+(.+)$/gm, '<li>$1</li>');
            text = text.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
            text = text.replace(/\n/g, '<br>');
            return text;
        };

        if (content.includes('```')) {
            const parts = content.split(/(```[\s\S]*?```)/g);
            parts.forEach(part => {
                if (part.startsWith('```') && part.endsWith('```')) {
                    const lines = part.slice(3, -3).split('\n');
                    const language = lines[0].trim();
                    const code = lines.slice(1).join('\n');

                    const codeContainer = document.createElement('div');
                    codeContainer.className = 'code-block-container';

                    const codeHeader = document.createElement('div');
                    codeHeader.className = 'code-block-header';

                    const languageLabel = document.createElement('span');
                    languageLabel.className = 'code-language';
                    languageLabel.textContent = language || 'code';

                    const copyButton = document.createElement('button');
                    copyButton.className = 'copy-code-btn';
                    copyButton.innerHTML = '<i class="fas fa-copy"></i> Copy';
                    copyButton.onclick = () => {
                        navigator.clipboard.writeText(code).then(() => {
                            copyButton.innerHTML = '<i class="fas fa-check"></i> Copied!';
                            copyButton.classList.add('copied');
                            setTimeout(() => {
                                copyButton.innerHTML = '<i class="fas fa-copy"></i> Copy';
                                copyButton.classList.remove('copied');
                            }, 2000);
                        });
                    };

                    codeHeader.appendChild(languageLabel);
                    codeHeader.appendChild(copyButton);

                    const pre = document.createElement('pre');
                    const codeEl = document.createElement('code');
                    if (language) {
                        codeEl.className = `language-${language}`;
                    }
                    codeEl.textContent = code;
                    pre.appendChild(codeEl);

                    codeContainer.appendChild(codeHeader);
                    codeContainer.appendChild(pre);
                    messageText.appendChild(codeContainer);

                    if (window.hljs) {
                        hljs.highlightElement(codeEl);
                    }
                } else if (part.trim()) {
                    const textDiv = document.createElement('div');
                    textDiv.className = 'text-content';
                    textDiv.innerHTML = processMarkdown(part);
                    messageText.appendChild(textDiv);
                }
            });
        } else {
            messageText.innerHTML = processMarkdown(content);
        }

        messageContent.appendChild(messageText);
        messageDiv.appendChild(messageContent);

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        return messageDiv;
    }

    async function addMessageWithTypewriter(content, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;

        // Create Avatar
        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        const icon = document.createElement('i');
        icon.className = isUser ? 'fas fa-user' : 'fas fa-robot';
        avatar.appendChild(icon);
        messageDiv.appendChild(avatar);

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';

        const messageText = document.createElement('div');
        messageText.className = 'message-text';

        messageContent.appendChild(messageText);
        messageDiv.appendChild(messageContent);

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Process markdown-style formatting
        const processMarkdown = (text) => {
            text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
            text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
            text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
            text = text.replace(/^\s*[-*]\s+(.+)$/gm, '<li>$1</li>');
            text = text.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
            return text;
        };

        // Typewriter effect for text content
        if (content.includes('```')) {
            const parts = content.split(/(```[\s\S]*?```)/g);
            for (const part of parts) {
                if (part.startsWith('```') && part.endsWith('```')) {
                    // Handle code blocks immediately (no typewriter for code)
                    const lines = part.slice(3, -3).split('\n');
                    const language = lines[0].trim();
                    const code = lines.slice(1).join('\n');

                    const codeContainer = document.createElement('div');
                    codeContainer.className = 'code-block-container';

                    const codeHeader = document.createElement('div');
                    codeHeader.className = 'code-block-header';

                    const languageLabel = document.createElement('span');
                    languageLabel.className = 'code-language';
                    languageLabel.textContent = language || 'code';

                    const copyButton = document.createElement('button');
                    copyButton.className = 'copy-code-btn';
                    copyButton.innerHTML = '<i class="fas fa-copy"></i> Copy';
                    copyButton.onclick = () => {
                        navigator.clipboard.writeText(code).then(() => {
                            copyButton.innerHTML = '<i class="fas fa-check"></i> Copied!';
                            copyButton.classList.add('copied');
                            setTimeout(() => {
                                copyButton.innerHTML = '<i class="fas fa-copy"></i> Copy';
                                copyButton.classList.remove('copied');
                            }, 2000);
                        });
                    };

                    codeHeader.appendChild(languageLabel);
                    codeHeader.appendChild(copyButton);

                    const pre = document.createElement('pre');
                    const codeEl = document.createElement('code');
                    if (language) {
                        codeEl.className = `language-${language}`;
                    }
                    codeEl.textContent = code;
                    pre.appendChild(codeEl);

                    codeContainer.appendChild(codeHeader);
                    codeContainer.appendChild(pre);
                    messageText.appendChild(codeContainer);

                    if (window.hljs) {
                        hljs.highlightElement(codeEl);
                    }
                } else if (part.trim()) {
                    // Typewriter effect for regular text
                    const textDiv = document.createElement('div');
                    textDiv.className = 'text-content';
                    messageText.appendChild(textDiv);

                    // Type character by character
                    let index = 0;
                    await new Promise((resolve) => {
                        const interval = setInterval(() => {
                            if (index < part.length) {
                                const char = part.charAt(index);
                                textDiv.innerHTML = processMarkdown(part.substring(0, index + 1));
                                index++;
                                chatMessages.scrollTop = chatMessages.scrollHeight;
                            } else {
                                clearInterval(interval);
                                resolve();
                            }
                        }, 10); // Speed of typing (ms per character)
                    });
                }
            }
        } else {
            // Simple text with typewriter effect
            let index = 0;
            await new Promise((resolve) => {
                const interval = setInterval(() => {
                    if (index < content.length) {
                        messageText.innerHTML = processMarkdown(content.substring(0, index + 1));
                        index++;
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                    } else {
                        clearInterval(interval);
                        resolve();
                    }
                }, 10);
            });
        }

        return messageDiv;
    }

    function addTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message ai-message';

        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        avatar.innerHTML = '<i class="fas fa-robot"></i>';
        typingDiv.appendChild(avatar);

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
        typingDiv.appendChild(contentDiv);

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
                // Add AI response with typewriter effect
                await addMessageWithTypewriter(data.response, false);

                // Save to conversation history
                currentConversation.messages.push(
                    { role: 'user', content: displayMessage },
                    { role: 'assistant', content: data.response }
                );

                // Update conversation title if it's the first message
                if (currentConversation.messages.length === 2 && currentConversation.title === 'New Chat') {
                    // Generate smart title from user message and AI response
                    let title = message;

                    // Try to extract a topic from the AI response
                    const aiResponse = data.response.toLowerCase();

                    // Remove code blocks and markdown for better title extraction
                    const cleanResponse = aiResponse.replace(/```[\s\S]*?```/g, '').trim();

                    // If user asked a question, use the question as title
                    if (message.includes('?')) {
                        title = message.replace(/\?.*/, '?');
                    }
                    // If it's a code request, try to identify the language/topic
                    else if (message.toLowerCase().includes('code') || message.toLowerCase().includes('function') || message.toLowerCase().includes('write')) {
                        const words = message.split(' ');
                        const importantWords = words.filter(w => w.length > 3 && !['write', 'code', 'create', 'make', 'help'].includes(w.toLowerCase()));
                        title = importantWords.slice(0, 4).join(' ');
                    }

                    // Limit title length
                    if (title.length > 35) {
                        title = title.substring(0, 35) + '...';
                    } else if (title.length < 3) {
                        title = message.substring(0, 35) + (message.length > 35 ? '...' : '');
                    }

                    currentConversation.title = title;
                }

                // Update timestamp
                currentConversation.timestamp = Date.now();

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

        // Clear server-side conversation history
        fetch('/api/clear-history', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }).catch(err => console.error('Error clearing history:', err));

        // Clear chat messages
        chatMessages.innerHTML = '';

        // Create new conversation
        currentConversation = {
            id: generateId(),
            title: 'New Chat',
            messages: [],
            timestamp: Date.now()
        };

        // Add welcome message
        addMessage('👋 Welcome to Phoenix AI! How can I help you today?', false);

        // Reset input
        userInput.value = '';
        userInput.style.height = 'auto';
        sendButton.disabled = true;
        currentFiles = [];
        filePreview.innerHTML = '';

        // Update conversation list
        renderConversationList();
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
        renderConversationList();
    }

    function renderConversationList() {
        if (!conversationList) return;

        conversationList.innerHTML = '';

        if (conversations.length === 0) {
            conversationList.innerHTML = '<div class="empty-history"><i class="fas fa-comments"></i><br>No chat history yet<br><small>Start a conversation!</small></div>';
            return;
        }

        conversations.forEach(conv => {
            const convItem = document.createElement('div');
            convItem.className = 'conversation-item';
            if (conv.id === currentConversation.id) {
                convItem.classList.add('active');
            }

            // Get first user message as preview
            const firstMessage = conv.messages.find(m => m.role === 'user');
            const preview = firstMessage ? firstMessage.content.substring(0, 40) : 'New conversation';

            // Format time
            const time = formatTime(conv.timestamp || Date.now());

            convItem.innerHTML = `
                <div class="conversation-icon">
                    <i class="fas fa-comment-dots"></i>
                </div>
                <div class="conversation-details">
                    <div class="conversation-title">${conv.title || 'New Chat'}</div>
                    <div class="conversation-preview">${preview}${firstMessage && firstMessage.content.length > 40 ? '...' : ''}</div>
                </div>
                <div class="conversation-time">${time}</div>
                <button class="conversation-delete" title="Delete conversation">
                    <i class="fas fa-trash"></i>
                </button>
            `;

            // Add click handler for loading conversation
            convItem.addEventListener('click', (e) => {
                // Don't load if clicking delete button
                if (!e.target.closest('.conversation-delete')) {
                    loadConversation(conv.id);
                }
            });

            // Add delete handler
            const deleteBtn = convItem.querySelector('.conversation-delete');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteConversation(conv.id);
            });

            conversationList.appendChild(convItem);
        });
    }

    function loadConversation(convId) {
        const conv = conversations.find(c => c.id === convId);
        if (!conv) return;

        // Save current conversation first
        if (currentConversation.messages.length > 0) {
            saveCurrentConversation();
        }

        // Load selected conversation
        currentConversation = conv;

        // Clear and reload messages
        chatMessages.innerHTML = '';
        conv.messages.forEach(msg => {
            addMessage(msg.content, msg.role === 'user');
        });

        // Update UI
        renderConversationList();
        userInput.focus();
    }

    function deleteConversation(convId) {
        // Confirm deletion
        if (!confirm('Delete this conversation? This cannot be undone.')) {
            return;
        }

        // Remove from conversations array
        conversations = conversations.filter(c => c.id !== convId);
        localStorage.setItem('conversations', JSON.stringify(conversations));

        // If deleting current conversation, start a new one
        if (currentConversation.id === convId) {
            startNewChat();
        } else {
            renderConversationList();
        }
    }

    function formatTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;

        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
});
