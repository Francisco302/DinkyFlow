import React, { useState, useRef, useEffect, useMemo } from 'react';
import { IconSend, IconX } from '@tabler/icons';
import { flattenItems } from 'utils/collections';
import styled from 'styled-components';

const SuggestionsDropdown = styled.div`
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  margin-bottom: 0.5rem;
  background-color: ${(props) => props.theme.bg};
  border: 1px solid ${(props) => props.theme.border};
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;

  .suggestion-item {
    padding: 0.5rem 0.75rem;
    cursor: pointer;
    font-size: 0.8125rem;
    color: ${(props) => props.theme.colors.text.primary};
    border-bottom: 1px solid ${(props) => props.theme.border};
    transition: background-color 0.15s;

    &:last-child {
      border-bottom: none;
    }

    &:hover,
    &.selected {
      background-color: ${(props) => props.theme.colors.primary}15;
    }

    .suggestion-name {
      font-weight: 500;
      color: ${(props) => props.theme.colors.primary};
    }

    .suggestion-method {
      font-size: 0.75rem;
      color: ${(props) => props.theme.colors.text.muted};
      margin-left: 0.5rem;
    }

    .suggestion-url {
      font-size: 0.75rem;
      color: ${(props) => props.theme.colors.text.muted};
      margin-top: 0.25rem;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    }
  }

  .empty-suggestions {
    padding: 0.75rem;
    text-align: center;
    color: ${(props) => props.theme.colors.text.muted};
    font-size: 0.8125rem;
  }
`;

const ChatInput = ({ onSend, isLoading, onCancel, error, onExecutePendingRequests, collection }) => {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [query, setQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef(null);
  const suggestionsRef = useRef(null);
  const inputWrapperRef = useRef(null);

  // Get available APIs from collection
  const availableAPIs = useMemo(() => {
    if (!collection || !collection.items) return [];
    
    const allItems = flattenItems(collection.items);
    return allItems
      .filter((item) => {
        return item.request && ['http-request', 'graphql-request', 'grpc-request', 'ws-request'].includes(item.type);
      })
      .map((item) => {
        const request = item.draft?.request || item.request;
        return {
          name: item.name || 'Request sin nombre',
          method: request?.method || 'GET',
          url: request?.url || ''
        };
      });
  }, [collection]);

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Detect @ and show suggestions
  useEffect(() => {
    if (!textareaRef.current) return;

    const text = input;
    // Use a small timeout to ensure cursor position is updated
    setTimeout(() => {
      if (!textareaRef.current) return;
      const cursorPos = textareaRef.current.selectionStart || text.length;
      
      // Find @ symbol before cursor
      const textBeforeCursor = text.substring(0, cursorPos);
      const lastAtIndex = textBeforeCursor.lastIndexOf('@');
      
      if (lastAtIndex !== -1) {
        // Check if there's a space or newline after @ (which would mean @ is not active)
        const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
        if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
          const query = textAfterAt.toLowerCase();
          setQuery(query);
          setCursorPosition(lastAtIndex);
          
          // Filter APIs based on query
          const filtered = availableAPIs.filter(api =>
            api.name.toLowerCase().includes(query) ||
            api.url.toLowerCase().includes(query) ||
            api.method.toLowerCase().includes(query)
          );
          
          setSuggestions(filtered);
          setShowSuggestions(filtered.length > 0);
          setSelectedIndex(0);
        } else {
          setShowSuggestions(false);
        }
      } else {
        setShowSuggestions(false);
      }
    }, 0);
  }, [input, availableAPIs]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputWrapperRef.current && !inputWrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSuggestions]);

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

  const insertSuggestion = (apiName) => {
    if (!textareaRef.current) return;
    
    const text = input;
    const cursorPos = textareaRef.current.selectionStart || text.length;
    const textBeforeCursor = text.substring(0, cursorPos);
    const textAfterCursor = text.substring(cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const beforeAt = text.substring(0, lastAtIndex);
      const newText = `${beforeAt}"${apiName}"${textAfterCursor}`;
      setInput(newText);
      setShowSuggestions(false);
      
      // Set cursor position after the inserted text
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = lastAtIndex + apiName.length + 2; // +2 for quotes
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
          textareaRef.current.focus();
        }
      }, 0);
    }
  };

  const handleKeyDown = (e) => {
    // Handle suggestions navigation
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
        return;
      }
      
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        return;
      }
      
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        insertSuggestion(suggestions[selectedIndex].name);
        return;
      }
      
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggestions(false);
        return;
      }
    }

    // Ctrl+Enter or Cmd+Enter to execute pending requests
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (onExecutePendingRequests && !isLoading) {
        const executed = onExecutePendingRequests();
        if (!executed) {
          // If no pending requests, send the message instead
          handleSubmit(e);
        }
      }
      return;
    }

    // Regular Enter to send message (only if suggestions are not shown)
    if (e.key === 'Enter' && !e.shiftKey && !showSuggestions) {
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
      <form onSubmit={handleSubmit} className="input-wrapper" ref={inputWrapperRef} style={{ position: 'relative' }}>
        {showSuggestions && suggestions.length > 0 && (
          <SuggestionsDropdown ref={suggestionsRef}>
            {suggestions.map((api, index) => (
              <div
                key={index}
                className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => insertSuggestion(api.name)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div>
                  <span className="suggestion-name">{api.name}</span>
                  <span className="suggestion-method">{api.method}</span>
                </div>
                {api.url && (
                  <div className="suggestion-url">{api.url}</div>
                )}
              </div>
            ))}
          </SuggestionsDropdown>
        )}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            // Update cursor position tracking
            setTimeout(() => {
              if (textareaRef.current) {
                setCursorPosition(textareaRef.current.selectionStart || e.target.value.length);
              }
            }, 0);
          }}
          onKeyDown={handleKeyDown}
          onSelect={(e) => {
            if (textareaRef.current) {
              setCursorPosition(textareaRef.current.selectionStart || 0);
            }
          }}
          placeholder="Type your message... (Enter to send, Shift+Enter for new line, Ctrl+Enter to execute, @ to mention API)"
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

