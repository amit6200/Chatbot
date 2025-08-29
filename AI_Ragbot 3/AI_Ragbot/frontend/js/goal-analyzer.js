// Goal Analyzer JavaScript (js/goal-analyzer.js)

class GoalAnalyzer {
    constructor() {
        this.uploadedFiles = [];
        this.isAnalyzing = false;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Goal Analyzer button click
        const goalAnalyzerBtn = document.getElementById('goal-analyzer-btn');
        if (goalAnalyzerBtn) {
            goalAnalyzerBtn.addEventListener('click', () => this.showGoalAnalyzer());
        }

        // File upload events
        const goalFileInput = document.getElementById('goal-file-input');
        const goalBrowseBtn = document.getElementById('goal-browse-btn');
        const goalDropZone = document.getElementById('goal-drop-zone');
        const analyzeBtn = document.getElementById('analyze-goals-btn');
        const backBtn = document.getElementById('back-to-main-btn');

        if (goalFileInput) {
            goalFileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }

        if (goalBrowseBtn) {
            goalBrowseBtn.addEventListener('click', () => goalFileInput?.click());
        }

        if (goalDropZone) {
            goalDropZone.addEventListener('click', () => goalFileInput?.click());
            goalDropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
            goalDropZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            goalDropZone.addEventListener('drop', (e) => this.handleDrop(e));
        }

        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => this.analyzeGoals());
        }

        if (backBtn) {
            backBtn.addEventListener('click', () => this.backToMain());
        }
    }

    showGoalAnalyzer() {
        // Hide welcome container and show goal analyzer
        const welcomeContainer = document.getElementById('welcome-container');
        const goalAnalyzerContainer = document.getElementById('goal-analyzer-container');
        const chatHeader = document.getElementById('chat-header');
        const backBtn = document.getElementById('back-to-main-btn');

        if (welcomeContainer) welcomeContainer.style.display = 'none';
        if (goalAnalyzerContainer) goalAnalyzerContainer.style.display = 'block';
        if (chatHeader) chatHeader.style.display = 'flex';
        if (backBtn) backBtn.style.display = 'block';

        // Update conversation title
        const conversationTitle = document.getElementById('conversation-title');
        if (conversationTitle) {
            conversationTitle.textContent = 'Goal Analyzer';
        }

        // Set global mode flag if it exists
        if (typeof window.isGoalAnalyzerMode !== 'undefined') {
            window.isGoalAnalyzerMode = true;
        }
        
        this.clearUploadedFiles();
    }

    backToMain() {
        // Show welcome container and hide goal analyzer
        const welcomeContainer = document.getElementById('welcome-container');
        const goalAnalyzerContainer = document.getElementById('goal-analyzer-container');
        const chatHeader = document.getElementById('chat-header');
        const backBtn = document.getElementById('back-to-main-btn');
        const messages = document.getElementById('messages');

        if (welcomeContainer) welcomeContainer.style.display = 'block';
        if (goalAnalyzerContainer) goalAnalyzerContainer.style.display = 'none';
        if (chatHeader) chatHeader.style.display = 'none';
        if (backBtn) backBtn.style.display = 'none';
        if (messages) messages.style.display = 'none';

        // Reset conversation title
        const conversationTitle = document.getElementById('conversation-title');
        if (conversationTitle) {
            conversationTitle.textContent = 'Chat Assistant';
        }

        // Reset global mode flag if it exists
        if (typeof window.isGoalAnalyzerMode !== 'undefined') {
            window.isGoalAnalyzerMode = false;
        }

        // Clear any uploaded files
        this.clearUploadedFiles();
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        const dropZone = document.getElementById('goal-drop-zone');
        if (dropZone) {
            dropZone.classList.add('dragover');
        }
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        const dropZone = document.getElementById('goal-drop-zone');
        if (dropZone) {
            dropZone.classList.remove('dragover');
        }
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        const dropZone = document.getElementById('goal-drop-zone');
        if (dropZone) {
            dropZone.classList.remove('dragover');
        }

        const files = Array.from(e.dataTransfer.files);
        this.processFiles(files);
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.processFiles(files);
    }

    processFiles(files) {
        const validFiles = files.filter(file => this.isValidFile(file));
        
        if (validFiles.length === 0) {
            this.showToast('Please select valid files (PDF, DOCX, TXT, JSON, CSV, Excel)', 'error');
            return;
        }

        validFiles.forEach(file => {
            if (!this.uploadedFiles.find(f => f.name === file.name)) {
                this.uploadedFiles.push({
                    file: file,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    id: Date.now() + Math.random()
                });
            }
        });

        this.updateFilesList();
        this.showUploadedFilesSection();
    }

    isValidFile(file) {
        const validTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'text/plain',
            'application/json',
            'text/csv',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ];

        const validExtensions = ['.pdf', '.docx', '.doc', '.txt', '.json', '.csv', '.xlsx', '.xls'];
        const extension = '.' + file.name.split('.').pop().toLowerCase();

        return validTypes.includes(file.type) || validExtensions.includes(extension);
    }

    getFileIcon(fileName) {
        const extension = fileName.split('.').pop().toLowerCase();
        const iconMap = {
            'pdf': { icon: 'fas fa-file-pdf', class: 'pdf' },
            'doc': { icon: 'fas fa-file-word', class: 'doc' },
            'docx': { icon: 'fas fa-file-word', class: 'doc' },
            'txt': { icon: 'fas fa-file-alt', class: 'txt' },
            'json': { icon: 'fas fa-file-code', class: 'json' },
            'csv': { icon: 'fas fa-file-csv', class: 'csv' },
            'xlsx': { icon: 'fas fa-file-excel', class: 'excel' },
            'xls': { icon: 'fas fa-file-excel', class: 'excel' }
        };

        return iconMap[extension] || { icon: 'fas fa-file', class: 'txt' };
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    updateFilesList() {
        const filesList = document.getElementById('goal-files-list');
        if (!filesList) return;

        filesList.innerHTML = '';

        this.uploadedFiles.forEach(fileData => {
            const fileItem = document.createElement('div');
            fileItem.className = 'goal-file-item';
            
            const iconData = this.getFileIcon(fileData.name);
            
            fileItem.innerHTML = `
                <div class="goal-file-info">
                    <div class="file-icon ${iconData.class}">
                        <i class="${iconData.icon}"></i>
                    </div>
                    <div class="file-details">
                        <div class="file-name">${fileData.name}</div>
                        <div class="file-size">${this.formatFileSize(fileData.size)}</div>
                    </div>
                </div>
                <button class="remove-file-btn" onclick="goalAnalyzer.removeFile('${fileData.id}')">
                    <i class="fas fa-times"></i>
                </button>
            `;

            filesList.appendChild(fileItem);
        });
    }

    showUploadedFilesSection() {
        const uploadedFilesSection = document.getElementById('uploaded-goal-files');
        if (uploadedFilesSection) {
            uploadedFilesSection.style.display = 'block';
        }
    }

    removeFile(fileId) {
        this.uploadedFiles = this.uploadedFiles.filter(f => f.id !== fileId);
        this.updateFilesList();
        
        if (this.uploadedFiles.length === 0) {
            const uploadedFilesSection = document.getElementById('uploaded-goal-files');
            if (uploadedFilesSection) {
                uploadedFilesSection.style.display = 'none';
            }
        }
    }

    clearUploadedFiles() {
        this.uploadedFiles = [];
        const uploadedFilesSection = document.getElementById('uploaded-goal-files');
        const filesList = document.getElementById('goal-files-list');
        
        if (uploadedFilesSection) {
            uploadedFilesSection.style.display = 'none';
        }
        if (filesList) {
            filesList.innerHTML = '';
        }
    }

    async analyzeGoals() {
        if (this.uploadedFiles.length === 0) {
            this.showToast('Please upload at least one file to analyze', 'error');
            return;
        }

        if (this.isAnalyzing) {
            return;
        }

        this.isAnalyzing = true;
        const analyzeBtn = document.getElementById('analyze-goals-btn');
        if (analyzeBtn) {
            analyzeBtn.disabled = true;
            analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
        }

        try {
            // Show chat interface
            this.showChatInterface();
            
            // Upload files and get analysis
            const analysisResult = await this.uploadAndAnalyzeFiles();
            
            // Display analysis in chat
            this.displayAnalysisResult(analysisResult);
            
        } catch (error) {
            console.error('Analysis error:', error);
            this.showToast('Error analyzing files. Please try again.', 'error');
            // Return to goal analyzer view on error
            this.showGoalAnalyzer();
        } finally {
            this.isAnalyzing = false;
            if (analyzeBtn) {
                analyzeBtn.disabled = false;
                analyzeBtn.innerHTML = '<i class="fas fa-search"></i> Analyze Goals';
            }
        }
    }

   showChatInterface() {
    const goalAnalyzerContainer = document.getElementById('goal-analyzer-container');
    const messages = document.getElementById('messages');
    const chatHeader = document.getElementById('chat-header');
    const backBtn = document.getElementById('back-to-main-btn');

    if (goalAnalyzerContainer) goalAnalyzerContainer.style.display = 'none';
    if (messages) messages.style.display = 'block';
    if (chatHeader) chatHeader.style.display = 'flex';
    if (backBtn) backBtn.style.display = 'block';

    // Clear existing messages
    if (messages) {
        messages.innerHTML = '';

        // Default assistant welcome message
        const welcomeMessage = this.createMessageElement(
            'assistant',
            `Hello! I'm <strong>TATVA</strong>, your AI Intern for <strong>Goal Analyzer</strong>.<br>How can I help you today?`
        );
        messages.appendChild(welcomeMessage);
    }

    // Update conversation title
    const conversationTitle = document.getElementById('conversation-title');
    if (conversationTitle) {
        conversationTitle.textContent = 'Goal Analysis Results';
    }
}


    async uploadAndAnalyzeFiles() {
        const formData = new FormData();
        
        // Add files to form data
        this.uploadedFiles.forEach((fileData, index) => {
            formData.append(`files`, fileData.file);
        });
        
        // Add analysis type
        formData.append('analysis_type', 'goal_analysis');
        
        const response = await fetch('/api/analyze-goals', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    displayAnalysisResult(result) {
        const messages = document.getElementById('messages');
        if (!messages) return;

        // Add user message
        const userMessage = this.createMessageElement('user', `Analyzing ${this.uploadedFiles.length} files for goal insights...`);
        messages.appendChild(userMessage);

        // Add assistant response
        const assistantMessage = this.createMessageElement('assistant', result.analysis || 'Analysis completed successfully!');
        messages.appendChild(assistantMessage);

        // Auto-scroll to bottom
        messages.scrollTop = messages.scrollHeight;

        // Show back button and update header
        const backBtn = document.getElementById('back-to-main-btn');
        if (backBtn) backBtn.style.display = 'block';
    }

    createMessageElement(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = role === 'user' ? 
            '<i class="fas fa-user"></i>' : 
            '<i class="fas fa-robot"></i>';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const messageText = document.createElement('div');
        messageText.className = 'message-text';
        messageText.innerHTML = this.formatMessageContent(content);
        
        messageContent.appendChild(messageText);
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        
        return messageDiv;
    }

    formatMessageContent(content) {
        // Basic markdown-like formatting
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }

    showToast(message, type = 'info') {
        // Create toast container if it doesn't exist
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                pointer-events: none;
            `;
            document.body.appendChild(toastContainer);
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            background: ${type === 'error' ? '#ff4444' : type === 'success' ? '#44ff44' : '#4444ff'};
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            margin-bottom: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            pointer-events: auto;
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-width: 300px;
            animation: slideIn 0.3s ease-out;
        `;

        toast.innerHTML = `
            <span>${message}</span>
            <button class="toast-close" style="
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                margin-left: 10px;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            ">&times;</button>
        `;

        // Close button functionality
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            toast.remove();
        });

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 5000);

        toastContainer.appendChild(toast);
    }

    // Method to refresh the analyzer (useful for external calls)
    refresh() {
        this.clearUploadedFiles();
        this.isAnalyzing = false;
    }

    // Method to check if analyzer is currently active
    isActive() {
        const goalAnalyzerContainer = document.getElementById('goal-analyzer-container');
        return goalAnalyzerContainer && goalAnalyzerContainer.style.display !== 'none';
    }

    // Method to get current uploaded files count
    getFileCount() {
        return this.uploadedFiles.length;
    }
}

