import React, { useState, useRef, useEffect } from 'react';
import { IconSend, IconX } from '@tabler/icons';

const ChatInput = ({ onSend, isLoading, onCancel, error }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSend(input);
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="chat-input-container">
      {error && (
        <div className="mb-2 p-2 rounded text-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="input-wrapper">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
          disabled={isLoading}
          rows={1}
        />
        {isLoading ? (
          <button type="button" onClick={handleCancel} disabled={!onCancel}>
            <IconX size={20} stroke={2} />
          </button>
        ) : (
          <button type="submit" disabled={!input.trim()}>
            <IconSend size={20} stroke={2} />
          </button>
        )}
      </form>
    </div>
  );
};

export default ChatInput;

