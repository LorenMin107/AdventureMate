import { useTranslation } from 'react-i18next';
import { useFlashMessage } from '../context/FlashMessageContext';
import './FlashMessage.css';

/**
 * FlashMessage component displays flash messages from the FlashMessageContext
 *
 * @returns {JSX.Element} Flash message component
 */
const FlashMessage = () => {
  const { t } = useTranslation();
  const { messages, removeMessage } = useFlashMessage();

  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="flash-message-container">
      {messages.map((message) => (
        <div key={message.id} className={`flash-message flash-message-${message.type}`}>
          <div className="flash-message-content">{message.text}</div>
          <button
            className="flash-message-close"
            onClick={() => removeMessage(message.id)}
            aria-label={t('flashMessage.closeMessage')}
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
};

export default FlashMessage;