// Add CSS animation for toast
if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
}

// Initialize Goal Analyzer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.goalAnalyzer = new GoalAnalyzer();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GoalAnalyzer;
}
// Add this to your existing JavaScript file (likely in js/goal-analyzer.js or js/app.js)

// Goal Analyzer Button Click Handler
document.addEventListener('DOMContentLoaded', function() {
    const goalAnalyzerBtn = document.getElementById('goal-analyzer-btn');
    const welcomeContainer = document.getElementById('welcome-container');
    const goalAnalyzerContainer = document.getElementById('goal-analyzer-container');
    const messagesContainer = document.getElementById('messages');
    const chatHeader = document.getElementById('chat-header');

    if (goalAnalyzerBtn) {
        goalAnalyzerBtn.addEventListener('click', function() {
            // Hide welcome container and show goal analyzer
            if (welcomeContainer) {
                welcomeContainer.style.display = 'none';
            }
            
            if (goalAnalyzerContainer) {
                goalAnalyzerContainer.style.display = 'block';
            }

            // Show chat header
            if (chatHeader) {
                chatHeader.style.display = 'flex';
                const conversationTitle = document.getElementById('conversation-title');
                if (conversationTitle) {
                    conversationTitle.textContent = 'Goal Analyzer';
                }
            }

            // Add custom greeting message for Goal Analyzer
            addGoalAnalyzerGreeting();
            
            // Set goal analyzer mode
            isGoalAnalyzerMode = true;
            
            // Update any other UI elements as needed
            updateUIForGoalAnalyzer();
        });
    }
});

