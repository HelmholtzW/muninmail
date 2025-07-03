const keytar = require('keytar');

class CredentialsManager {
    constructor() {
        this.serviceName = 'munin-email';
    }

    async saveCredentials(accountId, credentials) {
        try {
            const credentialsJson = JSON.stringify(credentials);
            await keytar.setPassword(this.serviceName, accountId, credentialsJson);
            console.log(`Credentials saved for account: ${accountId}`);
            return true;
        } catch (error) {
            console.error('Error saving credentials:', error);
            return false;
        }
    }

    async getCredentials(accountId) {
        try {
            const credentialsJson = await keytar.getPassword(this.serviceName, accountId);
            if (!credentialsJson) {
                return null;
            }
            return JSON.parse(credentialsJson);
        } catch (error) {
            console.error('Error retrieving credentials:', error);
            return null;
        }
    }

    async deleteCredentials(accountId) {
        try {
            await keytar.deletePassword(this.serviceName, accountId);
            console.log(`Credentials deleted for account: ${accountId}`);
            return true;
        } catch (error) {
            console.error('Error deleting credentials:', error);
            return false;
        }
    }

    async getAllAccounts() {
        try {
            const accounts = await keytar.findCredentials(this.serviceName);
            return accounts.map(account => account.account);
        } catch (error) {
            console.error('Error retrieving accounts:', error);
            return [];
        }
    }

    async hasCredentials(accountId) {
        try {
            const credentials = await keytar.getPassword(this.serviceName, accountId);
            return credentials !== null;
        } catch (error) {
            console.error('Error checking credentials:', error);
            return false;
        }
    }
}

module.exports = CredentialsManager; 