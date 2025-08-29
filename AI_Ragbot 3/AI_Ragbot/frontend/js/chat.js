// Chat functionality for AI RAGBot
document.addEventListener('DOMContentLoaded', function() {
  // Make sure DOM is fully loaded before initializing
  console.log('DOM loaded - initializing chat interface');
  initializeChatInterface();
});

// Initialize the chat interface
function initializeChatInterface() {
  // Get elements - FIXED IDs to match HTML
  const messagesList = document.getElementById('messages');
  const messageInput = document.getElementById('message-input');
  const sendButton = document.getElementById('send-btn');
  
  // Check if elements exist to prevent errors
  if (!messagesList) {
    console.error('Messages list element not found. Expected ID: messages');
  }
  if (!messageInput) {
    console.error('Message input element not found. Expected ID: message-input');
  }
  if (!sendButton) {
    console.error('Send button element not found. Expected ID: send-btn');
  }
  
  if (!messagesList || !messageInput || !sendButton) {
    console.error('Chat interface elements not found. Check your HTML IDs.');
    return;
  }

  console.log('All elements found. Setting up event listeners.');

  sendButton.addEventListener('click', function() {
    sendMessage(messagesList, messageInput, sendButton);
  });
  
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(messagesList, messageInput, sendButton);
    }
  });
  
  // Add initial welcome message
  addBotMessage('Hello! I\'m TATVA, Your AI Intern. How can I help you today?', messagesList);
  
  // Enable the send button when text is entered
  messageInput.addEventListener('input', function() {
    sendButton.disabled = this.value.trim() === '';
  });
  
  console.log('Chat interface initialized successfully');
}

// Send message function
async function sendMessage(messagesList, messageInput, sendButton) {
  const message = messageInput.value.trim();
  if (!message) return;
  
  const mode = messageInput.getAttribute('data-mode') || 'chat';
  
  // Clear input and reset height
  messageInput.value = '';
  messageInput.style.height = 'auto';
  sendButton.disabled = true;
  
  // Add user message to chat
  addUserMessage(message, messagesList);
  
  try {
    if (mode === 'code') {
      // Handle Python code execution
      await executePythonCode(message, messagesList);
    } else {
      // Handle regular chat message
      await sendChatMessage(message, messagesList);
    }
  } catch (error) {
    console.error('Error sending message:', error);
    addBotMessage(`Error: ${error.message || 'Failed to communicate with the server'}`, messagesList);
  } finally {
    // Always re-enable the send button
    sendButton.disabled = false;
  }
}

// Send chat message to backend
// async function sendChatMessage(message, messagesList) {
//   // Show typing indicator
//   showTypingIndicator(messagesList);
  
//   // try {
//   //   // FIXED: Updated to match backend API endpoint and format
//   //   const formData = new FormData();
//   //   formData.append('message', message);
    
//   //   const response = await fetch('/chat', {
//   //     method: 'POST',
//   //     body: formData, // Use FormData instead of JSON
//   //   });
//   try {
//     // Get settings from localStorage
//     const savedSettings = localStorage.getItem('appSettings');
//     const settings = savedSettings ? JSON.parse(savedSettings) : {};
    
//     // Create FormData and add message
//     const formData = new FormData();
//     formData.append('message', message);
    
//     // Add chat ID if available
//     const currentChatId = localStorage.getItem('currentChatId');
//     if (currentChatId) {
//       formData.append('chat_id', currentChatId);
//     }
    
//     // Add use_docs setting
//     formData.append('use_docs', settings['use-docs-toggle'] === true);
    
//     // Add system prompt if available
//     if (settings['system-prompt']) {
//       formData.append('system_prompt', settings['system-prompt']);
//     }
    
//     // Add temperature if available
//     if (settings['model-temperature']) {
//       formData.append('temperature', settings['model-temperature']);
//     }
    