// Function to add the custom Goal Analyzer greeting
function addGoalAnalyzerGreeting() {
    const messagesContainer = document.getElementById('messages');
    if (!messagesContainer) return;

    // Clear existing messages if any
    messagesContainer.innerHTML = '';

    // Create the custom greeting message
    const greetingMessage = createMessageElement(
        "Hello! I'm TATVA, Your AI Intern for goal analyzer. How can I help you today?",
        'assistant',
        new Date().toISOString()
    );

    messagesContainer.appendChild(greetingMessage);
    
    // Scroll to the message
    scrollToBottom();
}

// Function to create a message element (if not already exists in your codebase)
function createMessageElement(content, sender, timestamp) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    const messageText = document.createElement('div');
    messageText.className = 'message-text';
    messageText.textContent = content;
    
    const messageTime = document.createElement('div');
    messageTime.className = 'message-time';
    messageTime.textContent = new Date(timestamp).toLocaleTimeString();
    
    messageContent.appendChild(messageText);
    messageContent.appendChild(messageTime);
    messageDiv.appendChild(messageContent);
    
    return messageDiv;
}

// Function to update UI for Goal Analyzer mode
function updateUIForGoalAnalyzer() {
    // Update input placeholder
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
        messageInput.placeholder = 'Ask about your goals or upload documents for analysis...';
    }
    
    // You can add more UI updates specific to goal analyzer mode here
    // For example, show/hide certain buttons, change themes, etc.
}

