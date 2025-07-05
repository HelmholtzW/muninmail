// LLM Provider configurations
const LLM_PROVIDER_CONFIGS = {
    openai: {
        name: 'OpenAI',
        provider: 'openai',
        defaultModel: 'gpt-4',
        defaultBaseUrl: 'https://api.openai.com/v1',
        requiresApiKey: true,
        supportsCustomBaseUrl: true,
        description: 'OpenAI GPT models - specify any OpenAI model name',
        modelLabel: 'Model Name',
        modelPlaceholder: 'e.g., gpt-4, gpt-4-turbo, gpt-3.5-turbo',
        apiKeyLabel: 'OpenAI API Key',
        apiKeyPlaceholder: 'sk-...',
        baseUrlLabel: 'Base URL (optional)',
        baseUrlPlaceholder: 'https://api.openai.com/v1'
    },
    anthropic: {
        name: 'Anthropic',
        provider: 'anthropic',
        defaultModel: 'claude-3-sonnet-20240229',
        defaultBaseUrl: 'https://api.anthropic.com',
        requiresApiKey: true,
        supportsCustomBaseUrl: false,
        description: 'Anthropic Claude models - specify any Claude model name',
        modelLabel: 'Model Name',
        modelPlaceholder: 'e.g., claude-3-sonnet-20240229, claude-3-opus-20240229',
        apiKeyLabel: 'Anthropic API Key',
        apiKeyPlaceholder: 'sk-ant-...'
    },
    google: {
        name: 'Google AI',
        provider: 'google',
        defaultModel: 'gemini-pro',
        defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1',
        requiresApiKey: true,
        supportsCustomBaseUrl: false,
        description: 'Google Gemini models - specify any Gemini model name',
        modelLabel: 'Model Name',
        modelPlaceholder: 'e.g., gemini-pro, gemini-1.5-pro, gemini-1.5-flash',
        apiKeyLabel: 'Google AI API Key',
        apiKeyPlaceholder: 'AIza...'
    },
    ollama: {
        name: 'Ollama',
        provider: 'ollama',
        defaultModel: 'llama2',
        defaultBaseUrl: 'http://localhost:11434',
        requiresApiKey: false,
        supportsCustomBaseUrl: true,
        description: 'Local Ollama models - specify any installed model name',
        modelLabel: 'Model Name',
        modelPlaceholder: 'e.g., llama2, mistral, codellama, phi',
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
        return providerConfig?.defaultModel || '';
    }

    static isModelCompatible(providerKey, modelName) {
        const providerConfig = this.getProviderConfig(providerKey);
        if (!providerConfig) return false;

        // All providers now support custom model names
        // Just check that the model name is not empty
        return modelName && modelName.trim().length > 0;
    }
}

module.exports = {
    LLM_PROVIDER_CONFIGS,
    LLMConfigHelper
};