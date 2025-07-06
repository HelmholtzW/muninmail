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

        // Allow either a traditional password OR OAuth2 credentials
        const hasPassword = Boolean(this.config.password);
        const hasOAuth2 = Boolean(this.config.accessToken);

        if (!hasPassword && !hasOAuth2) {
            throw new Error('Either a password or an OAuth2 accessToken is required');
        }

        return true;
    }
}

module.exports = BaseEmailProvider; 