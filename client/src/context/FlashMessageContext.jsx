import { createContext, useContext, useState, useCallback } from 'react';

// Create the context
const FlashMessageContext = createContext();

/**
 * Custom hook to use the flash message context
 * @returns {Object} The flash message context value
 */
export const useFlashMessage = () => {
  const context = useContext(FlashMessageContext);
  if (!context) {
    throw new Error('useFlashMessage must be used within a FlashMessageProvider');
  }
  return context;
};

/**
 * Flash message provider component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const FlashMessageProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);

  /**
   * Add a new flash message
   * @param {string} text - Message text
   * @param {string} type - Message type (success, error, info, warning)
   * @param {number} timeout - Auto-dismiss timeout in milliseconds (0 for no auto-dismiss)
   */
  const addMessage = useCallback((text, type = 'info', timeout = 5000) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 5);
    const newMessage = { id, text, type, timestamp: Date.now() };

    setMessages((prevMessages) => [...prevMessages, newMessage]);

    // Auto-dismiss message after timeout if timeout > 0
    if (timeout > 0) {
      setTimeout(() => {
        removeMessage(id);
      }, timeout);
    }

    return id;
  }, []);

  /**
   * Remove a flash message by ID
   * @param {string} id - Message ID to remove
   */
  const removeMessage = useCallback((id) => {
    setMessages((prevMessages) => prevMessages.filter((message) => message.id !== id));
  }, []);

  /**
   * Clear all flash messages
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  /**
   * Shorthand for adding a success message
   * @param {string} text - Message text
   * @param {number} timeout - Auto-dismiss timeout in milliseconds
   */
  const addSuccessMessage = useCallback(
    (text, timeout = 5000) => {
      return addMessage(text, 'success', timeout);
    },
    [addMessage]
  );

  /**
   * Shorthand for adding an error message
   * @param {string} text - Message text
   * @param {number} timeout - Auto-dismiss timeout in milliseconds
   */
  const addErrorMessage = useCallback(
    (text, timeout = 5000) => {
      return addMessage(text, 'error', timeout);
    },
    [addMessage]
  );

  /**
   * Shorthand for adding an info message
   * @param {string} text - Message text
   * @param {number} timeout - Auto-dismiss timeout in milliseconds
   */
  const addInfoMessage = useCallback(
    (text, timeout = 5000) => {
      return addMessage(text, 'info', timeout);
    },
    [addMessage]
  );

  /**
   * Shorthand for adding a warning message
   * @param {string} text - Message text
   * @param {number} timeout - Auto-dismiss timeout in milliseconds
   */
  const addWarningMessage = useCallback(
    (text, timeout = 5000) => {
      return addMessage(text, 'warning', timeout);
    },
    [addMessage]
  );

  /**
   * Generic show message method (alias for addMessage)
   * @param {string} text - Message text
   * @param {string} type - Message type (success, error, info, warning)
   * @param {number} timeout - Auto-dismiss timeout in milliseconds
   */
  const showMessage = useCallback(
    (text, type = 'info', timeout = 5000) => {
      return addMessage(text, type, timeout);
    },
    [addMessage]
  );

  // Context value
  const value = {
    messages,
    addMessage,
    removeMessage,
    clearMessages,
    addSuccessMessage,
    addErrorMessage,
    addInfoMessage,
    addWarningMessage,
    showMessage,
  };

  return <FlashMessageContext.Provider value={value}>{children}</FlashMessageContext.Provider>;
};
