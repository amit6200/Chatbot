// Document management functionality
async function loadDocumentsList() {
  try {
    const response = await fetch('/documents');
    if (response.ok) {
      const documents = await response.json();
      updateDocumentsList(documents);
    } else {
      console.error('Failed to load documents list');
    }
  } catch (error) {
    console.error('Error loading documents list:', error);
  }
}

// Update documents list in sidebar
function updateDocumentsList(documents) {
  const documentsContainer = document.getElementById('documents-list');
  documentsContainer.innerHTML = '';
  
  if (documents.length === 0) {
    documentsContainer.innerHTML = '<p class="empty-list">No documents uploaded yet</p>';
    return;
  }
  
  documents.forEach(doc => {
    const docElement = document.createElement('div');
    docElement.className = 'document-item';
    
    docElement.innerHTML = `
      <div class="document-info">
        <i class="fas fa-file-alt document-icon"></i>
        <span class="document-name">${doc.name}</span>
      </div>
      <div class="document-actions">
        <button class="delete-document" data-id="${doc.id}" title="Delete document">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
    
    documentsContainer.appendChild(docElement);
  });
  
  // Add event listeners for delete buttons
  document.querySelectorAll('.delete-document').forEach(button => {
    button.addEventListener('click', async (e) => {
      const docId = e.currentTarget.getAttribute('data-id');
      await deleteDocument(docId);
    });
  });
}

// Delete document function
async function deleteDocument(docId) {
  if (!confirm('Are you sure you want to delete this document?')) {
    return;
  }
  
  try {
    const response = await fetch(`/documents/${docId}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      addBotMessage('Document deleted successfully.');
      loadDocumentsList();
    } else {
      const error = await response.json();
      addBotMessage(`Error deleting document: ${error.message}`);
    }
  } catch (error) {
    addBotMessage(`Error: ${error.message}`);
  }
}
// documents.js - Document management functionality

// Existing document upload functionality
function setupDocumentUpload() {
  const fileInput = document.getElementById('file-upload');
  const uploadForm = document.getElementById('upload-form');
  
  uploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData();
      const files = fileInput.files;
      
      if (files.length === 0) {
          showNotification('Please select a file to upload', 'error');
          return;
      }
      
      for (let i = 0; i < files.length; i++) {
          formData.append('files', files[i]);
      }
      
      try {
          const response = await fetch('/api/upload', {
              method: 'POST',
              body: formData
          });
          
          const result = await response.json();
          
          if (result.success) {
              showNotification('Files uploaded successfully', 'success');
              loadDocumentsList(); // Refresh the documents list
              fileInput.value = ''; // Clear the file input
          } else {
              showNotification(`Upload failed: ${result.message}`, 'error');
          }
      } catch (error) {
          console.error('Error uploading files:', error);
          showNotification('An error occurred during upload', 'error');
      }
  });
}

// Add this to your documents.js file
// Or create it if it doesn't exist yet

// Function to delete all documents
async function deleteAllDocuments() {
  console.log("Delete all documents function called"); // Debug log
  
  if (confirm('Are you sure you want to delete ALL uploaded documents? This action cannot be undone.')) {
      try {
          // Show loading indicator if you have one
          document.getElementById('loading-indicator')?.classList.remove('hidden');
          
          const response = await fetch('/api/documents/delete-all', {
              method: 'DELETE',
              headers: {
                  'Content-Type': 'application/json'
              }
          });
          
          const result = await response.json();
          
          if (result.success) {
              showNotification('All documents deleted successfully', 'success');
              // Refresh the documents list if you have a function for that
              loadDocumentsList();
          } else {
              showNotification(`Failed to delete documents: ${result.message}`, 'error');
          }
      } catch (error) {
          console.error('Error deleting all documents:', error);
          showNotification('An error occurred while deleting documents', 'error');
      } finally {
          // Hide loading indicator if you have one
          document.getElementById('loading-indicator')?.classList.add('hidden');
      }
  }
}

// Helper function to show notifications
function showNotification(message, type = 'info') {
  // If you already have a notification system, use that instead
  const notificationContainer = document.getElementById('notification-container');
  
  if (!notificationContainer) {
      // Create notification container if it doesn't exist
      const container = document.createElement('div');
      container.id = 'notification-container';
      container.style.position = 'fixed';
      container.style.top = '20px';
      container.style.right = '20px';
      container.style.zIndex = '1000';
      document.body.appendChild(container);
  }
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  notification.style.padding = '10px 20px';
  notification.style.margin = '10px';
  notification.style.borderRadius = '4px';
  notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
  
  // Set color based on type
  if (type === 'success') notification.style.backgroundColor = '#28a745';
  else if (type === 'error') notification.style.backgroundColor = '#dc3545';
  else notification.style.backgroundColor = '#17a2b8';
  
  notification.style.color = 'white';
  
  // Add to container
  document.getElementById('notification-container').appendChild(notification);
  
  // Remove after timeout
  setTimeout(() => {
      notification.remove();
  }, 5000);
}

// Function to load and display documents
// If you already have this function, you can modify it to show/hide the delete button
async function loadDocumentsList() {
  try {
      const response = await fetch('/api/documents');
      const data = await response.json();
      
      const documentsList = document.getElementById('documents-list');
      if (!documentsList) return;
      
      documentsList.innerHTML = '';
      
      // Show/hide delete all button based on whether documents exist
      const deleteAllBtn = document.getElementById('clear-all-documents-btn');
      if (deleteAllBtn) {
          deleteAllBtn.style.display = data.documents && data.documents.length > 0 ? 'block' : 'none';
      }
      
      if (data.documents && data.documents.length > 0) {
          data.documents.forEach(doc => {
              const docItem = document.createElement('div');
              docItem.className = 'document-item';
              
              docItem.innerHTML = `
                  <span class="document-name">${doc.filename}</span>
                  <span class="document-date">${new Date(doc.timestamp).toLocaleString()}</span>
                  <button class="delete-document-btn" data-id="${doc.id || doc.document_id}">
                      <i class="fas fa-trash"></i>
                  </button>
              `;
              
              documentsList.appendChild(docItem);
          });
          
          // Add event listeners for individual delete buttons
          const deleteButtons = document.querySelectorAll('.delete-document-btn');
          deleteButtons.forEach(button => {
              button.addEventListener('click', async (e) => {
                  const docId = e.currentTarget.getAttribute('data-id');
                  await deleteDocument(docId);
              });
          });
      } else {
          documentsList.innerHTML = '<div class="no-documents">No documents uploaded yet</div>';
      }
  } catch (error) {
      console.error('Error loading documents:', error);
      showNotification('Failed to load documents', 'error');
  }
}

// When the page loads, add the event listener to the delete all button
document.addEventListener('DOMContentLoaded', () => {
  const clearAllBtn = document.getElementById('clear-all-documents-btn');
  if (clearAllBtn) {
      clearAllBtn.addEventListener('click', deleteAllDocuments);
      console.log("Event listener attached to delete all button");
  } else {
      console.warn("Delete all button not found in DOM");
  }
  
  // If you have a function to load documents, call it here
  if (typeof loadDocumentsList === 'function') {
      loadDocumentsList();
  }
});