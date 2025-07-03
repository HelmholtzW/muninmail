const CredentialsManager = require('./credentials');
const ImapSmtpProvider = require('./email-providers/ImapSmtpProvider');
const EmailDatabase = require('./database');

class EmailManager {
    constructor(database) {
        this.database = database;
        this.credentialsManager = new CredentialsManager();
        this.activeProviders = new Map();
        this.accountConfigs = new Map();
    }

    async addAccount(accountData) {
        try {
            const accountId = this.generateAccountId(accountData.email);

            // Validate required fields
            if (!accountData.email || !accountData.password) {
                throw new Error('Email and password are required');
            }

            // Create provider config
            const providerConfig = {
                email: accountData.email,
                password: accountData.password,
                imapHost: accountData.imapHost,
                imapPort: accountData.imapPort || 993,
                imapTls: accountData.imapTls !== false,
                smtpHost: accountData.smtpHost,
                smtpPort: accountData.smtpPort || 587,
                smtpSecure: accountData.smtpSecure || false,
                providerType: accountData.providerType || 'imap-smtp'
            };

            // Test connection before saving
            const provider = this.createProvider(providerConfig);
            const testResult = await provider.testConnection();

            if (!testResult.success) {
                throw new Error(`Connection test failed: ${testResult.error}`);
            }

            // Save credentials securely
            const credentialsSaved = await this.credentialsManager.saveCredentials(accountId, providerConfig);

            if (!credentialsSaved) {
                throw new Error('Failed to save credentials securely');
            }

            // Store account config (without password)
            const accountConfig = {
                id: accountId,
                email: accountData.email,
                displayName: accountData.displayName || accountData.email,
                providerType: providerConfig.providerType,
                imapHost: providerConfig.imapHost,
                imapPort: providerConfig.imapPort,
                smtpHost: providerConfig.smtpHost,
                smtpPort: providerConfig.smtpPort,
                isActive: true,
                createdAt: new Date().toISOString()
            };

            this.accountConfigs.set(accountId, accountConfig);

            console.log(`Account added successfully: ${accountData.email}`);
            return { success: true, accountId };

        } catch (error) {
            console.error('Error adding account:', error);
            return { success: false, error: error.message };
        }
    }

    async removeAccount(accountId) {
        try {
            // Disconnect provider if active
            if (this.activeProviders.has(accountId)) {
                await this.activeProviders.get(accountId).disconnect();
                this.activeProviders.delete(accountId);
            }

            // Remove from storage
            await this.credentialsManager.deleteCredentials(accountId);
            this.accountConfigs.delete(accountId);

            console.log(`Account removed: ${accountId}`);
            return { success: true };

        } catch (error) {
            console.error('Error removing account:', error);
            return { success: false, error: error.message };
        }
    }

    async getAccounts() {
        try {
            const storedAccountIds = await this.credentialsManager.getAllAccounts();
            const accounts = [];

            for (const accountId of storedAccountIds) {
                const credentials = await this.credentialsManager.getCredentials(accountId);
                if (credentials) {
                    accounts.push({
                        id: accountId,
                        email: credentials.email,
                        displayName: credentials.displayName || credentials.email,
                        providerType: credentials.providerType,
                        isActive: this.activeProviders.has(accountId)
                    });
                }
            }

            return accounts;
        } catch (error) {
            console.error('Error getting accounts:', error);
            return [];
        }
    }

    async syncEmails(accountId, options = {}) {
        try {
            const provider = await this.getProvider(accountId);
            if (!provider) {
                throw new Error('Provider not found for account');
            }

            console.log(`Syncing emails for account: ${accountId}`);
            const emails = await provider.fetchEmails(options);

            // Save emails to database
            let savedCount = 0;
            for (const email of emails) {
                const emailId = this.database.insertEmail(email);
                if (emailId) {
                    savedCount++;
                }
            }

            console.log(`Synced ${savedCount} emails for account: ${accountId}`);
            return { success: true, count: savedCount };

        } catch (error) {
            console.error('Error syncing emails:', error);
            return { success: false, error: error.message };
        }
    }

    async sendEmail(accountId, emailData) {
        try {
            const provider = await this.getProvider(accountId);
            if (!provider) {
                throw new Error('Provider not found for account');
            }

            const result = await provider.sendEmail(emailData);
            return result;

        } catch (error) {
            console.error('Error sending email:', error);
            return { success: false, error: error.message };
        }
    }

    async testAccountConnection(accountId) {
        try {
            const provider = await this.getProvider(accountId);
            if (!provider) {
                throw new Error('Provider not found for account');
            }

            return await provider.testConnection();
        } catch (error) {
            console.error('Error testing connection:', error);
            return { success: false, error: error.message };
        }
    }

    async getFolders(accountId) {
        try {
            const provider = await this.getProvider(accountId);
            if (!provider) {
                throw new Error('Provider not found for account');
            }

            return await provider.getFolders();
        } catch (error) {
            console.error('Error getting folders:', error);
            return [];
        }
    }

    async getProvider(accountId) {
        // Return cached provider if available
        if (this.activeProviders.has(accountId)) {
            return this.activeProviders.get(accountId);
        }

        // Create new provider
        const credentials = await this.credentialsManager.getCredentials(accountId);
        if (!credentials) {
            throw new Error('Credentials not found for account');
        }

        const provider = this.createProvider(credentials);
        this.activeProviders.set(accountId, provider);

        return provider;
    }

    createProvider(config) {
        switch (config.providerType) {
            case 'imap-smtp':
                return new ImapSmtpProvider(config);
            case 'gmail-api':
                // Future implementation
                throw new Error('Gmail API provider not yet implemented');
            case 'outlook-graph':
                // Future implementation
                throw new Error('Outlook Graph API provider not yet implemented');
            default:
                throw new Error(`Unknown provider type: ${config.providerType}`);
        }
    }

    generateAccountId(email) {
        return `${email}_${Date.now()}`;
    }

    async disconnectAll() {
        console.log('Disconnecting all email providers...');
        for (const [accountId, provider] of this.activeProviders) {
            try {
                await provider.disconnect();
                console.log(`Disconnected provider for account: ${accountId}`);
            } catch (error) {
                console.error(`Error disconnecting provider for account ${accountId}:`, error);
            }
        }
        this.activeProviders.clear();
    }
}

module.exports = EmailManager; 