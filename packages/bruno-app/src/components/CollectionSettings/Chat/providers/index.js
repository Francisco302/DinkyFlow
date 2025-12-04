import BaseProvider from './BaseProvider';
import ChatGPTProvider from './ChatGPTProvider';
import GeminiProvider from './GeminiProvider';

export const PROVIDER_TYPES = {
  CHATGPT: 'chatgpt',
  GEMINI: 'gemini'
};

export const PROVIDER_CONFIGS = {
  [PROVIDER_TYPES.GEMINI]: {
    name: 'Gemini',
    displayName: 'Gemini (Google AI)',
    providerClass: GeminiProvider,
    defaultModel: 'gemini-2.0-flash',
    apiKeyPlaceholder: 'Enter your Google AI API key',
    models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro', 'gemini-pro-vision']
  },
  [PROVIDER_TYPES.CHATGPT]: {
    name: 'ChatGPT',
    displayName: 'ChatGPT (OpenAI)',
    providerClass: ChatGPTProvider,
    defaultModel: 'gpt-3.5-turbo',
    apiKeyPlaceholder: 'sk-...',
    models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo']
  },
};

/**
 * Creates a provider instance based on type
 * @param {string} type - Provider type
 * @param {Object} config - Provider configuration
 * @returns {BaseProvider} Provider instance
 */
export const createProvider = (type, config = {}) => {
  const providerConfig = PROVIDER_CONFIGS[type];
  if (!providerConfig) {
    throw new Error(`Unknown provider type: ${type}`);
  }

  const ProviderClass = providerConfig.providerClass;
  return new ProviderClass({
    ...config,
    model: config.model || providerConfig.defaultModel
  });
};

/**
 * Gets available provider types
 * @returns {Array<string>} Array of provider type keys
 */
export const getAvailableProviders = () => {
  return Object.keys(PROVIDER_CONFIGS);
};

export { BaseProvider, ChatGPTProvider, GeminiProvider };

