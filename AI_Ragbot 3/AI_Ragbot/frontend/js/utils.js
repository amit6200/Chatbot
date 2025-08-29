// Utility functions for AI RAGBot
// Debounce function to limit function calls
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

// Format timestamp to readable format
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Copy text to clipboard
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    // Show success notification
    showNotification('Copied to clipboard!', 'success');
  }).catch(err => {
    console.error('Failed to copy text: ', err);
    showNotification('Failed to copy text', 'error');
  });
}

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Show notification with animation
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // Hide and remove after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    
    // Remove from DOM after animation completes
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// Download chat history as text file
function downloadChatHistory() {
  const messages = document.querySelectorAll('.message');
  let chatText = '# TATVA Chat History\n\n';
  
  messages.forEach(msg => {
    const isUser = msg.classList.contains('user-message');
    const messageText = msg.querySelector('.message-text').innerText;
    
    chatText += `${isUser ? 'User' : 'RAGBot'}: ${messageText}\n\n`;
  });
  
  const blob = new Blob([chatText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `ragbot-chat-${new Date().toISOString().slice(0, 10)}.txt`;
  a.click();
  
  URL.revokeObjectURL(url);
}