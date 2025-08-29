// Settings management functionality
console.log("Settings.js loaded"); // Debug log to verify script loading


// document.addEventListener('DOMContentLoaded', function() {
//   try {
//     console.log("DOM loaded, initializing settings...");
    
//     // Check if we have a system prompt from the server
//     if (typeof serverSystemPrompt !== 'undefined' && serverSystemPrompt) {
//       console.log("System prompt received from server:", serverSystemPrompt);
      
//       // Apply the server-provided system prompt immediately
//       const systemPromptField = document.getElementById('system-prompt');
//       if (systemPromptField) {
//         systemPromptField.value = serverSystemPrompt;
        
//         // Trigger save settings
//         setTimeout(() => {
//           const saveSettingsBtn = document.getElementById('save-settings');
//           if (saveSettingsBtn) {
//             console.log("Automatically triggering settings save");
//             saveSettingsBtn.click();
//           } else {
//             console.error("Save settings button not found");
//           }
//         }, 500);
//       }
//     }
    
//     initializeSettings();
//   } catch (error) {
//     console.error("Error initializing settings:", error);
//   }
// });

document.addEventListener('DOMContentLoaded', function() {
  try {
    console.log("DOM loaded, initializing settings...");
    
    // Check if we have a system prompt from the server
    if (typeof serverSystemPrompt !== 'undefined' && serverSystemPrompt) {
      console.log("System prompt received from server:", serverSystemPrompt);
      
      // Apply the server-provided system prompt immediately
      const systemPromptField = document.getElementById('system-prompt');
      if (systemPromptField) {
        systemPromptField.value = serverSystemPrompt;
        
        // Set use-docs-toggle to true if enableDocs is true
        if (typeof enableDocs !== 'undefined' && enableDocs) {
          console.log("Enabling docs toggle");
          const useDocsToggle = document.getElementById('use-docs-toggle');
          if (useDocsToggle) {
            useDocsToggle.checked = true;
          }
        }
        
        // Trigger save settings
        setTimeout(() => {
          const saveSettingsBtn = document.getElementById('save-settings');
          if (saveSettingsBtn) {
            console.log("Automatically triggering settings save");
            saveSettingsBtn.click();
          } else {
            console.error("Save settings button not found");
          }
        }, 500);
      }
    }
    
    initializeSettings();
  } catch (error) {
    console.error("Error initializing settings:", error);
  }
});

// Function to apply app name to system prompt
function applyAppNameToSystemPrompt(appName) {
  try {
    console.log(appName)
    const systemPromptField = document.getElementById('system-prompt');
    console.log(systemPromptField)
    if (systemPromptField) {
      // Create a custom system prompt with the app name
      const customPrompt = `You are a helpful assistant for the ${appName} application. Please provide accurate and concise answers related to ${appName}.`;
      
      // Set the value to the input field
      systemPromptField.value = customPrompt;
      console.log("System prompt updated with app name:", appName);
      
      // Trigger save settings after a short delay to ensure DOM is fully loaded
      setTimeout(() => {
        const saveSettingsBtn = document.getElementById('save-settings');
        if (saveSettingsBtn) {
          console.log("Automatically triggering settings save");
          saveSettingsBtn.click();
        } else {
          console.error("Save settings button not found");
        }
      }, 500);
    } else {
      console.error("System prompt field not found");
    }
  } catch (error) {
    console.error("Error applying app name to system prompt:", error);
  }
}

function initializeSettings() {
  // Settings modal controls
  const settingsBtn = document.getElementById('settings-btn');
  const settingsModal = document.getElementById('settings-modal');
  
  // Check if elements exist before proceeding
  if (!settingsBtn) {
    console.error("Settings button not found!");
    return;
  }
  
  if (!settingsModal) {
    console.error("Settings modal not found!");
    return;
  }
  
  console.log("Settings elements found, attaching event listeners...");
  
  // Open settings modal when settings button is clicked
  settingsBtn.addEventListener('click', function(event) {
    console.log("Settings button clicked");
    event.preventDefault();
    settingsModal.style.display = 'block';
  });
  
  // Close modal when the X is clicked
  const closeModal = settingsModal.querySelector('.close-modal');
  if (closeModal) {
    closeModal.addEventListener('click', function() {
      settingsModal.style.display = 'none';
    });
  } else {
    console.error("Close modal button not found!");
  }
  
  // Close modal when clicking outside of it
  window.addEventListener('click', function(event) {
    if (event.target === settingsModal) {
      settingsModal.style.display = 'none';
    }
  });
  
 // Save settings button click handler
const saveSettingsBtn = document.getElementById('save-settings');
if (saveSettingsBtn) {
  saveSettingsBtn.addEventListener('click', function() {
    try {
      const form = document.getElementById('settings-form') || createSettingsFormFromFields();
      const settings = {};
      
      // Process all inputs in the form, not just those in FormData
      const inputs = form.querySelectorAll('input, select, textarea');
      
      inputs.forEach(input => {
        const key = input.name;
        if (key) {
          if (input.type === 'checkbox') {
            // Always include the checkbox value, whether checked or not
            settings[key] = input.checked;
          } else if (input.type === 'number') {
            settings[key] = Number(input.value);
          } else {
            settings[key] = input.value;
          }
        }
      });
      
      saveSettingsToBackend(settings);
      settingsModal.style.display = 'none';
      showToast('Settings saved successfully', 'success');
    } catch (error) {
      console.error("Error saving settings:", error);
      showToast('Error saving settings', 'error');
    }
  });
}
  
  // Reset settings button
  const resetSettingsBtn = document.getElementById('reset-settings');
  if (resetSettingsBtn) {
    resetSettingsBtn.addEventListener('click', function() {
      resetSettings();
    });
  }
  
  // Clear chat button
  const clearChatBtn = document.getElementById('clear-chat-btn');
  if (clearChatBtn) {
    clearChatBtn.addEventListener('click', function() {
      clearCurrentChat();
      settingsModal.style.display = 'none';
      showToast('Chat cleared', 'info');
    });
  }
  
  // Initialize UI controls
  initializeUIControls();
  
  // Load settings after everything is set up
  loadSettings();
}