//     // Add max tokens if available
//     if (settings['model-max-tokens']) {
//       formData.append('max_tokens', settings['model-max-tokens']);
//     }
    
//     const response = await fetch('/chat', {
//       method: 'POST',
//       body: formData,
//     });
//     // Remove typing indicator
//     hideTypingIndicator();
    
//     if (response.ok) {
//       const data = await response.json();
//       addBotMessage(data.response, messagesList);
//     } else {
//       const errorText = await response.text();
//       let errorMessage;
//       try {
//         const errorJson = JSON.parse(errorText);
//         errorMessage = errorJson.message || errorJson.error || 'Unknown server error';
//       } catch (e) {
//         errorMessage = errorText || `Server error: ${response.status}`;
//       }
//       addBotMessage(`Error: ${errorMessage}`, messagesList);
//     }
//   } catch (error) {
//     hideTypingIndicator();
//     console.error('Network error:', error);
//     addBotMessage('Error: Cannot connect to the server. Please check your internet connection.', messagesList);
//   }
// }

// Update sendChatMessage function to use the database API
async function sendChatMessage(message, messagesList) {
  // Show typing indicator
  showTypingIndicator(messagesList);
  
  try {
    // Fetch settings from the database API
    const settingsResponse = await fetch('/db/get-settings', {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    const settings = settingsResponse.ok ? await settingsResponse.json() : {};
    
    // Get current chat ID from the database API or create a new one
    let currentChatId;
    const chatIdResponse = await fetch('/db/get-current-chat-id', {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (chatIdResponse.ok) {
      const chatIdData = await chatIdResponse.json();
      currentChatId = chatIdData.chatId;
    }
    
    // Create FormData and add message
    const formData = new FormData();
    formData.append('message', message);
    
    // Add chat ID if available
    if (currentChatId) {
      formData.append('chat_id', currentChatId);
    }
    
    // Add use_docs setting
    formData.append('use_docs', settings['use-docs-toggle'] === true);
    
    // Add system prompt if available
    if (settings['system-prompt']) {
      formData.append('system_prompt', settings['system-prompt']);
    }
    
    // Add temperature if available
    if (settings['model-temperature']) {
      formData.append('temperature', settings['model-temperature']);
    }
    
    // Add max tokens if available
    if (settings['model-max-tokens']) {
      formData.append('max_tokens', settings['model-max-tokens']);
    }
    
    const response = await fetch('/db/chat', {
      method: 'POST',
      body: formData,
    });
    
    // Remove typing indicator
    hideTypingIndicator();
    
    if (response.ok) {
      const data = await response.json();
      addBotMessage(data.response, messagesList);
      
      // Save message to database
      if (currentChatId) {
        await saveMessageToDatabase(currentChatId, message, data.response);
      }
    } else {
      const errorText = await response.text();
      let errorMessage;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || 'Unknown server error';
      } catch (e) {
        errorMessage = errorText || `Server error: ${response.status}`;
      }
      addBotMessage(`Error: ${errorMessage}`, messagesList);
    }
  } catch (error) {
    hideTypingIndicator();
    console.error('Network error:', error);
    addBotMessage('Error: Cannot connect to the server. Please check your internet connection.', messagesList);
  }
}

// Add new function to save messages to the database
async function saveMessageToDatabase(chatId, userMessage, botResponse) {
  try {
    const response = await fetch('/save-messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      body: JSON.stringify({
        chat_id: chatId,
        messages: [
          { role: 'user', content: userMessage },
          { role: 'bot', content: botResponse }
        ]
      })
    });
    
    if (!response.ok) {
      console.error('Failed to save messages to database');
    }
  } catch (error) {
    console.error('Error saving messages to database:', error);
  }
}


