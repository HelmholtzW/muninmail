const { LLMConfigHelper } = require('./llm-providers/llm-configs');

class LLMService {
    constructor(database) {
        this.database = database;
        this.activeConfig = null;
        this.loadActiveConfig();
    }

    async loadActiveConfig() {
        try {
            this.activeConfig = this.database.getActiveLLMConfig();
            if (this.activeConfig) {
                console.log(`Loaded active LLM config: ${this.activeConfig.provider}/${this.activeConfig.model_name}`);
            }
        } catch (error) {
            console.error('Error loading active LLM config:', error);
        }
    }

    async addLLMConfig(configData) {
        try {
            // Validate the configuration
            LLMConfigHelper.validateLLMConfig(configData);

            // Insert the configuration
            const id = this.database.insertLLMConfig(configData);
            
            if (id) {
                console.log(`Added LLM config: ${configData.provider}/${configData.modelName}`);
                return { success: true, id };
            } else {
                return { success: false, error: 'Failed to insert LLM configuration' };
            }
        } catch (error) {
            console.error('Error adding LLM config:', error);
            return { success: false, error: error.message };
        }
    }

    async updateLLMConfig(id, configData) {
        try {
            // Validate the configuration
            LLMConfigHelper.validateLLMConfig(configData);

            // Update the configuration
            const success = this.database.updateLLMConfig(id, configData);
            
            if (success) {
                console.log(`Updated LLM config: ${configData.provider}/${configData.modelName}`);
                
                // If this was the active config, reload it
                if (this.activeConfig && this.activeConfig.id === id) {
                    await this.loadActiveConfig();
                }
                
                return { success: true };
            } else {
                return { success: false, error: 'Failed to update LLM configuration' };
            }
        } catch (error) {
            console.error('Error updating LLM config:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteLLMConfig(id) {
        try {
            const success = this.database.deleteLLMConfig(id);
            
            if (success) {
                console.log(`Deleted LLM config with ID: ${id}`);
                
                // If this was the active config, clear it
                if (this.activeConfig && this.activeConfig.id === id) {
                    this.activeConfig = null;
                }
                
                return { success: true };
            } else {
                return { success: false, error: 'Failed to delete LLM configuration' };
            }
        } catch (error) {
            console.error('Error deleting LLM config:', error);
            return { success: false, error: error.message };
        }
    }

    async setActiveLLMConfig(id) {
        try {
            const success = this.database.setActiveLLMConfig(id);
            
            if (success) {
                await this.loadActiveConfig();
                console.log(`Set active LLM config to ID: ${id}`);
                return { success: true };
            } else {
                return { success: false, error: 'Failed to set active LLM configuration' };
            }
        } catch (error) {
            console.error('Error setting active LLM config:', error);
            return { success: false, error: error.message };
        }
    }

    async getAllLLMConfigs() {
        try {
            const configs = this.database.getAllLLMConfigs();
            return configs.map(config => ({
                ...config,
                // Don't expose the API key in the response for security
                apiKey: config.api_key ? '***' : '',
                hasApiKey: !!config.api_key
            }));
        } catch (error) {
            console.error('Error getting all LLM configs:', error);
            return [];
        }
    }

    async getLLMConfigById(id) {
        try {
            const config = this.database.getLLMConfigById(id);
            if (config) {
                return {
                    ...config,
                    // Don't expose the API key in the response for security
                    apiKey: config.api_key ? '***' : '',
                    hasApiKey: !!config.api_key
                };
            }
            return null;
        } catch (error) {
            console.error('Error getting LLM config by ID:', error);
            return null;
        }
    }

    getActiveLLMConfig() {
        if (this.activeConfig) {
            return {
                ...this.activeConfig,
                // Don't expose the API key in the response for security
                apiKey: this.activeConfig.api_key ? '***' : '',
                hasApiKey: !!this.activeConfig.api_key
            };
        }
        return null;
    }

    // This method would be used by the AI processing pipeline
    getActiveLLMConfigForProcessing() {
        return this.activeConfig;
    }

    async testLLMConnection(id) {
        try {
            const config = this.database.getLLMConfigById(id);
            if (!config) {
                return { success: false, error: 'Configuration not found' };
            }

            // For now, just validate the configuration
            // In the future, this could make actual API calls to test connectivity
            LLMConfigHelper.validateLLMConfig(config);

            return { success: true, message: 'Configuration is valid' };
        } catch (error) {
            console.error('Error testing LLM connection:', error);
            return { success: false, error: error.message };
        }
    }

    // Helper method to get provider information
    getProviderInfo(providerKey) {
        return LLMConfigHelper.getProviderConfig(providerKey);
    }

    getAllProviders() {
        return LLMConfigHelper.getAllProviders();
    }

    // Helper method to create a configuration from form data
    createConfigFromFormData(formData) {
        return LLMConfigHelper.createLLMConfig(
            formData.provider,
            formData.modelName,
            formData.apiKey,
            formData.baseUrl,
            formData.additionalConfig || {}
        );
    }
}

module.exports = LLMService;