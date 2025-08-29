// app.js - Main application logic for the chatbot

// Initialize global state
const state = {
    chatId: null,
    isProcessing: false,
    settings: {
        temperature: 0.7,
        maxTokens: 1024,
        systemPrompt: "You are a helpful assistant that provides accurate and concise answers."
    }
};

// Define API URL
const API_URL = 'http://localhost:8000'; // Adjust if your FastAPI is on a different port
const DB_API_URL = `${API_URL}/db`;
// Cache control headers to prevent 304 responses
const NO_CACHE_HEADERS = {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - initializing chat application');
    
    // Initialize state
    let currentChatId = null;
    let settings = loadSettings();
    applyTheme(settings.theme);

    // DOM Elements
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const mainContent = document.getElementById('main-content');
    const messagesContainer = document.getElementById('messages');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-btn');
    const newChatButton = document.getElementById('new-chat-btn');
    const chatHistory = document.getElementById('chat-history');
    const welcomeContainer = document.getElementById('welcome-container');
    const chatHeader = document.getElementById('chat-header');
    const conversationTitle = document.getElementById('conversation-title');
    const deleteChatButton = document.getElementById('delete-chat-btn');
    const clearChatButton = document.getElementById('clear-chat-btn');
    const typingIndicator = document.getElementById('typing-indicator');
    const docIndicator = document.getElementById('doc-indicator');
    const uploadIcon = document.getElementById('upload-icon');
    const codeIcon = document.getElementById('code-icon');
    
    // Get the toggle button and the quick start container
    const toggleButton = document.getElementById('quick-start-toggle');
    const quickStartContainer = document.getElementById('quick-start-container');

    // Check if required elements exist
    if (!messagesContainer) {
        console.error('Messages container not found. Expected ID: messages');
        showToast('Error', 'Chat interface elements not found. Please check the HTML.', 'error');
        return;
    }
    
    if (!messageInput) {
        console.error('Message input element not found. Expected ID: message-input');
        showToast('Error', 'Chat interface elements not found. Please check the HTML.', 'error');
        return;
    }
    
    if (!sendButton) {
        console.error('Send button element not found. Expected ID: send-btn');
        showToast('Error', 'Chat interface elements not found. Please check the HTML.', 'error');
        return;
    }

    console.log('All required elements found. Setting up the application.');

    // Initialize UI state
    loadChatHistory();
    initializeEventListeners();
    initializeInputTextarea();
    initializeDocumentUpload();
    initializeCodeExecution();
    loadDocumentsList();
    
    // Add initial welcome message if chat is empty
    if (messagesContainer.childNodes.length === 0 && welcomeContainer && welcomeContainer.style.display === 'none') {
        addMessageToUI('bot', 'Hello! I\'m TATVA, Your AI Intern. How can I help you today?');
    }

    // Function to toggle sidebar
    function toggleSidebar() {
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('expanded');
        document.body.classList.toggle('sidebar-collapsed', sidebar.classList.contains('collapsed'));
        
        // Update toggle icon based on sidebar state
        const toggleIcon = sidebarToggle.querySelector('i');
        if (sidebar.classList.contains('collapsed')) {
            toggleIcon.classList.remove('fa-chevron-left');
            toggleIcon.classList.add('fa-chevron-right');
        } else {
            toggleIcon.classList.remove('fa-chevron-right');
            toggleIcon.classList.add('fa-chevron-left');
        }
    }

    // Update startNewChat function
    async function startNewChat() {
    currentChatId = generateUniqueId();
    const defaultTitle = 'New Chat';

    // Create chat in history
    const chatItem = document.createElement('div');
    chatItem.classList.add('chat-item');
    chatItem.dataset.chatId = currentChatId;
    chatItem.innerHTML = `
        <span class="icon"><i class="fas fa-comment"></i></span>
        <span>${defaultTitle}</span>
    `;
    
    if (chatHistory) {
        chatHistory.prepend(chatItem);
        
        // Add click event
        chatItem.addEventListener('click', () => {
            loadChat(currentChatId);
        });

        // Set active chat
        document.querySelectorAll('.chat-item').forEach(item => {
            item.classList.remove('active');
        });
        chatItem.classList.add('active');
    }

    // Clear messages and show chat interface
    messagesContainer.innerHTML = '';
    
    if (welcomeContainer) {
        welcomeContainer.style.display = 'none';
    }
    
    if (chatHeader) {
        chatHeader.style.display = 'flex';
    }
    
    if (conversationTitle) {
        conversationTitle.textContent = defaultTitle;
    }

    // Save to database
    await saveChat(currentChatId, defaultTitle, []);

    // Focus on input
    messageInput.focus();

    // If on mobile, close sidebar
    if (window.innerWidth <= 768 && sidebar) {
        sidebar.classList.remove('active');
    }
    
    // Add initial welcome message
    addMessageToUI('bot', 'Hello! I\'m TATVA, Your AI Intern. How can I help you today?');
}


    // Update loadChatHistory function
    async function loadChatHistory() {
    if (!settings.saveHistory || !chatHistory) {
        if (chatHistory) chatHistory.innerHTML = '';
        return;
    }

    try {
        const chats = await getAllChats();
        chatHistory.innerHTML = '';

        if (chats.length === 0) {
            return;
        }

        // Add chat items to sidebar
        chats.forEach(chat => {
            const chatId = chat.conversation_id || chat.id;
            const chatItem = document.createElement('div');
            chatItem.classList.add('chat-item');
            chatItem.dataset.chatId = chatId;
            chatItem.innerHTML = `
                <span class="icon"><i class="fas fa-comment"></i></span>
                <span>${chat.title}</span>
            `;
            chatHistory.appendChild(chatItem);

            // Add click event
            chatItem.addEventListener('click', () => {
                loadChat(chatId);
            });
        });
    } catch (error) {
        console.error('Error loading chat history:', error);
        showToast('Error', 'Failed to load chat history', 'error');
    }
}


    // Improved loadChat function with better error handling
async function loadChat(chatId) {
    try {
        const chat = await getChat(chatId);
        if (!chat) {
            console.warn(`Chat ${chatId} not found or failed to load. Starting a new chat.`);
            await startNewChat();
            return;
        }

        currentChatId = chatId;

        // Update UI
        document.querySelectorAll('.chat-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeChatItem = document.querySelector(`.chat-item[data-chat-id="${chatId}"]`);
        if (activeChatItem) {
            activeChatItem.classList.add('active');
        }

        // Clear messages and add from history
        messagesContainer.innerHTML = '';
        
        if (welcomeContainer) {
            welcomeContainer.style.display = 'none';
        }
        
        if (chatHeader) {
            chatHeader.style.display = 'flex';
        }
        
        if (conversationTitle) {
            conversationTitle.textContent = chat.title;
        }

        // Add messages
        if (chat.messages && Array.isArray(chat.messages)) {
            chat.messages.forEach(msg => {
                addMessageToUI(msg.role, msg.content);
            });
        } else {
            console.warn('Chat has no messages or messages is not an array');
        }

        // Scroll to bottom
        scrollToBottom();

        // If on mobile, close sidebar
        if (window.innerWidth <= 768 && sidebar) {
            sidebar.classList.remove('active');
        }
    } catch (error) {
        console.error(`Error loading chat ${chatId}:`, error);
        showToast('Error', `Failed to load chat: ${error.message}`, 'error');
        // Fall back to starting a new chat
        await startNewChat();
    }
}

    // Improved handleSendMessage with better error handling and request validation
async function handleSendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;

    // Clear input
    messageInput.value = '';
    adjustTextareaHeight();

    // If no current chat or chat ID is invalid, create a new one
    if (!currentChatId) {
        console.log('No current chat ID. Starting a new chat.');
        await startNewChat();
    }

    // Add user message to UI immediately
    addMessageToUI('user', message);

    // Attempt to update chat messages in storage
    try {
        await updateChatMessages(currentChatId, { role: 'user', content: message });
    } catch (error) {
        console.error('Failed to update chat history:', error);
        // Continue anyway - UI already updated
    }

    // Update title if appropriate
    try {
        const chat = await getChat(currentChatId);
        if (chat && chat.messages && chat.messages.length === 1) {
            const newTitle = message.substring(0, 30) + (message.length > 30 ? '...' : '');
            await updateChatTitle(currentChatId, newTitle);
            
            if (conversationTitle) {
                conversationTitle.textContent = newTitle;
            }
            
            const chatItemTitle = document.querySelector(`.chat-item[data-chat-id="${currentChatId}"] span:not(.icon)`);
            if (chatItemTitle) {
                chatItemTitle.textContent = newTitle;
            }
        }
    } catch (error) {
        console.warn('Error updating chat title:', error);
        // Non-critical, can continue
    }

    // Show typing indicator
    showTypingIndicator();
    scrollToBottom();

    try {
        // Check if documents should be used
        const useDocuments = settings.useDocuments || 
                          (document.getElementById('use-docs-toggle') && 
                          document.getElementById('use-docs-toggle').checked);
        
        let systprompt = settings.systemPrompt;
        if(document.getElementById('system-prompt') && 
        document.getElementById('system-prompt').value.length > 0){
            systprompt = document.getElementById('system-prompt').value;    
        }
        
        // Prepare form data for the request
        const formData = new FormData();
        formData.append('message', message);
        formData.append('chat_id', currentChatId || '');
        formData.append('use_docs', useDocuments);
        formData.append('system_prompt', systprompt);

        console.log('Sending message to API:', message);
        console.log('Using chat ID:', currentChatId);
        console.log('API endpoint:', `${API_URL}/chat`);

        // Set a timeout for the fetch request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 300000); // 30 second timeout

        // Send to API using the correct endpoint
        const response = await fetch(`${API_URL}/chat`, {
            method: 'POST',
            body: formData,
            signal: controller.signal
        });

        clearTimeout(timeoutId); // Clear the timeout if the request completes

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server error (${response.status}): ${errorText || response.statusText}`);
        }

        const data = await response.json();
        console.log('Received response:', data);

        // Hide typing indicator
        hideTypingIndicator();

        // Add bot message to UI
        if (data && data.response) {
            addMessageToUI('bot', data.response);
            
            // Update message history in storage
            await updateChatMessages(currentChatId, { role: 'bot', content: data.response });
        } else {
            throw new Error('Invalid response from server');
        }

    } catch (error) {
        console.error('Error sending message:', error);

        // Hide typing indicator
        hideTypingIndicator();

        // Show appropriate error message
        let errorMessage = 'Sorry, there was an error processing your request. Please try again.';
        if (error.name === 'AbortError') {
            errorMessage = 'Request timed out. The server took too long to respond.';
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Cannot connect to the server. Please check your connection.';
        }
        
        addMessageToUI('bot', errorMessage);
        showToast('Error', error.message, 'error');
    }

    // Scroll to bottom
    scrollToBottom();
}

    // Function to add a message to the UI
    function addMessageToUI(role, content) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', role === 'user' ? 'user-message' : 'bot-message');

        // Create message content based on role
        if (role === 'user') {
            messageElement.innerHTML = `
                <div class="message-content">
                    <div class="message-text">${formatMessage(content)}</div>
                </div>
            `;
        } else {
            messageElement.innerHTML = `
                <div class="avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">
                    <div class="message-text">${formatMessage(content)}</div>
                    <div class="message-actions">
                        <button class="action-btn copy-btn" title="Copy to clipboard">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                    </div>
                </div>
            `;
        }

        messagesContainer.appendChild(messageElement);
        console.log(`${role} message added to chat:`, content.substring(0, 50) + (content.length > 50 ? '...' : ''));

        // Add copy functionality
        const copyBtn = messageElement.querySelector('.copy-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                // Create a text version of the content for copying
                const textContent = content.replace(/```.*?```/gs, codeBlock => {
                    return codeBlock.replace(/```(\w+)?\n/g, '').replace(/```/g, '');
                });

                navigator.clipboard.writeText(textContent)
                    .then(() => showToast('Copied', 'Text copied to clipboard', 'success'))
                    .catch(err => showToast('Error', 'Failed to copy text', 'error'));
            });
        }

        // Apply syntax highlighting to code blocks
        if (typeof Prism !== 'undefined') {
            messageElement.querySelectorAll('pre code').forEach(block => {
                Prism.highlightElement(block);
            });
        }

        // Add run button functionality for Python code
        messageElement.querySelectorAll('.run-code-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const codeBlock = this.closest('.code-block');
                const codeContent = codeBlock.querySelector('code').textContent;

                // Show loading state
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Running...';
                this.disabled = true;

                // Remove previous result if any
                const prevResult = codeBlock.nextElementSibling;
                if (prevResult && prevResult.classList.contains('code-result')) {
                    prevResult.remove();
                }

                try {
                    const response = await fetch(`${API_URL}/api/execute-code`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ code: codeContent })
                    });

                    const data = await response.json();

                    // Create result element
                    const resultElement = document.createElement('div');
                    resultElement.classList.add('code-result');

                    if (data.error) {
                        resultElement.classList.add('error');
                        resultElement.textContent = data.error;
                    } else {
                        resultElement.textContent = data.output || '(No output)';
                    }

                    // Insert result after code block
                    codeBlock.insertAdjacentElement('afterend', resultElement);

                } catch (error) {
                    console.error('Error executing code:', error);
                    showToast('Error', 'Failed to execute code', 'error');
                }

                // Reset button
                this.innerHTML = '<i class="fas fa-play"></i> Run';
                this.disabled = false;
            });
        });
    }

    // Show typing indicator
    function showTypingIndicator() {
        // First check for the dedicated typing indicator element
        if (typingIndicator) {
            typingIndicator.style.display = 'flex';
            return;
        }
        
        // If no dedicated element, create a dynamic one
        hideTypingIndicator(); // Remove any existing one first
        
        const typingElement = document.createElement('div');
        typingElement.className = 'message bot-message typing-indicator';
        typingElement.id = 'chat-typing-indicator';
        
        typingElement.innerHTML = `
            <div class="avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        messagesContainer.appendChild(typingElement);
    }

    // Hide typing indicator
    function hideTypingIndicator() {
        // First check for the dedicated typing indicator element
        if (typingIndicator) {
            typingIndicator.style.display = 'none';
            return;
        }
        
        // If no dedicated element, remove the dynamic one
        const typingIndicatorElement = document.getElementById('chat-typing-indicator');
        if (typingIndicatorElement) {
            typingIndicatorElement.remove();
        }
    }

    // Format message text with markdown-like syntax
    function formatMessage(text) {
        // Process code blocks first
        text = processCodeBlocks(text);
        
        // Convert URLs to links
        text = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
        
        // Convert inline code
        text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Convert line breaks
        text = text.replace(/\n/g, '<br>');
        
        return text;
    }

    // Process code blocks with special formatting
    function processCodeBlocks(content) {
        // Regular expression to match code blocks
        const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;

        // Replace code blocks with formatted HTML
        return content.replace(codeBlockRegex, (match, language, code) => {
            const lang = language || 'plaintext';
            return `
                <div class="code-block">
                    <div class="code-header">
                        <div class="code-language">${lang}</div>
                        <div class="code-actions">
                            <button class="code-action-btn copy-code-btn" title="Copy code">
                                <i class="fas fa-copy"></i>
                            </button>
                            ${lang === 'python' ? `
                                <button class="code-action-btn run-code-btn" title="Run code">
                                    <i class="fas fa-play"></i> Run
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    <pre class="code-content"><code class="language-${lang}">${escapeHtml(code)}</code></pre>
                </div>
            `;
        });
    }

    // Initialize textarea auto-resize
    function initializeInputTextarea() {
        if (!messageInput) return;
        
        messageInput.addEventListener('input', adjustTextareaHeight);
        
        // Initial adjustment
        adjustTextareaHeight();
    }
    
    function adjustTextareaHeight() {
        messageInput.style.height = 'auto';
        messageInput.style.height = (messageInput.scrollHeight) + 'px';

        // Enable/disable send button based on content
        if (sendButton) {
            sendButton.disabled = messageInput.value.trim() === '';
        }
    }

    // Initialize document upload functionality
    function initializeDocumentUpload() {
        if (!uploadIcon) return;
        
        const fileInput = document.createElement('input');
        
        // Set up the hidden file input
        fileInput.type = 'file';
        fileInput.id = 'file-input';
        fileInput.style.display = 'none';
        fileInput.accept = '.pdf,.docx,.txt,.md,.csv,.json';
        document.body.appendChild(fileInput);
        
        // When upload icon is clicked, trigger the file input directly
        uploadIcon.addEventListener('click', () => {
            fileInput.click();
        });
        
        // Handle file selection and immediate upload
        fileInput.addEventListener('change', async (event) => {
            if (event.target.files.length > 0) {
                const file = event.target.files[0];
                await uploadDocument(file);
                
                // Reset the file input for future uploads
                fileInput.value = '';
            }
        });
    }

    // Function to handle document upload
    async function uploadDocument(file) {
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            // Show loading message in chat
            if (currentChatId === null) {
                startNewChat();
            }
            addMessageToUI('user', `Uploading document: ${file.name}`);
            
            // Show document indicator
            if (docIndicator) {
                docIndicator.style.display = 'flex';
            }
            scrollToBottom();
            
            const response = await fetch(`${API_URL}/upload`, {
                method: 'POST',
                body: formData
            });
            
            // Hide document indicator
            if (docIndicator) {
                docIndicator.style.display = 'none';
            }
            
            if (response.ok) {
                const result = await response.json();
                addMessageToUI('bot', `Document uploaded and processed successfully. You can now ask questions about ${file.name}.`);
                
                // Update chat history
                updateChatMessages(currentChatId, { 
                    role: 'bot', 
                    content: `Document uploaded and processed successfully. You can now ask questions about ${file.name}.` 
                });
                
            } else {
                const error = await response.json();
                addMessageToUI('bot', `Error uploading document: ${error.message}`);
                updateChatMessages(currentChatId, { 
                    role: 'bot', 
                    content: `Error uploading document: ${error.message}` 
                });
                showToast('Error', error.message, 'error');
            }
        } catch (error) {
            if (docIndicator) {
                docIndicator.style.display = 'none';
            }
            addMessageToUI('bot', `Error uploading document: ${error.message}`);
            updateChatMessages(currentChatId, { 
                role: 'bot', 
                content: `Error uploading document: ${error.message}` 
            });
            showToast('Error', error.message, 'error');
        }
    }

    // Initialize code execution functionality
    function initializeCodeExecution() {
        if (!codeIcon || !messageInput) return;
        
        codeIcon.addEventListener('click', () => {
            // Toggle code execution mode
            const isCodeMode = messageInput.getAttribute('data-mode') === 'code';
            
            if (isCodeMode) {
                // Switch back to normal chat mode
                messageInput.setAttribute('data-mode', 'chat');
                messageInput.placeholder = 'Type a message...';
                codeIcon.classList.remove('active');
            } else {
                // Switch to code execution mode
                messageInput.setAttribute('data-mode', 'code');
                messageInput.placeholder = 'Enter Python code to execute...';
                codeIcon.classList.add('active');
            }
            
            messageInput.focus();
        });
    }

    // Function to load document list
    function loadDocumentsList() {
        // Try to fetch the document count from the server
        fetch(`${API_URL}/documents`, {
            method: 'GET',
            headers: NO_CACHE_HEADERS
        })
            .then(response => {
                if (!response.ok) {
                    // Silently fail for now, documents feature optional
                    return { documents: [] };
                }
                return response.json();
            })
            .then(data => {
                const docsContainer = document.getElementById('docs-container');
                if (docsContainer) {
                    if (data.documents && data.documents.length > 0) {
                        docsContainer.style.display = 'block';
                    } else {
                        docsContainer.style.display = 'none';
                    }
                }
            })
            .catch(error => {
                console.error('Error loading documents:', error);
                // Hide the documents container on error
                const docsContainer = document.getElementById('docs-container');
                if (docsContainer) {
                    docsContainer.style.display = 'none';
                }
            });
    }

    // Function for event listeners
    function initializeEventListeners() {
        // Send message when send button is clicked
        if (sendButton) {
            sendButton.addEventListener('click', handleSendMessage);
            // Initially disable send button until text is entered
            sendButton.disabled = true;
        }
        
        // Send message when Enter key is pressed (without Shift)
        if (messageInput) {
            messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (sendButton && !sendButton.disabled) {
                        handleSendMessage();
                    }
                }
            });
        }
        
        // Start new chat
        if (newChatButton) {
            newChatButton.addEventListener('click', startNewChat);
        }
        
        // Delete current chat
        if (deleteChatButton) {
            deleteChatButton.addEventListener('click', () => {
                if (currentChatId && confirm('Are you sure you want to delete this chat?')) {
                    deleteChat(currentChatId);
                    currentChatId = null;
                    
                    if (welcomeContainer) {
                        welcomeContainer.style.display = 'flex';
                    }
                    
                    if (chatHeader) {
                        chatHeader.style.display = 'none';
                    }
                    
                    messagesContainer.innerHTML = '';
                    loadChatHistory();
                }
            });
        }
        
        // Clear chat messages
        if (clearChatButton) {
            clearChatButton.addEventListener('click', () => {
                if (currentChatId && confirm('Are you sure you want to clear all messages?')) {
                    updateChatMessages(currentChatId, null, true);
                    messagesContainer.innerHTML = '';
                }
            });
        }
        
        
        
        // Toggle sidebar on mobile
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', toggleSidebar);
        }
        
        // Toggle quick start guide (if present)
        if (toggleButton && quickStartContainer) {
            toggleButton.addEventListener('click', function() {
                const isExpanded = quickStartContainer.classList.contains('expanded');
                
                if (isExpanded) {
                    quickStartContainer.classList.remove('expanded');
                    toggleButton.innerHTML = '<i class="fas fa-chevron-down"></i>';
                } else {
                    quickStartContainer.classList.add('expanded');
                    toggleButton.innerHTML = '<i class="fas fa-chevron-up"></i>';
                }
            });
        }
    }

    // Utility function to scroll to bottom of messages
    function scrollToBottom() {
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    // Utility function to escape HTML
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Utility function to show toast notifications
    function showToast(title, message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        toast.innerHTML = `
            <div class="toast-header">
                <strong>${title}</strong>
                <button class="toast-close">&times;</button>
            </div>
            <div class="toast-body">${message}</div>
        `;
        
        document.body.appendChild(toast);
        
        // Show toast with animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Add close button functionality
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        });
        
        // Auto dismiss after 5 seconds
        setTimeout(() => {
            if (document.body.contains(toast)) {
                toast.classList.remove('show');
                setTimeout(() => {
                    if (document.body.contains(toast)) {
                        toast.remove();
                    }
                }, 300);
            }
        }, 5000);
    }

    // Local storage functions
    function generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    async function saveChat(id, title, messages = []) {
        
        if (!settings.saveHistory) return;
        
        
        // const chats = getAllChats();
        // const existingChatIndex = chats.findIndex(chat => chat.id === id);
        if (!id) {
            console.error('Cannot save chat: Missing ID');
            throw new Error('Missing chat ID');
        }
        const chatData = {
            id,
            title,
            messages,
            timestamp: Date.now()
        };
        
        
        try {
            console.log(`Saving chat ${id} to database`);
            const response = await fetch(`${DB_API_URL}/save-chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...NO_CACHE_HEADERS
                },
                body: JSON.stringify(chatData)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error('Failed to save chat to database');
            }
            const result = await response.json();
            console.log(`Chat ${id} saved successfully:`, result);
            return result;
        } catch (error) {
            // console.error('Error saving chat:', error);
            // showToast('Error', 'Failed to save chat history', 'error');
            console.error(`Error saving chat ${id}:`, error);
            showToast('Error', `Failed to save chat: ${error.message}`, 'error');
            throw error; // Re-throw for the caller to handle if needed
        }
        
    }

    

    // Replace getChat function
    async function getChat(id) {
        try {
            const response = await fetch(`${DB_API_URL}/get-chat/${id}`, {
            method: 'GET',
            headers: NO_CACHE_HEADERS
            });
        
            if (!response.ok) {
                if (response.status === 404) {
                    console.warn(`Chat with ID ${id} not found. Creating a new chat.`);
                    return null; // Return null instead of throwing an error for 404
                }
                throw new Error('Failed to retrieve chat from database');
         }
        
            return await response.json();
        } catch (error) {
            console.error(`Error getting chat ${id}:`, error.message);
            showToast('Error', `Failed to load chat: ${error.message}`, 'error');
            return null;
        }
    }
    
    // Replace the getAllChats function
    async function getAllChats() {
     try {
            const response = await fetch(`${DB_API_URL}/get-all-chats`, {
                method: 'GET',
                headers: NO_CACHE_HEADERS
            });
        
         if (!response.ok) {
                throw new Error('Failed to retrieve chats from database');
            }
        
            const data = await response.json();
            console.log(data)
            return data || [];
        } catch (error) {
            console.error('Error getting all chats:', error);
            return [];
        }
    }
    // Update updateChatTitle function
    async function updateChatTitle(id, title) {
        try {
            const chat = await getChat(id);
            if (chat) {
                chat.title = title;
                await saveChat(id, title, chat.messages);
            }
        } catch (error) {
            console.error('Error updating chat title:', error);
            showToast('Error', 'Failed to update chat title', 'error');
        }
    }

    // Update updateChatMessages function
    async function updateChatMessages(id, message, clear = false) {
        try {
            if (!id) {
                console.warn('Cannot update messages: Invalid chat ID');
                return;
            }
            const chat = await getChat(id);
            // if (!chat) return;
            if (!chat) {
                console.warn(`Chat ${id} not found. Creating new chat before updating messages.`);
                // Create a new chat if needed
                await saveChat(id, 'New Chat', message ? [message] : []);
                return;
            }
            // Update messages
            let updatedMessages = chat.messages || [];
        
            if (clear) {
                chat.messages = [];
            } else if (message) {
                updatedMessages.push(message);
            }
        
            await saveChat(id, chat.title, chat.messages);
        } catch (error) {
            // console.error('Error updating chat messages:', error);
            // showToast('Error', 'Failed to update chat messages', 'error');
            console.error(`Error updating chat messages for ${id}:`, error);
            throw error; // Re-throw for the caller to handle if needed
        
        }
    }
    
    async function deleteChat(id) {
        if (!settings.saveHistory) return;
    
        try {
            const response = await fetch(`${DB_API_URL}/delete-chat/${id}`, {
                method: 'DELETE',
                headers: NO_CACHE_HEADERS
            });
        
            if (!response.ok) {
                throw new Error('Failed to delete chat from database');
            }
        
            // Refresh chat history UI
            loadChatHistory();
        } catch (error) {
            console.error('Error deleting chat:', error);
            showToast('Error', 'Failed to delete chat', 'error');
        }
    }

    function loadSettings() {
        const defaultSettings = {
            theme: 'light',
            saveHistory: true,
            useDocuments: false,
            systemPrompt: "You are a helpful assistant that provides accurate and concise answers."
        };
        
        const savedSettings = localStorage.getItem('appSettings');
        return savedSettings ? {...defaultSettings, ...JSON.parse(savedSettings)} : defaultSettings;
    }

    function saveSettings(newSettings) {
        console.log(newSettings)
        settings = {...settings, ...newSettings};
        localStorage.setItem('appSettings', JSON.stringify(settings));
        
        // Apply settings
        applyTheme(settings.theme);
    }

    function applyTheme(theme) {
        document.body.setAttribute('data-theme', theme);
    }
});
// Add a console log to help with debugging
console.log('app.js loaded successfully'); 