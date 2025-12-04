import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import get from 'lodash/get';
import { createProvider, PROVIDER_CONFIGS } from '../providers';
import { useChatConfig } from './useChatConfig';
import { flattenItems } from 'utils/collections';

/**
 * Custom hook for managing chat state and interactions
 * @param {Object} collection - Collection object
 * @returns {Object} Chat state and functions
 */
export const useChat = (collection) => {
    const { chatConfig } = useChatConfig(collection);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const abortControllerRef = useRef(null);

    // Get collection docs (overview) for context
    const docs = useMemo(() => {
        return collection.draft?.root
            ? get(collection, 'draft.root.docs', '')
            : get(collection, 'root.docs', '');
    }, [collection]);

    // Get all requests from the collection for context
    const requestsInfo = useMemo(() => {
        if (!collection || !collection.items) {
            return '';
        }

        const allItems = flattenItems(collection.items);
        const requests = allItems.filter((item) => {
            return item.request && ['http-request', 'graphql-request', 'grpc-request', 'ws-request'].includes(item.type);
        });

        if (requests.length === 0) {
            return '';
        }

        const formatRequest = (item) => {
            const request = item.draft ? item.draft.request : item.request;
            const requestDocs = item.draft ? get(item, 'draft.request.docs', '') : get(item, 'request.docs', '');
            const method = request?.method || 'GET';
            const url = request?.url || '';

            let formatted = `- ${item.name || 'Unnamed Request'}\n  Method: ${method}\n  URL: ${url}`;

            if (requestDocs?.trim()) {
                formatted += `\n  Description: ${requestDocs.trim()}`;
            }

            return formatted;
        };

        return `\n\nAPI Requests in this Collection:\n${requests.map(formatRequest).join('\n\n')}`;
    }, [collection]);

    // Initialize provider when config changes
    const provider = useRef(null);

    useEffect(() => {
        try {
            if (chatConfig.provider) {
                // Always create provider instance, even without API key
                // This allows provider selection to work
                provider.current = createProvider(chatConfig.provider, {
                    apiKey: chatConfig.apiKey || '',
                    model: chatConfig.model
                });
                setError(null);
            } else {
                provider.current = null;
            }
        } catch (err) {
            console.error('Error creating provider:', err);
            setError(err.message);
            provider.current = null;
        }
    }, [chatConfig.provider, chatConfig.apiKey, chatConfig.model]);

    /**
     * Sends a message to the AI provider
     * @param {string} content - Message content
     */
    const sendMessage = useCallback(
        async (content) => {
            if (!content.trim() || isLoading || !provider.current) {
                return;
            }

            // Validate provider config
            const validation = provider.current.validateConfig();
            if (!validation.valid) {
                setError(validation.error);
                return;
            }

            setIsLoading(true);
            setError(null);

            // Create abort controller for cancellation
            abortControllerRef.current = new AbortController();

            // Prepare messages for API (exclude timestamp)
            // If this is the first message, include docs and requests as context
            const isFirstMessage = messages.length === 0;
            let userContent = content.trim();

            if (isFirstMessage) {
                const contextParts = [];

                if (docs?.trim()) {
                    contextParts.push(`Collection Overview:\n${docs}`);
                }

                if (requestsInfo?.trim()) {
                    contextParts.push(requestsInfo);
                }

                if (contextParts.length > 0) {
                    userContent = `${contextParts.join('\n')}\n\n---\n\nUser Question: ${content.trim()}`;
                }
            }

            const apiMessages = [
                ...messages.map((msg) => ({
                    role: msg.role,
                    content: msg.content
                })),
                {
                    role: 'user',
                    content: userContent
                }
            ];

            // Generate curl command before sending
            let curlCommand = '';
            try {
                if (provider.current && typeof provider.current.generateCurl === 'function') {
                    curlCommand = provider.current.generateCurl(apiMessages, {
                        temperature: chatConfig.temperature,
                        maxTokens: chatConfig.maxTokens
                    });
                }
            } catch (err) {
                console.warn('Failed to generate curl:', err);
            }

            // Add user message with curl
            const userMessage = {
                role: 'user',
                content: content.trim(),
                timestamp: Date.now(),
                curl: curlCommand
            };

            setMessages((prev) => [...prev, userMessage]);

            try {

                // Send to provider
                const response = await provider.current.sendMessage(apiMessages, {
                    temperature: chatConfig.temperature,
                    maxTokens: chatConfig.maxTokens,
                    signal: abortControllerRef.current.signal
                });

                // Add assistant response
                const assistantMessage = {
                    role: 'assistant',
                    content: response.content,
                    timestamp: Date.now(),
                    usage: response.usage,
                    model: response.model
                };

                setMessages((prev) => [...prev, assistantMessage]);
            } catch (err) {
                if (err.name === 'AbortError') {
                    // Request was cancelled, don't show error
                    return;
                }

                setError(err.message || 'Failed to send message');
                console.error('Chat error:', err);
            } finally {
                setIsLoading(false);
                abortControllerRef.current = null;
            }
        },
        [messages, isLoading, chatConfig, provider]
    );

    /**
     * Clears the chat history
     */
    const clearChat = useCallback(() => {
        setMessages([]);
        setError(null);
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setIsLoading(false);
    }, []);

    /**
     * Cancels the current request
     */
    const cancelRequest = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            setIsLoading(false);
        }
    }, []);

    /**
     * Gets the current provider display name
     */
    const getProviderDisplayName = useCallback(() => {
        const providerConfig = PROVIDER_CONFIGS[chatConfig.provider];
        return providerConfig?.displayName || chatConfig.provider;
    }, [chatConfig.provider]);

    return {
        messages,
        isLoading,
        error,
        sendMessage,
        clearChat,
        cancelRequest,
        getProviderDisplayName
    };
};

export default useChat;

