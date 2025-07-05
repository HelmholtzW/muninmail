// LLM Provider configurations
const LLM_PROVIDER_CONFIGS = {
    openai: {
        name: 'OpenAI',
        provider: 'openai',
        defaultModels: [
            'gpt-4',
            'gpt-4-turbo',
            'gpt-3.5-turbo',
            'gpt-3.5-turbo-16k'
        ],
        defaultBaseUrl: 'https://api.openai.com/v1',
        requiresApiKey: true,
        supportsCustomBaseUrl: true,
        description: 'OpenAI GPT models including GPT-4 and GPT-3.5-turbo',
        apiKeyLabel: 'OpenAI API Key',
        apiKeyPlaceholder: 'sk-...',
        baseUrlLabel: 'Base URL (optional)',
        baseUrlPlaceholder: 'https://api.openai.com/v1'
    },
    anthropic: {
        name: 'Anthropic',
        provider: 'anthropic',
        defaultModels: [
            'claude-3-opus-20240229',
            'claude-3-sonnet-20240229',
            'claude-3-haiku-20240307',
            'claude-2.1',
            'claude-2.0'
        ],
        defaultBaseUrl: 'https://api.anthropic.com',
        requiresApiKey: true,
        supportsCustomBaseUrl: false,
        description: 'Anthropic Claude models',
        apiKeyLabel: 'Anthropic API Key',
        apiKeyPlaceholder: 'sk-ant-...'
    },
    google: {
        name: 'Google AI',
        provider: 'google',
        defaultModels: [
            'gemini-pro',
            'gemini-pro-vision',
            'gemini-1.5-pro',
            'gemini-1.5-flash'
        ],
        defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1',
        requiresApiKey: true,
        supportsCustomBaseUrl: false,
        description: 'Google Gemini models',
        apiKeyLabel: 'Google AI API Key',
        apiKeyPlaceholder: 'AIza...'
    },
    ollama: {
        name: 'Ollama',
        provider: 'ollama',
        defaultModels: [
            'llama2',
            'llama2:13b',
            'llama2:70b',
            'codellama',
            'mistral',
            'mixtral',
            'phi'
        ],
        defaultBaseUrl: 'http://localhost:11434',
        requiresApiKey: false,
        supportsCustomBaseUrl: true,
        description: 'Local Ollama models',
        apiKeyLabel: 'API Key (optional)',
        apiKeyPlaceholder: 'Leave empty for local Ollama',
        baseUrlLabel: 'Ollama Base URL',
        baseUrlPlaceholder: 'http://localhost:11434'
    }
};

class LLMConfigHelper {
    static getProviderConfig(providerKey) {
        return LLM_PROVIDER_CONFIGS[providerKey] || null;
    }

    static getAllProviders() {
        return Object.keys(LLM_PROVIDER_CONFIGS).map(key => ({
            key,
            ...LLM_PROVIDER_CONFIGS[key]
        }));
    }

    static createLLMConfig(providerKey, modelName, apiKey, baseUrl = null, additionalConfig = {}) {
        const providerConfig = this.getProviderConfig(providerKey);
        if (!providerConfig) {
            throw new Error(`Unknown LLM provider: ${providerKey}`);
        }

        return {
            provider: providerKey,
            modelName,
            apiKey: apiKey || '',
            baseUrl: baseUrl || providerConfig.defaultBaseUrl,
            configData: additionalConfig,
            isActive: false
        };
    }

    static validateLLMConfig(config) {
        const providerConfig = this.getProviderConfig(config.provider);
        if (!providerConfig) {
            throw new Error(`Unknown LLM provider: ${config.provider}`);
        }

        if (providerConfig.requiresApiKey && !config.apiKey) {
            throw new Error(`API key is required for provider: ${config.provider}`);
        }

        if (!config.modelName) {
            throw new Error('Model name is required');
        }

        return true;
    }

    static getDefaultModelForProvider(providerKey) {
        const providerConfig = this.getProviderConfig(providerKey);
        return providerConfig?.defaultModels[0] || '';
    }

    static isModelCompatible(providerKey, modelName) {
        const providerConfig = this.getProviderConfig(providerKey);
        if (!providerConfig) return false;

        // For providers like Ollama that support custom models, we're more lenient
        if (providerKey === 'ollama') {
            return true;
        }

        // For other providers, check if it's in the default models list
        return providerConfig.defaultModels.includes(modelName);
    }
}

module.exports = {
    LLM_PROVIDER_CONFIGS,
    LLMConfigHelper
};