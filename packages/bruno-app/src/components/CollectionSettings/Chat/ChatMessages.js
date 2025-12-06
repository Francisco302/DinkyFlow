import React, { useEffect, useRef, useState } from 'react';
import { IconUser, IconBrain, IconChevronDown, IconChevronRight, IconCheck, IconX, IconEye } from '@tabler/icons';
import { parseExecutionInstructions, removeExecutionInstructions } from './utils/parseExecutionInstructions';
import ExecuteRequestsButton from './components/ExecuteRequestsButton';

const AutoResultsMessage = ({ content }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <details 
      className="mt-2" 
      open={isOpen}
      onToggle={(e) => setIsOpen(e.target.open)}
    >
      <summary 
        className="cursor-pointer text-sm text-muted hover:text-primary mb-1 flex items-center gap-2" 
        style={{ userSelect: 'none', listStyle: 'none' }}
      >
        <IconChevronRight 
          size={16} 
          className="transition-transform" 
          style={{ 
            display: 'inline-block', 
            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' 
          }} 
        />
        <span>Resultados de ejecución enviados al asistente</span>
      </summary>
      <pre className="mt-2 p-3 text-xs bg-gray-100 dark:bg-gray-800 rounded overflow-x-auto max-h-96 overflow-y-auto" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
        {content}
      </pre>
    </details>
  );
};

const ExecutionResultsCollapsible = ({ results, formatResponseBody }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <details 
      className="mt-3" 
      open={isOpen}
      onToggle={(e) => setIsOpen(e.target.open)}
    >
      <summary 
        className="cursor-pointer p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors flex items-center gap-2" 
        style={{ userSelect: 'none', listStyle: 'none' }}
      >
        <IconChevronRight 
          size={16} 
          className="transition-transform" 
          style={{ 
            display: 'inline-block', 
            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' 
          }} 
        />
        <span className="text-sm font-medium">
          Resultados de ejecución ({results.length} request{results.length !== 1 ? 's' : ''})
        </span>
      </summary>
      <div className="mt-2 space-y-3">
        {results.map((result, resultIndex) => (
          <div 
            key={resultIndex} 
            className={`p-3 rounded border ${
              result.success 
                ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {result.success ? (
                <IconCheck size={18} className="text-green-600 dark:text-green-400" />
              ) : (
                <IconX size={18} className="text-red-600 dark:text-red-400" />
              )}
              <span className="text-sm font-medium">
                {result.requestName || result.instruction?.requestName || `Request ${resultIndex + 1}`}
              </span>
              {result.status && (
                <span className={`text-xs px-2 py-0.5 rounded ${
                  result.status >= 200 && result.status < 300
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : result.status >= 400
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}>
                  {result.status} {result.statusText || ''}
                </span>
              )}
            </div>
            
            {result.error && !result.success && (
              <div className="mb-2 text-sm text-red-600 dark:text-red-400">
                Error: {result.error}
              </div>
            )}
            
            {result.response && (
              <details className="mt-2" defaultOpen={false}>
                <summary className="cursor-pointer text-xs text-muted hover:text-primary mb-1" style={{ userSelect: 'none' }}>
                  Ver respuesta completa
                </summary>
                <div className="mt-2">
                  {result.response.headers && (() => {
                    // Format headers - can be object or array
                    let formattedHeaders = result.response.headers;
                    if (Array.isArray(result.response.headers)) {
                      formattedHeaders = result.response.headers.reduce((acc, header) => {
                        if (header && header.name) {
                          acc[header.name] = header.value || '';
                        }
                        return acc;
                      }, {});
                    } else if (typeof result.response.headers === 'object') {
                      formattedHeaders = result.response.headers;
                    }
                    
                    return (
                      <div className="mb-2">
                        <div className="text-xs font-medium mb-1 text-muted">Headers:</div>
                        <pre className="text-xs p-2 bg-gray-100 dark:bg-gray-800 rounded overflow-x-auto" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                          {JSON.stringify(formattedHeaders, null, 2)}
                        </pre>
                      </div>
                    );
                  })()}
                  <div className="text-xs font-medium mb-1 text-muted">Body:</div>
                  <pre className="text-xs p-2 bg-gray-100 dark:bg-gray-800 rounded overflow-x-auto max-h-96 overflow-y-auto" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    {formatResponseBody(result.response)}
                  </pre>
                </div>
              </details>
            )}
          </div>
        ))}
      </div>
    </details>
  );
};

