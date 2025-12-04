import { useMemo } from 'react';
import { useDispatch } from 'react-redux';
import get from 'lodash/get';
import { updateCollectionChatConfig } from 'providers/ReduxStore/slices/collections';
import { saveCollectionSettings } from 'providers/ReduxStore/slices/collections/actions';

/**
 * Custom hook for managing chat configuration
 * @param {Object} collection - Collection object
 * @returns {Object} Chat configuration and update functions
 */
export const useChatConfig = (collection) => {
    const dispatch = useDispatch();

    // Get chat config from brunoConfig (draft or saved)
    const chatConfig = useMemo(() => {
        const config = collection.draft?.brunoConfig
            ? get(collection, 'draft.brunoConfig.chat', {})
            : get(collection, 'brunoConfig.chat', {});

        return {
            provider: config.provider || 'gemini',
            apiKey: config.apiKey || '',
            model: config.model || '',
            temperature: config.temperature ?? 0.7,
            maxTokens: config.maxTokens || 1000,
            ...config
        };
    }, [collection]);

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
        updateConfig({ provider });
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

