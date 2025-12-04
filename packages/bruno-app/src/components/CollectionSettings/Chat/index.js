import React from 'react';
import StyledWrapper from './StyledWrapper';
import ChatProviderSelector from './ChatProviderSelector';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import { useChat } from './hooks/useChat';
import { IconTrash } from '@tabler/icons';

const Chat = ({ collection }) => {
  const { messages, isLoading, error, sendMessage, clearChat, cancelRequest, getProviderDisplayName } = useChat(collection);

  return (
    <StyledWrapper className="h-full">
      <div className="chat-container">
        <ChatProviderSelector collection={collection} />

        <div className="flex items-center justify-between mb-2">
          <div className="text-sm muted">
            Using {getProviderDisplayName()}
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="flex items-center gap-1 text-sm muted cursor-pointer"
              style={{ transition: 'color 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
              title="Clear chat history"
            >
              <IconTrash size={16} stroke={1.5} />
              Clear
            </button>
          )}
        </div>

        <ChatMessages messages={messages} isLoading={isLoading} />
        <ChatInput
          onSend={sendMessage}
          isLoading={isLoading}
          onCancel={cancelRequest}
          error={error}
        />
      </div>
    </StyledWrapper>
  );
};

export default Chat;
