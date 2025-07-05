const BaseEmailProvider = require('./BaseEmailProvider');
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');

class GmailApiProvider extends BaseEmailProvider {
    constructor(config) {
        super(config);
        this.oauth2Client = null;
        this.gmail = null;
        this.setupOAuth2();
    }

    setupOAuth2() {
        this.oauth2Client = new OAuth2Client(
            this.config.clientId,
            this.config.clientSecret,
            this.config.redirectUri
        );

        if (this.config.accessToken && this.config.refreshToken) {
            this.oauth2Client.setCredentials({
                access_token: this.config.accessToken,
                refresh_token: this.config.refreshToken
            });
        }
    }

    async connect() {
        try {
            if (!this.oauth2Client) {
                throw new Error('OAuth2 client not initialized');
            }

            // Initialize Gmail API
            this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

            // Test the connection by getting user profile
            const profile = await this.gmail.users.getProfile({
                userId: 'me'
            });

            console.log('Gmail API connection ready for:', profile.data.emailAddress);
            this.connected = true;
        } catch (error) {
            console.error('Gmail API connection error:', error);
            throw error;
        }
    }

    async disconnect() {
        this.gmail = null;
        this.connected = false;
        return Promise.resolve();
    }

    async testConnection() {
        try {
            await this.connect();
            console.log('Gmail API connection test successful');
            return { success: true };
        } catch (error) {
            console.error('Gmail API connection test failed:', error);
            return { success: false, error: error.message };
        }
    }

    async fetchEmails(options = {}) {
        if (!this.connected) {
            await this.connect();
        }

        try {
            const query = options.query || 'in:inbox';
            const maxResults = options.limit || 50;

            // Get list of messages
            const listResponse = await this.gmail.users.messages.list({
                userId: 'me',
                q: query,
                maxResults: maxResults
            });

            const messageIds = listResponse.data.messages || [];
            const emails = [];

            // Fetch each email in parallel for better performance
            const fetchPromises = messageIds.map(async (message) => {
                try {
                    const messageResponse = await this.gmail.users.messages.get({
                        userId: 'me',
                        id: message.id,
                        format: 'full'
                    });

                    const email = this.parseGmailMessage(messageResponse.data);
                    return email;
                } catch (error) {
                    console.error('Error fetching message:', message.id, error);
                    return null;
                }
            });

            const results = await Promise.all(fetchPromises);
            emails.push(...results.filter(email => email !== null));

            console.log(`Fetched ${emails.length} emails from Gmail API`);
            return emails;
        } catch (error) {
            console.error('Error fetching emails:', error);
            throw error;
        }
    }

