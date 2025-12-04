/**
 * Base Provider class for Chat AI providers
 * Implements Strategy Pattern for different AI providers
 */
class BaseProvider {
  constructor(config = {}) {
    this.config = config;
    this.apiKey = config.apiKey || '';
    this.baseUrl = config.baseUrl || '';
  }

  /**
   * Validates the provider configuration
   * @returns {Object} { valid: boolean, error?: string }
   */
  validateConfig() {
    if (!this.apiKey || this.apiKey.trim() === '') {
      return { valid: false, error: 'API Key is required' };
    }
    return { valid: true };
  }

  /**
   * Sends a message to the AI provider
   * @param {Array} messages - Array of message objects with role and content
   * @param {Object} options - Additional options (temperature, maxTokens, etc.)
   * @returns {Promise<Object>} Response from the provider
   */
  async sendMessage(messages, options = {}) {
    throw new Error('sendMessage must be implemented by subclass');
  }

  /**
   * Formats messages for the provider's API format
   * @param {Array} messages - Array of message objects
   * @returns {Array} Formatted messages
   */
  formatMessages(messages) {
    return messages.map((msg) => ({
      role: msg.role,
      content: msg.content
    }));
  }

  /**
   * Gets the provider name
   * @returns {string}
   */
  getName() {
    return this.constructor.name;
  }

  /**
   * Gets the provider display name
   * @returns {string}
   */
  getDisplayName() {
    return 'Base Provider';
  }

  /**
   * Generates a curl command equivalent to the API request
   * @param {Array} messages - Array of message objects
   * @param {Object} options - Additional options
   * @returns {string} Curl command string
   */
  generateCurl(messages, options = {}) {
    throw new Error('generateCurl must be implemented by subclass');
  }
}

export default BaseProvider;

