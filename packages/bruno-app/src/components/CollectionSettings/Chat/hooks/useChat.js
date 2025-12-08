import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import get from 'lodash/get';
import { createProvider, PROVIDER_CONFIGS } from '../providers';
import { useChatConfig } from './useChatConfig';
import { flattenItems } from 'utils/collections';
import { buildInitialPrompt, buildRequestsInfo } from '../utils/chatPromptTemplate';

/**
 * Custom hook for managing chat state and interactions
 * @param {Object} collection - Collection object
 * @returns {Object} Chat state and functions
 */
export const useChat = (collection) => {
    const { chatConfig } = useChatConfig(collection);
    const storageKey = `chat_messages_${collection?.uid || 'default'}`;
    
    // Load messages from localStorage on mount
    const loadPersistedMessages = useCallback(() => {
        try {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Only restore if it's a valid array
                if (Array.isArray(parsed)) {
                    return parsed;
                }
            }
        } catch (error) {
            console.warn('Failed to load persisted chat messages:', error);
        }
        return [];
    }, [storageKey]);

    const [messages, setMessages] = useState(loadPersistedMessages);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const abortControllerRef = useRef(null);

    // Persist messages to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem(storageKey, JSON.stringify(messages));
        } catch (error) {
            console.warn('Failed to persist chat messages:', error);
        }
    }, [messages, storageKey]);

    // Get collection docs (overview) for context
    const docs = useMemo(() => {
        return collection.draft?.root
            ? get(collection, 'draft.root.docs', '')
            : get(collection, 'root.docs', '');
    }, [collection]);

    // Get current request from collection root (if available)
    const currentRequest = useMemo(() => {
        const root = collection.draft?.root || collection.root;
        if (root?.request) {
            return {
                ...root.request,
                name: root.name || 'Current Request'
            };
        }
        return null;
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

        return buildRequestsInfo(requests);
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
                userContent = buildInitialPrompt({
                    collectionDocs: docs,
                    requestsInfo: requestsInfo,
                    currentRequest: currentRequest,
                    userQuestion: content.trim()
                });
            }

            // Build API messages - use full content (with context) for API calls
            const apiMessages = [
                ...messages.map((msg) => ({
                    role: msg.role,
                    // Use apiContent if available (for first message with context), otherwise use content
                    content: msg.apiContent || msg.content
                })),
                {
                    role: 'user',
                    content: userContent
                }
            ];

            console.log('apiMessages', apiMessages);

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
            // Save original content for display, and full content (with context) for API
            const userMessage = {
                role: 'user',
                content: content.trim(), // Original user content for display
                apiContent: isFirstMessage ? userContent : undefined, // Full content with context for API
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
        // Clear from localStorage
        try {
            localStorage.removeItem(storageKey);
        } catch (error) {
            console.warn('Failed to clear persisted chat messages:', error);
        }
    }, [storageKey]);

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

