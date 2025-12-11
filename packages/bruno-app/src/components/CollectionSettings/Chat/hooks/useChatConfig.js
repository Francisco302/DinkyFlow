import { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import get from 'lodash/get';
import { updateCollectionChatConfig } from 'providers/ReduxStore/slices/collections';
import { saveCollectionSettings } from 'providers/ReduxStore/slices/collections/actions';
import { PROVIDER_TYPES, PROVIDER_CONFIGS } from '../providers';

/**
 * Custom hook for managing chat configuration
 * @param {Object} collection - Collection object
 * @returns {Object} Chat configuration and update functions
 */
export const useChatConfig = (collection) => {
    const dispatch = useDispatch();
    const preferences = useSelector((state) => state.app.preferences);

    // Get chat config from brunoConfig (draft or saved)
    const chatConfig = useMemo(() => {
        const config = collection.draft?.brunoConfig
            ? get(collection, 'draft.brunoConfig.chat', {})
            : get(collection, 'brunoConfig.chat', {});
        const provider = config.provider || 'gemini';
        
        // Get API key from collection config, or fallback to global preferences
        let apiKey = config.apiKey || '';
        if (!apiKey) {
            // Use global preferences API key based on provider
            if (provider === PROVIDER_TYPES.GEMINI) {
                apiKey = get(preferences, 'ai.geminiApiKey', '') || '';
            } else if (provider === PROVIDER_TYPES.CHATGPT) {
                apiKey = get(preferences, 'ai.chatGptApiKey', '') || '';
            } else if (provider === PROVIDER_TYPES.GROQ) {
                apiKey = get(preferences, 'ai.groqApiKey', '') || '';
            }
        }

        return {
            provider,
            apiKey,
            model: config.model || '',
            temperature: config.temperature ?? 0.7,
            maxTokens: config.maxTokens || 1000,
            ...config
        };
    }, [collection, preferences]);

    /**
     * Updates chat configuration
     * @param {Object} updates - Partial configuration updates
     */
    const updateConfig = (updates) => {
        dispatch(
            updateCollectionChatConfig({
                collectionUid: collection.uid,
                config: {
                    ...chatConfig,
                    ...updates
                }
            })
        );
    };

    /**
     * Saves chat configuration to disk
     */
    const saveConfig = () => {
        dispatch(saveCollectionSettings(collection.uid));
    };

    /**
     * Updates API key
     * @param {string} apiKey - New API key
     */
    const updateApiKey = (apiKey) => {
        updateConfig({ apiKey });
    };

    /**
     * Updates provider type
     * @param {string} provider - Provider type
     */
    const updateProvider = (provider) => {
        // If there's no API key in collection config, use the one from global preferences
        const collectionApiKey = collection.draft?.brunoConfig
            ? get(collection, 'draft.brunoConfig.chat.apiKey', '')
            : get(collection, 'brunoConfig.chat.apiKey', '');
        
        let apiKey = collectionApiKey;
        if (!apiKey) {
            // Use global preferences API key based on new provider
            if (provider === PROVIDER_TYPES.GEMINI) {
                apiKey = get(preferences, 'ai.geminiApiKey', '') || '';
            } else if (provider === PROVIDER_TYPES.CHATGPT) {
                apiKey = get(preferences, 'ai.chatGptApiKey', '') || '';
            } else if (provider === PROVIDER_TYPES.GROQ) {
                apiKey = get(preferences, 'ai.groqApiKey', '') || '';
            }
        }
        
        // Get default model for the new provider
        const providerConfig = PROVIDER_CONFIGS[provider];
        const defaultModel = providerConfig?.defaultModel || '';
        
        // Update provider, API key, and reset model to default for new provider
        updateConfig({ 
            provider, 
            apiKey,
            model: defaultModel 
        });
    };

    /**
     * Updates model
     * @param {string} model - Model name
     */
    const updateModel = (model) => {
        updateConfig({ model });
    };

    /**
     * Updates temperature
     * @param {number} temperature - Temperature value (0-2)
     */
    const updateTemperature = (temperature) => {
        updateConfig({ temperature });
    };

    /**
     * Updates max tokens
     * @param {number} maxTokens - Maximum tokens
     */
    const updateMaxTokens = (maxTokens) => {
        updateConfig({ maxTokens });
    };

    return {
        chatConfig,
        updateConfig,
        saveConfig,
        updateApiKey,
        updateProvider,
        updateModel,
        updateTemperature,
        updateMaxTokens
    };
};

export default useChatConfig;

