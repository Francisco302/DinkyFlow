import React, { useState, useEffect } from 'react';
import { IconX, IconArrowRight, IconFileText } from '@tabler/icons';
import styled from 'styled-components';
import { parseExecutionInstructions } from '../utils/parseExecutionInstructions';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { sendRequest } from 'providers/ReduxStore/slices/collections/actions';
import { flattenItems } from 'utils/collections';
import cloneDeep from 'lodash/cloneDeep';
import toast from 'react-hot-toast';

const StyledPanel = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: ${(props) => props.theme.bg};
  border-left: 1px solid ${(props) => props.theme.border};

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px solid ${(props) => props.theme.border};
    background-color: ${(props) => props.theme.bg};

    .panel-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      font-size: 0.875rem;
      color: ${(props) => props.theme.colors.text.primary};

      svg {
        color: ${(props) => props.theme.colors.primary};
      }
    }

    .close-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border: none;
      background: transparent;
      cursor: pointer;
      color: ${(props) => props.theme.colors.text.muted};
      border-radius: 4px;
      transition: all 0.2s;

      &:hover {
        background-color: ${(props) => props.theme.border};
        color: ${(props) => props.theme.colors.text.primary};
      }
    }
  }

  .panel-tabs {
    display: flex;
    border-bottom: 1px solid ${(props) => props.theme.border};
    background-color: ${(props) => props.theme.bg};

    .tab-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 0.8125rem;
      color: ${(props) => props.theme.colors.text.muted};
      border-bottom: 2px solid transparent;
      transition: all 0.2s;

      &:hover {
        color: ${(props) => props.theme.colors.text.primary};
        background-color: ${(props) => props.theme.border}20;
      }

      &.active {
        color: ${(props) => props.theme.colors.primary};
        border-bottom-color: ${(props) => props.theme.colors.primary};
        font-weight: 500;
      }

      svg {
        width: 14px;
        height: 14px;
      }
    }
  }

  .panel-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
  }

  .section {
    margin-bottom: 1.5rem;

    &:last-child {
      margin-bottom: 0;
    }

    h4 {
      font-size: 0.8125rem;
      font-weight: 600;
      color: ${(props) => props.theme.colors.text.primary};
      margin-bottom: 0.75rem;
    }

    .field {
      margin-bottom: 1rem;

      &:last-child {
        margin-bottom: 0;
      }

      label {
        display: block;
        font-size: 0.75rem;
        font-weight: 500;
        color: ${(props) => props.theme.colors.text.muted};
        margin-bottom: 0.25rem;
      }

      .value {
        font-size: 0.8125rem;
        color: ${(props) => props.theme.colors.text.primary};
        word-break: break-all;
        padding: 0.5rem;
        background-color: ${(props) => props.theme.input.bg};
        border: 1px solid ${(props) => props.theme.border};
        border-radius: 4px;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      }
    }

    .headers-table {
      border: 1px solid ${(props) => props.theme.border};
      border-radius: 4px;
      overflow: hidden;

      table {
        width: 100%;
        border-collapse: collapse;

        thead {
          background-color: ${(props) => props.theme.border}40;

          td {
            padding: 0.5rem;
            font-size: 0.75rem;
            font-weight: 600;
            color: ${(props) => props.theme.colors.text.primary};
          }
        }

        tbody {
          tr {
            border-top: 1px solid ${(props) => props.theme.border};

            &:first-child {
              border-top: none;
            }
          }

          td {
            padding: 0.5rem;
            font-size: 0.8125rem;
            color: ${(props) => props.theme.colors.text.primary};

            &.header-name {
              font-weight: 500;
              color: ${(props) => props.theme.colors.primary};
            }

            &.header-value {
              word-break: break-all;
              font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            }
          }
        }
      }
    }

    pre {
      margin: 0;
      padding: 0.75rem;
      background-color: ${(props) => props.theme.input.bg};
      border: 1px solid ${(props) => props.theme.border};
      border-radius: 4px;
      font-size: 0.75rem;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-all;
      color: ${(props) => props.theme.colors.text.primary};
    }

    .empty-state {
      padding: 2rem;
      text-align: center;
      color: ${(props) => props.theme.colors.text.muted};
      font-size: 0.8125rem;
    }
  }

  .send-button {
    margin-top: 1rem;
    padding: 0.75rem 1.5rem;
    background-color: ${(props) => props.theme.colors.primary};
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    font-size: 0.875rem;
    transition: opacity 0.2s;
    width: 100%;

    &:hover:not(:disabled) {
      opacity: 0.9;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
`;

const RequestDetailsPanel = ({ instruction, collection, onClose, onSendRequest, executionResults }) => {
  const [activeTab, setActiveTab] = useState('request');
  const [response, setResponse] = useState(null);
  const [responses, setResponses] = useState([]); // For multiple responses
  const [isSending, setIsSending] = useState(false);
  const dispatch = useDispatch();
  const store = useStore();

  const findRequestInCollection = (requestName) => {
    if (!collection || !collection.items) {
      return null;
    }
    const allItems = flattenItems(collection.items);
    return allItems.find(item => {
      const name = item.name || '';
      return name.toLowerCase().includes(requestName.toLowerCase()) ||
             requestName.toLowerCase().includes(name.toLowerCase());
    });
  };

  // Load existing response when panel opens or instruction changes
  useEffect(() => {
    if (!instruction || !collection) return;

    const loadExistingResponse = () => {
      const item = findRequestInCollection(instruction.requestName);
      if (!item) return;

      // First check if we have execution results passed as prop
      // executionResults can be a single result object or an array
      if (executionResults) {
        let matchingResults = [];
        
        if (Array.isArray(executionResults)) {
          // If it's an array, find all matching results (for "execute all" scenario)
          matchingResults = executionResults.filter(
            r => r.requestName === instruction.requestName || 
                 r.instruction?.requestName === instruction.requestName
          );
        } else if (executionResults.requestName === instruction.requestName || 
                   executionResults.instruction?.requestName === instruction.requestName) {
          matchingResults = [executionResults];
        }
        
        if (matchingResults.length > 0) {
          // If multiple responses, show all; otherwise show single
          if (matchingResults.length === 1) {
            setResponse(matchingResults[0].response);
            setResponses([]);
          } else {
            setResponses(matchingResults.map(r => r.response).filter(Boolean));
            setResponse(null);
          }
          setActiveTab('response');
          return;
        }
      }

      // Otherwise, check Redux state for the item's response
      const state = store.getState();
      const currentCollections = state.collections.collections || [];
      const currentCollection = currentCollections.find(c => c.uid === collection.uid);
      
      if (currentCollection) {
        const allItems = flattenItems(currentCollection.items || []);
        const updatedItem = allItems.find(i => i.uid === item.uid);
        
        if (updatedItem?.response && updatedItem?.requestState === 'received') {
          setResponse(updatedItem.response);
          setActiveTab('response');
        }
      }
    };

    loadExistingResponse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instruction?.requestName, collection?.uid, executionResults]);

  if (!instruction) return null;

  const applyModifications = (item, modifications) => {
    const itemCopy = cloneDeep(item);
    if (!itemCopy.draft) {
      itemCopy.draft = { request: cloneDeep(itemCopy.request || {}) };
    }
    if (!itemCopy.draft.request) {
      itemCopy.draft.request = cloneDeep(itemCopy.request || {});
    }
    const request = itemCopy.draft.request;

    if (!request) return itemCopy;

    if (modifications.url) {
      try {
        const modifiedUrl = new URL(modifications.url);
        request.url = modifications.url;
      } catch (error) {
        try {
          const originalUrl = new URL(request.url);
          if (modifications.url.startsWith('/')) {
            request.url = originalUrl.origin + modifications.url;
          } else {
            request.url = modifications.url;
          }
        } catch (e) {
          request.url = modifications.url;
        }
      }
    }

    if (modifications.method) {
      request.method = modifications.method;
    }

    if (modifications.body) {
      if (!request.body) {
        request.body = { mode: 'json', json: '' };
      }
      if (request.body.mode === 'json' || !request.body.mode) {
        try {
          const currentBody = request.body.json ? JSON.parse(request.body.json) : {};
          const mergedBody = { ...currentBody, ...modifications.body };
          request.body.mode = 'json';
          request.body.json = JSON.stringify(mergedBody, null, 2);
        } catch (e) {
          request.body.mode = 'json';
          request.body.json = JSON.stringify(modifications.body, null, 2);
        }
      }
    }

    if (modifications.headers) {
      if (!request.headers) {
        request.headers = [];
      }
      Object.entries(modifications.headers).forEach(([name, value]) => {
        const existingHeader = request.headers.find(h => h.name === name);
        if (existingHeader) {
          existingHeader.value = value;
          existingHeader.enabled = true;
        } else {
          request.headers.push({ name, value, enabled: true });
        }
      });
    }

    return itemCopy;
  };

  const handleSendRequest = async () => {
    const item = findRequestInCollection(instruction.requestName);
    if (!item) {
      toast.error(`Request "${instruction.requestName}" not found`);
      return;
    }

    const modifiedItem = applyModifications(item, instruction.modifications || {});
    const itemUid = modifiedItem.uid;
    setIsSending(true);
    setResponse(null);

    try {
      await dispatch(sendRequest(modifiedItem, collection.uid));
      
      // Wait for response to be processed
      let attempts = 0;
      const maxAttempts = 20;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const state = store.getState();
        const currentCollections = state.collections.collections || [];
        const currentCollection = currentCollections.find(c => c.uid === collection.uid);
        
        if (currentCollection) {
          const allItems = flattenItems(currentCollection.items || []);
          const updatedItem = allItems.find(i => i.uid === itemUid);
          
          if (updatedItem?.response && updatedItem?.requestState === 'received') {
            setResponse(updatedItem.response);
            setResponses([]); // Clear multiple responses when single response is set
            setActiveTab('response');
            break;
          }
        }
        
        attempts++;
      }
      
      if (onSendRequest) {
        onSendRequest();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to send request');
    } finally {
      setIsSending(false);
    }
  };

  const item = findRequestInCollection(instruction.requestName);
  const request = item ? (item.draft?.request || item.request) : null;
  const modifications = instruction.modifications || {};

  // Build the actual request that would be sent
  const actualRequest = request ? applyModifications(item, modifications).draft.request : null;

  const formatHeaders = (headers) => {
    if (!headers) return [];
    if (Array.isArray(headers)) return headers;
    return Object.entries(headers).map(([key, value]) => ({ name: key, value }));
  };

  const formatBody = (body) => {
    if (!body) return '';
    if (body.mode === 'json' && body.json) {
      try {
        return JSON.stringify(JSON.parse(body.json), null, 2);
      } catch {
        return body.json;
      }
    }
    if (body.text) return body.text;
    return '';
  };

  const ResponseView = ({ response, formatHeaders }) => {
    if (!response) return null;

    return (
      <>
        <div className="field">
          <label>Status</label>
          <div className="value">
            {response.status} {response.statusText || ''}
            {response.isError && <span className="text-red-600 ml-2">(Error)</span>}
          </div>
        </div>
        {response.headers && (
          <div className="field">
            <label>Headers</label>
            <div className="headers-table">
              <table>
                <thead>
                  <tr>
                    <td>Name</td>
                    <td>Value</td>
                  </tr>
                </thead>
                <tbody>
                  {formatHeaders(response.headers).map((header, index) => (
                    <tr key={index}>
                      <td className="header-name">{header.name}</td>
                      <td className="header-value">{header.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {(response.data || response.dataBuffer) && (
          <div className="field">
            <label>Body</label>
            <pre>
              {response.data 
                ? (typeof response.data === 'string' 
                    ? response.data 
                    : JSON.stringify(response.data, null, 2))
                : response.dataBuffer
                  ? Buffer.from(response.dataBuffer, 'base64').toString()
                  : ''}
            </pre>
          </div>
        )}
        {response.error && (
          <div className="field">
            <label>Error</label>
            <div className="value text-red-600">{response.error}</div>
          </div>
        )}
      </>
    );
  };

  return (
    <StyledPanel>
      <div className="panel-header">
        <div className="panel-title">
          <IconFileText size={16} strokeWidth={1.5} />
          <span>Request Details</span>
        </div>
        <button className="close-button" onClick={onClose} title="Close details panel">
          <IconX size={16} strokeWidth={1.5} />
        </button>
      </div>

      <div className="panel-tabs">
        <button
          className={`tab-button ${activeTab === 'request' ? 'active' : ''}`}
          onClick={() => setActiveTab('request')}
        >
          <IconArrowRight size={14} strokeWidth={1.5} />
          Request
        </button>
        <button
          className={`tab-button ${activeTab === 'response' ? 'active' : ''}`}
          onClick={() => setActiveTab('response')}
        >
          <IconFileText size={14} strokeWidth={1.5} />
          Response
        </button>
      </div>

      <div className="panel-content">
        {activeTab === 'request' && (
          <div className="section">
            {actualRequest ? (
              <>
                <div className="field">
                  <label>Method</label>
                  <div className="value">{actualRequest.method || 'GET'}</div>
                </div>
                <div className="field">
                  <label>URL</label>
                  <div className="value">{actualRequest.url || ''}</div>
                </div>
                {actualRequest.headers && actualRequest.headers.length > 0 && (
                  <div className="field">
                    <label>Headers</label>
                    <div className="headers-table">
                      <table>
                        <thead>
                          <tr>
                            <td>Name</td>
                            <td>Value</td>
                          </tr>
                        </thead>
                        <tbody>
                          {formatHeaders(actualRequest.headers)
                            .filter(h => h.enabled !== false)
                            .map((header, index) => (
                              <tr key={index}>
                                <td className="header-name">{header.name}</td>
                                <td className="header-value">{header.value}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {actualRequest.body && actualRequest.body.mode !== 'none' && (
                  <div className="field">
                    <label>Body</label>
                    <pre>{formatBody(actualRequest.body)}</pre>
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state">Request not found</div>
            )}
            <button 
              className="send-button" 
              onClick={handleSendRequest}
              disabled={isSending}
            >
              {isSending ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        )}

        {activeTab === 'response' && (
          <div className="section">
            {isSending ? (
              <div className="empty-state">Sending request...</div>
            ) : response ? (
              <ResponseView response={response} formatHeaders={formatHeaders} />
            ) : responses.length > 0 ? (
              <div>
                <h4 className="mb-3">Responses ({responses.length})</h4>
                {responses.map((resp, idx) => (
                  <div key={idx} className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
                    <div className="text-xs font-medium text-muted mb-2">Response {idx + 1}</div>
                    <ResponseView response={resp} formatHeaders={formatHeaders} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">Response will appear here after sending the request</div>
            )}
          </div>
        )}
      </div>
    </StyledPanel>
  );
};

export default RequestDetailsPanel;

