import { createContext, useState, useContext } from 'react';
import { Toast, ToastContainer, Spinner } from 'react-bootstrap';

// Create context
export const NotificationContext = createContext();

// Custom hook to use the notification context
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [pendingTransactions, setPendingTransactions] = useState([]);

  // Add a notification
  const addNotification = (message, type = 'success', options = {}) => {
    const id = Date.now();
    const autoHide = options.autoHide !== false;
    const duration = options.duration || 5000;
    
    setNotifications(prevNotifications => [
      ...prevNotifications,
      { id, message, type, options }
    ]);
    
    // Auto remove after duration (default 5 seconds)
    if (autoHide) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
    
    return id;
  };

  // Remove a notification by id
  const removeNotification = (id) => {
    setNotifications(prevNotifications => 
      prevNotifications.filter(notification => notification.id !== id)
    );
  };

  // Track a pending transaction
  const trackTransaction = (txHash, description) => {
    const id = Date.now();
    const txInfo = {
      id,
      txHash,
      description,
      startTime: new Date(),
    };
    
    setPendingTransactions(prev => [...prev, txInfo]);
    
    // Show a pending notification that doesn't auto-hide
    addNotification(
      `Transaction pending: ${description}`,
      'info',
      { autoHide: false, txId: id }
    );
    
    return id;
  };

  // Complete a transaction (success)
  const completeTransaction = (txId, blockExplorer = null) => {
    // Find the transaction
    const tx = pendingTransactions.find(t => t.id === txId);
    if (!tx) return;
    
    // Remove it from pending list
    setPendingTransactions(prev => prev.filter(t => t.id !== txId));
    
    // Remove the pending notification
    setNotifications(prev => prev.filter(n => n.options?.txId !== txId));
    
    // Add success notification
    const explorerLink = blockExplorer && tx.txHash ? 
      `<a href="${blockExplorer}/tx/${tx.txHash}" target="_blank" rel="noopener noreferrer">View on Explorer</a>` : '';
    
    addNotification(
      `<div>
        Transaction successful: ${tx.description}
        ${explorerLink ? `<div class="mt-2">${explorerLink}</div>` : ''}
      </div>`,
      'success',
      { html: true }
    );
  };

  // Fail a transaction
  const failTransaction = (txId, error) => {
    // Find the transaction
    const tx = pendingTransactions.find(t => t.id === txId);
    if (!tx) return;
    
    // Remove it from pending list
    setPendingTransactions(prev => prev.filter(t => t.id !== txId));
    
    // Remove the pending notification
    setNotifications(prev => prev.filter(n => n.options?.txId !== txId));
    
    // Add error notification
    addNotification(
      `Transaction failed: ${tx.description}. ${error || 'Unknown error'}`,
      'danger',
      { duration: 8000 }
    );
  };

  // Helper functions for common notification types
  const showSuccess = (message, options = {}) => addNotification(message, 'success', options);
  const showError = (message, options = {}) => addNotification(message, 'danger', options);
  const showInfo = (message, options = {}) => addNotification(message, 'info', options);
  const showWarning = (message, options = {}) => addNotification(message, 'warning', options);

  return (
    <NotificationContext.Provider value={{ 
      addNotification, 
      removeNotification,
      showSuccess,
      showError,
      showInfo,
      showWarning,
      trackTransaction,
      completeTransaction,
      failTransaction,
      pendingTransactions
    }}>
      {children}
      
      <ToastContainer 
        className="p-3" 
        position="top-end"
        style={{ zIndex: 1050 }}
      >
        {notifications.map((notification) => (
          <Toast 
            key={notification.id}
            bg={notification.type}
            onClose={() => removeNotification(notification.id)}
          >
            <Toast.Header>
              <strong className="me-auto">
                {notification.type === 'success' && 'Success'}
                {notification.type === 'danger' && 'Error'}
                {notification.type === 'info' && 'Information'}
                {notification.type === 'warning' && 'Warning'}
              </strong>
              {notification.options?.txId && (
                <Spinner animation="border" size="sm" className="me-2" />
              )}
            </Toast.Header>
            <Toast.Body 
              className={notification.type === 'danger' ? 'text-white' : ''}
              dangerouslySetInnerHTML={
                notification.options?.html ? { __html: notification.message } : undefined
              }
            >
              {!notification.options?.html && notification.message}
            </Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </NotificationContext.Provider>
  );
}; 