// Execute Python code
async function executePythonCode(code, messagesList) {
  // Show typing indicator
  showTypingIndicator(messagesList);
  
  try {
    // FIXED: Updated to match the correct endpoint
    const response = await fetch('/api/execute-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });
    
    // Remove typing indicator
    hideTypingIndicator();
    
    if (response.ok) {
      const data = await response.json();
      
      // Create code result message with proper formatting
      const resultMessage = `
        <div class="code-execution-result">
          <div class="code-block">
            <pre><code class="language-python">${escapeHtml(code)}</code></pre>
          </div>
          <div class="execution-output">
            <h4>Output:</h4>
            <pre>${escapeHtml(data.output || data.result || 'No output')}</pre>
          </div>
        </div>
      `;
      
      addBotMessage(resultMessage, messagesList, true);
    } else {
      const errorText = await response.text();
      let errorMessage;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || 'Unknown execution error';
      } catch (e) {
        errorMessage = errorText || `Server error: ${response.status}`;
      }
      addBotMessage(`Code execution error: ${errorMessage}`, messagesList);
    }
  } catch (error) {
    hideTypingIndicator();
    console.error('Network error during code execution:', error);
    addBotMessage('Error: Cannot connect to the server. Please check your internet connection.', messagesList);
  }
}

// Add user message to chat
function addUserMessage(message, messagesList) {
  if (!messagesList) {
    console.error('Cannot add user message: messagesList is null');
    return;
  }

  const messageElement = document.createElement('div');
  messageElement.className = 'message user-message';
  
  messageElement.innerHTML = `
    <div class="message-content">
      <div class="message-text">${formatMessage(message)}</div>
    </div>
  `;
  
  messagesList.appendChild(messageElement);
  scrollToBottom(messagesList);
  console.log('User message added to chat');
}

// Add bot message to chat
function addBotMessage(message, messagesList, isHTML = false) {
  if (!messagesList) {
    console.error('Cannot add bot message: messagesList is null');
    return;
  }

  const messageElement = document.createElement('div');
  messageElement.className = 'message bot-message';
  
  messageElement.innerHTML = `
    <div class="avatar">
      <i class="fas fa-robot"></i>
    </div>
    <div class="message-content">
      <div class="message-text">${isHTML ? message : formatMessage(message)}</div>
    </div>
  `;
  
  messagesList.appendChild(messageElement);
  scrollToBottom(messagesList);
  
  // Apply code highlighting if needed
  if ((message.includes('<pre><code') || message.includes('```')) && typeof Prism !== 'undefined') {
    setTimeout(() => {
      Prism.highlightAll();
    }, 0); // Use setTimeout to ensure DOM is updated
  }
  
  console.log('Bot message added to chat');
}

// Show typing indicator
function showTypingIndicator(messagesList) {
  if (!messagesList) {
    console.error('Cannot show typing indicator: messagesList is null');
    return;
  }

  // Remove any existing typing indicator first
  hideTypingIndicator();
  
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
  
  messagesList.appendChild(typingElement);
  scrollToBottom(messagesList);
}

// Hide typing indicator
function hideTypingIndicator() {
  const typingIndicator = document.getElementById('chat-typing-indicator');
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

// Format message text with markdown-like syntax
function formatMessage(text) {
  // Convert URLs to links
  text = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
  
  // Convert code blocks
  text = text.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>');
  
  // Convert inline code
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Convert line breaks
  text = text.replace(/\n/g, '<br>');
  
  return text;
}

// Apply code syntax highlighting - changed to use Prism instead of hljs
function highlightCode() {
  if (typeof Prism === 'undefined') {
    console.warn('Prism.js not found. Code highlighting disabled.');
    return;
  }
  
  Prism.highlightAll();
}

// Escape HTML special characters
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Scroll chat to bottom
function scrollToBottom(messagesList) {
  if (messagesList) {
    // Use setTimeout to ensure this happens after DOM updates
    setTimeout(() => {
      messagesList.scrollTop = messagesList.scrollHeight;
    }, 0);
  }
}


// Add a console log to help with debugging
console.log('chat.js loaded');