const ChatMessages = ({ messages, isLoading, collection, sendMessage, onViewDetails, executeRequestsRef, onExecutionComplete }) => {
  const messagesEndRef = useRef(null);
  const [executionResults, setExecutionResults] = useState({});
  const [processedExecutionIndexes, setProcessedExecutionIndexes] = useState(new Set());
  const lastExecuteButtonRef = useRef(null);

  // Expose the last execute button ref to parent
  useEffect(() => {
    if (executeRequestsRef) {
      executeRequestsRef.current = lastExecuteButtonRef.current;
    }
  }, [executeRequestsRef, messages]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatResponseBody = (response) => {
    if (!response) return 'No response data';
    
    try {
      if (response.data) {
        if (typeof response.data === 'string') {
          try {
            const parsed = JSON.parse(response.data);
            return JSON.stringify(parsed, null, 2);
          } catch {
            return response.data;
          }
        }
        return JSON.stringify(response.data, null, 2);
      }
      
      if (response.dataBuffer) {
        try {
          const dataBuffer = Buffer.from(response.dataBuffer, 'base64');
          const text = dataBuffer.toString();
          try {
            const parsed = JSON.parse(text);
            return JSON.stringify(parsed, null, 2);
          } catch {
            return text;
          }
        } catch {
          return 'Unable to decode response';
        }
      }
      
      return 'No response body';
    } catch (error) {
      return `Error formatting response: ${error.message}`;
    }
  };

  const formatResultsForLLM = (results) => {
    if (!results || results.length === 0) {
      return 'No hay resultados de ejecución.';
    }

    let formatted = '=== RESULTADOS DE EJECUCIÓN DE REQUESTS ===\n\n';
    
    results.forEach((result, index) => {
      formatted += `Request ${index + 1}: ${result.requestName || result.instruction?.requestName || 'Request sin nombre'}\n`;
      formatted += `Estado: ${result.success ? '✓ Éxito' : '✗ Error'}\n`;
      
      if (result.status) {
        formatted += `Código HTTP: ${result.status} ${result.statusText || ''}\n`;
      }
      
      if (result.error && !result.success) {
        formatted += `Error: ${result.error}\n`;
      }
      
      if (result.response) {
        formatted += '\n--- Respuesta ---\n';
        
        if (result.response.headers) {
          formatted += 'Headers:\n';
          formatted += JSON.stringify(result.response.headers, null, 2) + '\n';
        }
        
        const body = formatResponseBody(result.response);
        formatted += 'Body:\n';
        formatted += body + '\n';
      }
      
      formatted += '\n---\n\n';
    });
    
    formatted += 'Por favor, analiza estos resultados y proporciona un resumen útil al usuario.';
    
    return formatted;
  };

  const handleExecutionComplete = (messageIndex, results) => {
    // Evitar procesar el mismo resultado múltiples veces
    if (processedExecutionIndexes.has(messageIndex)) {
      return;
    }

    setExecutionResults(prev => ({
      ...prev,
      [messageIndex]: results
    }));

    setProcessedExecutionIndexes(prev => new Set([...prev, messageIndex]));

    if (onExecutionComplete) {
      onExecutionComplete(results);
    }

    // Enviar automáticamente los resultados al LLM para análisis
    if (sendMessage && results && results.length > 0) {
      const resultsMessage = formatResultsForLLM(results);
      // Usar setTimeout para evitar problemas de estado
      setTimeout(() => {
        sendMessage(resultsMessage);
      }, 500);
    }
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

      {messages.map((message, index) => {
        const executionInstructions = message.role === 'assistant' 
          ? parseExecutionInstructions(message.content) 
          : null;
        const displayContent = executionInstructions 
          ? removeExecutionInstructions(message.content) 
          : message.content;

        // Detectar si es un mensaje automático con resultados
        const isAutoResultsMessage = message.role === 'user' && 
          message.content && 
          message.content.includes('=== RESULTADOS DE EJECUCIÓN DE REQUESTS ===');

        return (
          <div key={index} className={`message ${message.role}`}>
            <div className={`message-avatar ${message.role}`}>
              {message.role === 'user' ? (
                <IconUser size={18} stroke={2} />
              ) : (
                <IconBrain size={18} stroke={2} />
              )}
            </div>
            <div className="message-content">
              {isAutoResultsMessage ? (
                <AutoResultsMessage content={displayContent} />
              ) : (
                <div className="message-text">{displayContent}</div>
              )}
              
              {executionInstructions && collection && (
                <>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1">
                      <div className="text-xs text-muted mb-1">
                        {executionInstructions.length} request{executionInstructions.length > 1 ? 's' : ''} ready to execute
                      </div>
                      <div className="text-xs font-mono text-muted">
                        {executionInstructions[0]?.requestName || 'Request'}
                        {executionInstructions[0]?.modifications?.url && (
                          <span className="ml-2">• {executionInstructions[0].modifications.url}</span>
                        )}
                      </div>
                    </div>
                    {onViewDetails && (
                      <button
                        onClick={() => onViewDetails(executionInstructions[0], executionResults[index])}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        title="View request details"
                      >
                        <IconEye size={14} stroke={1.5} />
                        View Details
                      </button>
                    )}
                  </div>
                  <ExecuteRequestsButton
                    ref={index === messages.length - 1 ? lastExecuteButtonRef : null}
                    instructions={executionInstructions}
                    collection={collection}
                    onExecutionComplete={(results) => handleExecutionComplete(index, results)}
                  />
                </>
              )}

              {executionResults[index] && executionResults[index].length > 0 && (
                <ExecutionResultsCollapsible 
                  results={executionResults[index]} 
                  formatResponseBody={formatResponseBody}
                />
              )}

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
        );
      })}

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

