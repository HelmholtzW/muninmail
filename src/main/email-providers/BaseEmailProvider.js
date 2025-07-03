class BaseEmailProvider {
    constructor(config) {
        this.config = config;
        this.connected = false;
    }

    // Abstract methods that must be implemented by subclasses
    async connect() {
        throw new Error('connect() must be implemented by subclass');
    }

    async disconnect() {
        throw new Error('disconnect() must be implemented by subclass');
    }

    async fetchEmails(options = {}) {
        throw new Error('fetchEmails() must be implemented by subclass');
    }

    async sendEmail(emailData) {
        throw new Error('sendEmail() must be implemented by subclass');
    }

    async testConnection() {
        throw new Error('testConnection() must be implemented by subclass');
    }

    // Common methods
    isConnected() {
        return this.connected;
    }

    getProviderType() {
        return this.constructor.name;
    }

    validateConfig() {
        if (!this.config) {
            throw new Error('Configuration is required');
        }

        if (!this.config.email) {
            throw new Error('Email address is required');
        }

        if (!this.config.password) {
            throw new Error('Password is required');
        }

        return true;
    }
}

module.exports = BaseEmailProvider; 