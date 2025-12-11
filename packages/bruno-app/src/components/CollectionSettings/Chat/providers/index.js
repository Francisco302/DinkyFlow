import BaseProvider from './BaseProvider';
import ChatGPTProvider from './ChatGPTProvider';
import GeminiProvider from './GeminiProvider';
import GroqProvider from './GroqProvider';

export const PROVIDER_TYPES = {
  CHATGPT: 'chatgpt',
  GEMINI: 'gemini',
  GROQ: 'groq'
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
  [PROVIDER_TYPES.GROQ]: {
    name: 'Groq',
    displayName: 'Groq',
    providerClass: GroqProvider,
    defaultModel: 'llama-3.1-70b-versatile',
    apiKeyPlaceholder: 'Enter your Groq API key',
    models: [
      'llama-3.1-70b-versatile',
      'llama-3.1-8b-instant',
      'llama-3-70b-8192',
      'llama-3-8b-8192',
      'mixtral-8x7b-32768',
      'gemma-7b-it',
      'openai/gpt-oss-120b'
    ]
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

export { BaseProvider, ChatGPTProvider, GeminiProvider, GroqProvider };