// Create a form from individual fields if no form element exists
function createSettingsFormFromFields() {
  const tempForm = document.createElement('form');
  
  // Get all setting inputs
  const inputs = document.querySelectorAll('.setting-item input, .setting-item select, .setting-item textarea');
  inputs.forEach(input => {
    const clonedInput = input.cloneNode(true);
    if (!clonedInput.hasAttribute('name')) {
      clonedInput.setAttribute('name', clonedInput.id);
    }
    tempForm.appendChild(clonedInput);
  });
  
  return tempForm;
}

// Initialize UI controls like sliders
function initializeUIControls() {
  // Temperature slider
  const temperatureSlider = document.getElementById('model-temperature');
  const temperatureValue = document.getElementById('temperature-value');
  
  if (temperatureSlider && temperatureValue) {
    temperatureSlider.addEventListener('input', function() {
      temperatureValue.textContent = this.value;
    });
  }
  
  // Theme selector
  const themeSelector = document.getElementById('theme-selector');
  if (themeSelector) {
    themeSelector.addEventListener('change', function() {
      applyTheme(this.value);
    });
  }
}

// Apply selected theme
function applyTheme(theme) {
  document.body.classList.remove('light-theme', 'dark-theme');
  
  if (theme === 'system') {
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.add('light-theme');
    }
  } else {
    document.body.classList.add(`${theme}-theme`);
  }
  
  localStorage.setItem('theme', theme);
}

// Reset settings to default values
function resetSettings() {
  const defaultSettings = {
    'system-prompt': 'You are a helpful assistant that provides accurate and concise answers.',
    'save-chat-history': true,
    'use-docs-toggle': false,
    'chunk-size': 1000,
    'overlap-size': 200,
    'model-temperature': 0.7,
    'model-max-tokens': 1000,
    'code-timeout': 5,
    'auto-run-code': true,
    'theme-selector': 'system',
    'auto-scroll': true,
    'show-thinking-indicator': true
  };
  
  populateSettingsForm(defaultSettings);
  showToast('Settings reset to defaults', 'info');
}

// Clear current chat
function clearCurrentChat() {
  const messagesContainer = document.getElementById('messages');
  if (messagesContainer) {
    messagesContainer.innerHTML = '';
  }
  
  // Also clear from local storage if needed
  const currentChatId = localStorage.getItem('currentChatId');
  if (currentChatId) {
    const chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '{}');
    if (chatHistory[currentChatId]) {
      chatHistory[currentChatId].messages = [];
      localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    }
  }
}

// Load settings from backend
async function loadSettings() {
  try {
    console.log("Loading settings...");
    // Try loading from localStorage first as fallback
    const savedSettings = localStorage.getItem('appSettings');
    let settings = savedSettings ? JSON.parse(savedSettings) : null;
    
    try {
      const response = await fetch('/settings');
      if (response.ok) {
        settings = await response.json();
        console.log("Settings loaded from server");
      } else {
        console.error('Failed to load settings from server, using localStorage');
      }
    } catch (error) {
      console.error('Error loading settings from server:', error);
      console.log('Using localStorage settings instead');
    }
    
    if (settings) {
      populateSettingsForm(settings);
    } else {
      console.log("No saved settings found, using defaults");
      resetSettings();
    }
  } catch (error) {
    console.error('Error in loadSettings:', error);
    resetSettings();
  }
}

// Populate settings form with current values
function populateSettingsForm(settings) {
  try {
    // Find all setting inputs
    const inputs = document.querySelectorAll('[id^="system-"], [id^="model-"], [id^="code-"], [id^="chunk-"], [id^="overlap-"], #save-chat-history, #use-docs-toggle, #auto-run-code, #auto-scroll, #show-thinking-indicator, #theme-selector');
    
    inputs.forEach(input => {
      const key = input.id;
      if (settings[key] !== undefined) {
        if (input.type === 'checkbox') {
          input.checked = settings[key];
        } else if (input.type === 'range') {
          input.value = settings[key];
          const valueDisplay = document.getElementById(`${key}-value`);
          if (valueDisplay) {
            valueDisplay.textContent = settings[key];
          }
        } else {
          input.value = settings[key];
        }
      }
    });
  } catch (error) {
    console.error("Error populating settings form:", error);
  }
}

// Save settings to backend
async function saveSettingsToBackend(settings) {
  try {
    // Save to localStorage as fallback
    localStorage.setItem('appSettings', JSON.stringify(settings));
    console.log("Settings saved to localStorage");
    
    try {
      const response = await fetch('/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error('Error saving settings to server:', error.message);
        showToast(`Settings saved locally. Server error: ${error.message}`, 'warning');
      } else {
        console.log("Settings saved to server successfully");
      }
    } catch (error) {
      console.error('Error saving settings to server:', error);
      showToast('Settings saved locally. Could not connect to server.', 'warning');
    }
  } catch (error) {
    console.error('Error in saveSettingsToBackend:', error);
    showToast(`Error: ${error.message}`, 'error');
  }
}

// Display toast notification
function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    console.error("Toast container not found!");
    return;
  }
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  toastContainer.appendChild(toast);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.classList.add('toast-fade-out');
    setTimeout(() => {
      if (toastContainer.contains(toast)) {
        toastContainer.removeChild(toast);
      }
    }, 300);
  }, 3000);
}