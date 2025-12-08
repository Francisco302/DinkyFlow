import React, { useState, useRef } from 'react';
import StyledWrapper from './StyledWrapper';
import ChatProviderSelector from './ChatProviderSelector';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import RequestDetailsPanel from './components/RequestDetailsPanel';
import { useChat } from './hooks/useChat';
import { parseExecutionInstructions } from './utils/parseExecutionInstructions';
import { IconTrash } from '@tabler/icons';

const Chat = ({ collection }) => {
  const { messages, isLoading, error, sendMessage, clearChat, cancelRequest, getProviderDisplayName } = useChat(collection);
  const [selectedInstruction, setSelectedInstruction] = useState(null);
  const [selectedExecutionResults, setSelectedExecutionResults] = useState(null);
  const executeRequestsRef = useRef(null);

  const handleViewDetails = (instruction, executionResults) => {
    setSelectedInstruction(instruction);
    setSelectedExecutionResults(executionResults);
  };

  const handleCloseDetails = () => {
    setSelectedInstruction(null);
    setSelectedExecutionResults(null);
  };

  const handleSendRequest = () => {
    // Request will be sent from the panel
    // Could trigger a refresh or update here if needed
  };

  const handleExecutePendingRequests = () => {
    // Trigger execution via the ExecuteRequestsButton ref
    if (executeRequestsRef.current && executeRequestsRef.current.executeAll) {
      executeRequestsRef.current.executeAll();
      return true;
    }
    return false;
  };

  return (
    <StyledWrapper className="h-full">
      <div className="chat-container">
        <div className="chat-main-layout">
          <div className="chat-left-panel">
            <ChatProviderSelector collection={collection} />

            <div className="flex items-center justify-between">
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

            <ChatMessages 
              messages={messages} 
              isLoading={isLoading} 
              collection={collection}
              sendMessage={sendMessage}
              onViewDetails={handleViewDetails}
              executeRequestsRef={executeRequestsRef}
              onExecutionComplete={(results) => {
                console.log('Execution results:', results);
              }}
            />
            <ChatInput
              onSend={sendMessage}
              isLoading={isLoading}
              onCancel={cancelRequest}
              error={error}
              onExecutePendingRequests={handleExecutePendingRequests}
              collection={collection}
            />
          </div>

          {selectedInstruction && (
            <div className="chat-right-panel">
              <RequestDetailsPanel
                instruction={selectedInstruction}
                collection={collection}
                onClose={handleCloseDetails}
                onSendRequest={handleSendRequest}
                executionResults={selectedExecutionResults}
              />
            </div>
          )}
        </div>
      </div>
    </StyledWrapper>
  );
};

export default Chat;
