import React, { useEffect, useRef } from 'react';
import { IconUser, IconBrain } from '@tabler/icons';

const ChatMessages = ({ messages, isLoading }) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-messages">
      {messages.length === 0 && !isLoading && (
        <div className="flex items-center justify-center h-full text-muted">
          <div className="text-center">
            <IconBrain size={48} stroke={1.5} className="mx-auto mb-4 opacity-50" />
            <p className="text-sm">Start a conversation by sending a message below</p>
          </div>
        </div>
      )}

      {messages.map((message, index) => (
        <div key={index} className={`message ${message.role}`}>
          <div className={`message-avatar ${message.role}`}>
            {message.role === 'user' ? (
              <IconUser size={18} stroke={2} />
            ) : (
              <IconBrain size={18} stroke={2} />
            )}
          </div>
          <div className="message-content">
            <div className="message-text">{message.content}</div>
            {message.curl && (
              <details className="mt-2">
                <summary className="text-xs cursor-pointer text-muted hover:text-primary" style={{ userSelect: 'none' }}>
                  Show cURL command
                </summary>
                <pre className="mt-2 p-2 text-xs bg-gray-100 dark:bg-gray-800 rounded overflow-x-auto" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {message.curl}
                </pre>
              </details>
            )}
            {message.timestamp && (
              <div className="message-time">{formatTime(message.timestamp)}</div>
            )}
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <span>Thinking...</span>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;

