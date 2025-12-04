import BaseProvider from './BaseProvider';

/**
 * Gemini Provider using Google Generative AI REST API
 * Uses direct HTTP calls to match the official API format
 */
class GeminiProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.baseUrl = config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
    this.model = config.model || 'gemini-2.0-flash';
  }

  getDisplayName() {
    return 'Gemini (Google AI)';
  }

  validateConfig() {
    const baseValidation = super.validateConfig();
    if (!baseValidation.valid) {
      return baseValidation;
    }

    return { valid: true };
  }

  /**
   * Format messages for Gemini API
   * Gemini REST API expects contents array with parts containing text
   * When there's conversation history, each message needs a role (user or model)
   */
  formatMessages(messages) {
    return messages.map((msg) => {
      const role = msg.role === 'assistant' ? 'model' : 'user';
      return {
        role: role,
        parts: [{ text: msg.content }]
      };
    });
  }

  async sendMessage(messages, options = {}) {
    const validation = this.validateConfig();
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const modelName = options.model || this.model;
    const formattedMessages = this.formatMessages(messages);

    // Build request body according to Gemini REST API format
    const requestBody = {
      contents: formattedMessages
    };

    // Add generation config if provided
    if (options.temperature !== undefined || options.maxTokens) {
      requestBody.generationConfig = {};
      if (options.temperature !== undefined) {
        requestBody.generationConfig.temperature = options.temperature;
      }
      if (options.maxTokens) {
        requestBody.generationConfig.maxOutputTokens = options.maxTokens;
      }
    }

    try {
      const url = `${this.baseUrl}/models/${modelName}:generateContent`;

      console.log('Gemini API Request:', {
        url,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': this.apiKey ? `${this.apiKey.substring(0, 4)}...` : 'MISSING'
        },
        body: requestBody
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': this.apiKey
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Gemini API Response Status:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Gemini API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          errorData: errorData
        });
        const errorMessage = errorData.error?.message || errorData.message || `API error: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Gemini API Success Response:', data);

      // Extract text from response
      // Format: data.candidates[0].content.parts[0].text
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!text) {
        console.error('Gemini API: No text in response', data);
        throw new Error('No response text received from Gemini API');
      }

      // Extract usage metadata if available
      const usageMetadata = data.usageMetadata || {};

      return {
        content: text,
        usage: usageMetadata,
        model: modelName
      };
    } catch (error) {
      // Log full error details for debugging
      console.error('Gemini API Full Error:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause,
        error: error
      });

      // Handle specific Gemini API errors
      if (error.message) {
        throw new Error(`Gemini API error: ${error.message}`);
      }
      throw new Error(`Gemini API error: ${error.toString()}`);
    }
  }

  generateCurl(messages, options = {}) {
    const formattedMessages = this.formatMessages(messages);
    const modelName = options.model || this.model;

    // For curl, only include contents (no generationConfig)
    const requestBody = {
      contents: formattedMessages
    };

    const bodyJson = JSON.stringify(requestBody, null, 2);
    const escapedBody = bodyJson.replace(/'/g, "'\\''");

    return `curl "${this.baseUrl}/models/${modelName}:generateContent" \\\n  -H 'Content-Type: application/json' \\\n  -H 'X-goog-api-key: ${this.apiKey}' \\\n  -X POST \\\n  -d '${escapedBody}'`;
  }
}

export default GeminiProvider;

