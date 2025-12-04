import BaseProvider from './BaseProvider';

/**
 * ChatGPT Provider using OpenAI API
 */
class ChatGPTProvider extends BaseProvider {
    constructor(config = {}) {
        super(config);
        this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
        this.model = config.model || 'gpt-3.5-turbo';
    }

    getDisplayName() {
        return 'ChatGPT (OpenAI)';
    }

    validateConfig() {
        const baseValidation = super.validateConfig();
        if (!baseValidation.valid) {
            return baseValidation;
        }

        if (!this.apiKey.startsWith('sk-')) {
            return { valid: false, error: 'Invalid OpenAI API key format' };
        }

        return { valid: true };
    }

    async sendMessage(messages, options = {}) {
        const validation = this.validateConfig();
        if (!validation.valid) {
            throw new Error(validation.error);
        }

        const formattedMessages = this.formatMessages(messages);
        const requestBody = {
            model: options.model || this.model,
            messages: formattedMessages,
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens || 1000
        };

        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `API error: ${response.statusText}`);
            }

            const data = await response.json();
            return {
                content: data.choices[0]?.message?.content || '',
                usage: data.usage,
                model: data.model
            };
        } catch (error) {
            throw new Error(`ChatGPT API error: ${error.message}`);
        }
    }

    generateCurl(messages, options = {}) {
        const formattedMessages = this.formatMessages(messages);
        const modelName = options.model || this.model;
        const requestBody = {
            model: modelName,
            messages: formattedMessages,
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens || 1000
        };

        const bodyJson = JSON.stringify(requestBody, null, 2);
        const escapedBody = bodyJson.replace(/'/g, "'\\''");

        return `curl "${this.baseUrl}/chat/completions" \\\n  -H 'Content-Type: application/json' \\\n  -H 'Authorization: Bearer ${this.apiKey}' \\\n  -X POST \\\n  -d '${escapedBody}'`;
    }
}

export default ChatGPTProvider;

