import BaseProvider from './BaseProvider';
import { Groq } from 'groq-sdk';

/**
 * Groq Provider using Groq SDK
 * Supports high-performance inference with various models
 */
class GroqProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.model = config.model || 'llama-3.1-70b-versatile';
    // Initialize Groq SDK client
    // Note: dangerouslyAllowBrowser is required for browser/Electron environments
    this.groq = new Groq({
      apiKey: this.apiKey,
      dangerouslyAllowBrowser: true
    });
  }

  getDisplayName() {
    return 'Groq';
  }

  validateConfig() {
    const baseValidation = super.validateConfig();
    if (!baseValidation.valid) {
      return baseValidation;
    }

    return { valid: true };
  }

  /**
   * Format messages for Groq API
   * Groq uses OpenAI-compatible format
   */
  formatMessages(messages) {
    return messages.map((msg) => ({
      role: msg.role,
      content: msg.content
    }));
  }

  async sendMessage(messages, options = {}) {
    const validation = this.validateConfig();
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Re-initialize Groq client if API key changed
    if (this.groq.apiKey !== this.apiKey) {
      this.groq = new Groq({
        apiKey: this.apiKey,
        dangerouslyAllowBrowser: true
      });
    }

    const formattedMessages = this.formatMessages(messages);
    const modelName = options.model || this.model;

    // Build request parameters according to Groq SDK format
    const requestParams = {
      model: modelName,
      messages: formattedMessages,
      temperature: options.temperature ?? 1,
      max_completion_tokens: options.maxTokens || options.max_completion_tokens || 8192,
      top_p: options.top_p ?? 1,
      stream: false // Non-streaming for now, as the hook expects complete response
    };

    // Add optional Groq-specific parameters
    if (options.reasoning_effort !== undefined) {
      requestParams.reasoning_effort = options.reasoning_effort;
    }
    if (options.stop !== undefined && options.stop !== null) {
      requestParams.stop = options.stop;
    }

    try {
      console.log('Groq API Request:', {
        model: requestParams.model,
        messages: requestParams.messages,
        temperature: requestParams.temperature,
        max_completion_tokens: requestParams.max_completion_tokens,
        top_p: requestParams.top_p,
        apiKey: this.apiKey ? `${this.apiKey.substring(0, 4)}...` : 'MISSING'
      });

      // Use Groq SDK to create chat completion
      const chatCompletion = await this.groq.chat.completions.create(requestParams);

      console.log('Groq API Success Response:', chatCompletion);

      // Extract text from response
      // Format: chatCompletion.choices[0].message.content
      const text = chatCompletion.choices?.[0]?.message?.content || '';

      if (!text) {
        console.error('Groq API: No text in response', chatCompletion);
        throw new Error('No response text received from Groq API');
      }

      // Extract usage metadata if available
      const usage = chatCompletion.usage || {};

      return {
        content: text,
        usage: usage,
        model: chatCompletion.model || modelName
      };
    } catch (error) {
      // Log full error details for debugging
      console.error('Groq API Full Error:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause,
        error: error
      });

      // Handle specific Groq API errors
      if (error.message) {
        throw new Error(`Groq API error: ${error.message}`);
      }
      throw new Error(`Groq API error: ${error.toString()}`);
    }
  }

  generateCurl(messages, options = {}) {
    const formattedMessages = this.formatMessages(messages);
    const modelName = options.model || this.model;
    const baseUrl = 'https://api.groq.com/openai/v1';

    const requestBody = {
      model: modelName,
      messages: formattedMessages,
      temperature: options.temperature ?? 1,
      max_completion_tokens: options.maxTokens || options.max_completion_tokens || 8192,
      top_p: options.top_p ?? 1,
      stream: false
    };

    // Add optional Groq-specific parameters
    if (options.reasoning_effort !== undefined) {
      requestBody.reasoning_effort = options.reasoning_effort;
    }
    if (options.stop !== undefined && options.stop !== null) {
      requestBody.stop = options.stop;
    }

    const bodyJson = JSON.stringify(requestBody, null, 2);
    const escapedBody = bodyJson.replace(/'/g, "'\\''");

    return `curl "${baseUrl}/chat/completions" \\\n  -H 'Content-Type: application/json' \\\n  -H 'Authorization: Bearer ${this.apiKey}' \\\n  -X POST \\\n  -d '${escapedBody}'`;
  }
}

export default GroqProvider;