    parseGmailMessage(message) {
        const headers = message.payload.headers;
        const getHeader = (name) => {
            const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
            return header ? header.value : '';
        };

        // Extract body content
        let bodyText = '';
        let bodyHtml = '';

        if (message.payload.body && message.payload.body.data) {
            bodyText = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
        } else if (message.payload.parts) {
            const textPart = message.payload.parts.find(part => part.mimeType === 'text/plain');
            const htmlPart = message.payload.parts.find(part => part.mimeType === 'text/html');

            if (textPart && textPart.body.data) {
                bodyText = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
            }
            if (htmlPart && htmlPart.body.data) {
                bodyHtml = Buffer.from(htmlPart.body.data, 'base64').toString('utf-8');
            }
        }

        // Parse addresses
        const parseAddresses = (addressString) => {
            if (!addressString) return { email: '', name: '' };
            const match = addressString.match(/^(.+?)\s*<(.+)>$/) || [null, addressString, addressString];
            return {
                name: match[1] ? match[1].trim().replace(/"/g, '') : '',
                email: match[2] ? match[2].trim() : addressString
            };
        };

        const from = parseAddresses(getHeader('From'));
        const to = parseAddresses(getHeader('To'));

        return {
            messageId: message.id,
            subject: getHeader('Subject'),
            senderEmail: from.email,
            senderName: from.name,
            recipientEmail: to.email,
            recipientName: to.name,
            cc: getHeader('Cc'),
            bcc: getHeader('Bcc'),
            bodyText: bodyText,
            bodyHtml: bodyHtml,
            dateReceived: new Date(parseInt(message.internalDate)).toISOString(),
            dateSent: new Date(getHeader('Date')).toISOString(),
            folder: 'INBOX' // Gmail uses labels, but we'll use folder for consistency
        };
    }

    async sendEmail(emailData) {
        if (!this.connected) {
            await this.connect();
        }

        try {
            // Create RFC 2822 formatted message
            const message = this.createRFC2822Message(emailData);

            const response = await this.gmail.users.messages.send({
                userId: 'me',
                requestBody: {
                    raw: Buffer.from(message).toString('base64')
                        .replace(/\+/g, '-')
                        .replace(/\//g, '_')
                        .replace(/=+$/, '')
                }
            });

            console.log('Email sent via Gmail API:', response.data.id);
            return { success: true, messageId: response.data.id };
        } catch (error) {
            console.error('Error sending email via Gmail API:', error);
            return { success: false, error: error.message };
        }
    }

    createRFC2822Message(emailData) {
        const boundary = '----=_Part_' + Math.random().toString(36).substr(2, 9);
        const nl = '\r\n';

        let message = `From: ${this.config.email}${nl}`;
        message += `To: ${emailData.to}${nl}`;
        if (emailData.cc) message += `Cc: ${emailData.cc}${nl}`;
        if (emailData.bcc) message += `Bcc: ${emailData.bcc}${nl}`;
        message += `Subject: ${emailData.subject}${nl}`;
        message += `MIME-Version: 1.0${nl}`;
        message += `Content-Type: multipart/alternative; boundary="${boundary}"${nl}`;
        message += `${nl}`;

        // Text part
        if (emailData.text) {
            message += `--${boundary}${nl}`;
            message += `Content-Type: text/plain; charset="UTF-8"${nl}`;
            message += `Content-Transfer-Encoding: 7bit${nl}`;
            message += `${nl}`;
            message += `${emailData.text}${nl}`;
            message += `${nl}`;
        }

        // HTML part
        if (emailData.html) {
            message += `--${boundary}${nl}`;
            message += `Content-Type: text/html; charset="UTF-8"${nl}`;
            message += `Content-Transfer-Encoding: 7bit${nl}`;
            message += `${nl}`;
            message += `${emailData.html}${nl}`;
            message += `${nl}`;
        }

        message += `--${boundary}--${nl}`;

        return message;
    }

    async getFolders() {
        if (!this.connected) {
            await this.connect();
        }

        try {
            const response = await this.gmail.users.labels.list({
                userId: 'me'
            });

            const folders = response.data.labels.map(label => ({
                name: label.id,
                displayName: label.name,
                attributes: label.type === 'system' ? ['\\System'] : ['\\Custom'],
                delimiter: '/',
                hasChildren: false
            }));

            return folders;
        } catch (error) {
            console.error('Error getting Gmail labels:', error);
            return [];
        }
    }

    // Gmail-specific methods
    async getAuthUrl() {
        const scopes = [
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.send',
            'https://www.googleapis.com/auth/gmail.modify'
        ];

        const authUrl = this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            prompt: 'consent'
        });

        return authUrl;
    }

    async getTokensFromCode(code) {
        try {
            const { tokens } = await this.oauth2Client.getToken(code);
            this.oauth2Client.setCredentials(tokens);
            return tokens;
        } catch (error) {
            console.error('Error getting tokens from code:', error);
            throw error;
        }
    }

    async refreshAccessToken() {
        try {
            const { credentials } = await this.oauth2Client.refreshAccessToken();
            this.oauth2Client.setCredentials(credentials);
            return credentials;
        } catch (error) {
            console.error('Error refreshing access token:', error);
            throw error;
        }
    }

    // Override validateConfig for Gmail API
    validateConfig() {
        if (!this.config) {
            throw new Error('Configuration is required');
        }

        if (!this.config.email) {
            throw new Error('Email address is required');
        }

        if (!this.config.clientId) {
            throw new Error('Client ID is required');
        }

        if (!this.config.clientSecret) {
            throw new Error('Client Secret is required');
        }

        if (!this.config.redirectUri) {
            throw new Error('Redirect URI is required');
        }

        return true;
    }
}

module.exports = GmailApiProvider;