// Function to scroll to bottom (if not already exists)
function scrollToBottom() {
    const messagesContainer = document.getElementById('messages');
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// Function to handle back to main functionality
function backToMain() {
    const welcomeContainer = document.getElementById('welcome-container');
    const goalAnalyzerContainer = document.getElementById('goal-analyzer-container');
    const messagesContainer = document.getElementById('messages');
    const chatHeader = document.getElementById('chat-header');
    const messageInput = document.getElementById('message-input');

    // Show welcome container and hide goal analyzer
    if (welcomeContainer) {
        welcomeContainer.style.display = 'block';
    }
    
    if (goalAnalyzerContainer) {
        goalAnalyzerContainer.style.display = 'none';
    }

    // Hide chat header
    if (chatHeader) {
        chatHeader.style.display = 'none';
    }

    // Clear messages
    if (messagesContainer) {
        messagesContainer.innerHTML = '';
    }

    // Reset input placeholder
    if (messageInput) {
        messageInput.placeholder = 'Message TATVA...';
    }

    // Reset goal analyzer mode
    isGoalAnalyzerMode = false;
}

// Add event listener for back button (if you have one)
document.addEventListener('DOMContentLoaded', function() {
    const backToMainBtn = document.getElementById('back-to-main-btn');
    if (backToMainBtn) {
        backToMainBtn.addEventListener('click', backToMain);
    }
});

// Optional: Add this to your existing new chat functionality to reset the mode
function resetToMainMode() {
    isGoalAnalyzerMode = false;
    const welcomeContainer = document.getElementById('welcome-container');
    const goalAnalyzerContainer = document.getElementById('goal-analyzer-container');
    
    if (welcomeContainer) {
        welcomeContainer.style.display = 'block';
    }
    
    if (goalAnalyzerContainer) {
        goalAnalyzerContainer.style.display = 'none';
    }
}