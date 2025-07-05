const BaseEmailProvider = require('./BaseEmailProvider');
const { PublicClientApplication } = require('@azure/msal-node');
const { Client } = require('@microsoft/microsoft-graph-client');
const { AuthenticationProvider } = require('@microsoft/microsoft-graph-client');
const { shell, BrowserWindow } = require('electron');
const url = require('url');
require('isomorphic-fetch');

// Custom authentication provider for Microsoft Graph
class MsalAuthenticationProvider {
    constructor(config, account) {
        this.config = config;
        this.account = account;
    }

    async getAccessToken() {
        try {
            // If we have a valid access token, use it
            if (this.config.accessToken) {
                return this.config.accessToken;
            }

            // Try to refresh the token using the refresh token
            if (this.config.refreshToken) {
                const tokenResponse = await this.refreshAccessToken();
                this.config.accessToken = tokenResponse.access_token;
                return this.config.accessToken;
            }

            throw new Error('No valid access token or refresh token available');
        } catch (error) {
            console.error('Error acquiring token:', error);
            throw error;
        }
    }

    async refreshAccessToken() {
        const tokenEndpoint = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
        
        const params = new URLSearchParams({
            client_id: this.config.clientId,
            scope: 'https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send offline_access',
            refresh_token: this.config.refreshToken,
            grant_type: 'refresh_token'
        });

        const response = await fetch(tokenEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Token refresh failed: ${errorData.error_description || errorData.error}`);
        }

        return await response.json();
    }
}

class OutlookGraphProvider extends BaseEmailProvider {
    constructor(config) {
        super(config);
        this.msalInstance = null;
        this.account = null;
        this.graphClient = null;
        this.authProvider = null;
    }

    async connect() {
        try {
            // Initialize MSAL configuration
            const msalConfig = {
                auth: {
                    clientId: this.config.clientId || '00000000-0000-0000-0000-000000000000', // Default placeholder
                    authority: 'https://login.microsoftonline.com/common',
                },
                cache: {
                    cacheLocation: 'sessionStorage',
                },
            };

            this.msalInstance = new PublicClientApplication(msalConfig);

            // Check if we already have stored authentication
            if (this.config.accessToken && this.config.refreshToken) {
                // Use stored tokens
                this.account = {
                    homeAccountId: this.config.homeAccountId,
                    environment: 'login.microsoftonline.com',
                    tenantId: this.config.tenantId,
                    username: this.config.email,
                    localAccountId: this.config.localAccountId,
                    name: this.config.displayName,
                    authorityType: 'MSSTS',
                };

                this.authProvider = new MsalAuthenticationProvider(this.config, this.account);
                this.graphClient = Client.initWithMiddleware({ authProvider: this.authProvider });
                this.connected = true;
            } else {
                // Need to authenticate
                await this.authenticate();
            }

            return { success: true };
        } catch (error) {
            console.error('Error connecting to Outlook Graph:', error);
            return { success: false, error: error.message };
        }
    }

    async authenticate() {
        return new Promise((resolve, reject) => {
            const authWindow = new BrowserWindow({
                width: 500,
                height: 600,
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true
                },
                show: false,
                title: 'Microsoft Login'
            });

            const scopes = ['https://graph.microsoft.com/Mail.Read', 'https://graph.microsoft.com/Mail.Send', 'offline_access'];
            const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
                `client_id=${this.config.clientId}&` +
                `response_type=code&` +
                `redirect_uri=${encodeURIComponent('https://login.microsoftonline.com/common/oauth2/nativeclient')}&` +
                `scope=${encodeURIComponent(scopes.join(' '))}&` +
                `response_mode=query&` +
                `prompt=select_account`;

            authWindow.loadURL(authUrl);
            authWindow.show();

            authWindow.webContents.on('will-navigate', (event, navigationUrl) => {
                this.handleAuthResponse(navigationUrl, authWindow, resolve, reject);
            });

            authWindow.webContents.on('did-get-redirect-request', (event, oldUrl, newUrl) => {
                this.handleAuthResponse(newUrl, authWindow, resolve, reject);
            });

            authWindow.on('closed', () => {
                reject(new Error('Authentication window was closed'));
            });
        });
    }

    async handleAuthResponse(navigationUrl, authWindow, resolve, reject) {
        try {
            const parsedUrl = new URL(navigationUrl);
            
            if (parsedUrl.origin === 'https://login.microsoftonline.com' && parsedUrl.pathname.includes('/oauth2/nativeclient')) {
                const code = parsedUrl.searchParams.get('code');
                const error = parsedUrl.searchParams.get('error');
                
                if (error) {
                    authWindow.close();
                    reject(new Error(`Authentication failed: ${error}`));
                    return;
                }

                if (code) {
                    authWindow.close();
                    
                    // Exchange code for tokens
                    const tokenResponse = await this.exchangeCodeForTokens(code);
                    
                    // Create account object
                    this.account = {
                        homeAccountId: tokenResponse.account?.homeAccountId || `${tokenResponse.account?.localAccountId}.${tokenResponse.account?.tenantId}`,
                        environment: 'login.microsoftonline.com',
                        tenantId: tokenResponse.account?.tenantId || 'common',
                        username: tokenResponse.account?.username || this.config.email,
                        localAccountId: tokenResponse.account?.localAccountId || tokenResponse.account?.oid,
                        name: tokenResponse.account?.name || this.config.displayName,
                        authorityType: 'MSSTS',
                    };

                    // Store authentication data
                    this.config.accessToken = tokenResponse.accessToken;
                    this.config.refreshToken = tokenResponse.refreshToken;
                    this.config.homeAccountId = this.account.homeAccountId;
                    this.config.tenantId = this.account.tenantId;
                    this.config.localAccountId = this.account.localAccountId;
                    this.config.displayName = this.account.name;

                    // Set up Graph client
                    this.authProvider = new MsalAuthenticationProvider(this.config, this.account);
                    this.graphClient = Client.initWithMiddleware({ authProvider: this.authProvider });
                    this.connected = true;

                    resolve({ success: true, authData: this.config });
                }
            }
        } catch (error) {
            console.error('Error handling auth response:', error);
            authWindow.close();
            reject(error);
        }
    }

    async exchangeCodeForTokens(code) {
        const tokenEndpoint = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
        
        const params = new URLSearchParams({
            client_id: this.config.clientId,
            scope: 'https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send offline_access',
            code: code,
            redirect_uri: 'https://login.microsoftonline.com/common/oauth2/nativeclient',
            grant_type: 'authorization_code'
        });

        const response = await fetch(tokenEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Token exchange failed: ${errorData.error_description || errorData.error}`);
        }

        return await response.json();
    }

    async disconnect() {
        try {
            if (this.account && this.msalInstance) {
                await this.msalInstance.getTokenCache().removeAccount(this.account);
            }
            this.connected = false;
            this.msalInstance = null;
            this.account = null;
            this.graphClient = null;
            this.authProvider = null;
        } catch (error) {
            console.error('Error disconnecting from Outlook Graph:', error);
        }
    }

    async testConnection() {
        try {
            if (!this.connected) {
                await this.connect();
            }

            // Test by getting user profile
            const user = await this.graphClient.api('/me').get();
            return { 
                success: true, 
                userInfo: {
                    displayName: user.displayName,
                    email: user.mail || user.userPrincipalName,
                    id: user.id
                }
            };
        } catch (error) {
            console.error('Connection test failed:', error);
            return { success: false, error: error.message };
        }
    }

    async fetchEmails(options = {}) {
        try {
            if (!this.connected) {
                await this.connect();
            }

            const {
                folder = 'inbox',
                limit = 50,
                since = null,
                includeAttachments = false
            } = options;

            let query = `/me/mailFolders/${folder}/messages`;
            let queryParams = [`$top=${limit}`, '$orderby=receivedDateTime desc'];

            if (since) {
                const sinceDate = new Date(since).toISOString();
                queryParams.push(`$filter=receivedDateTime ge ${sinceDate}`);
            }

            if (queryParams.length > 0) {
                query += `?${queryParams.join('&')}`;
            }

            const response = await this.graphClient.api(query).get();
            const emails = [];

            for (const message of response.value) {
                const email = await this.convertGraphMessageToEmail(message, includeAttachments);
                emails.push(email);
            }

            return emails;
        } catch (error) {
            console.error('Error fetching emails:', error);
            throw error;
        }
    }

    async convertGraphMessageToEmail(message, includeAttachments = false) {
        const email = {
            messageId: message.id,
            internetMessageId: message.internetMessageId,
            subject: message.subject,
            from: {
                name: message.from?.emailAddress?.name || '',
                address: message.from?.emailAddress?.address || ''
            },
            to: message.toRecipients?.map(recipient => ({
                name: recipient.emailAddress?.name || '',
                address: recipient.emailAddress?.address || ''
            })) || [],
            cc: message.ccRecipients?.map(recipient => ({
                name: recipient.emailAddress?.name || '',
                address: recipient.emailAddress?.address || ''
            })) || [],
            bcc: message.bccRecipients?.map(recipient => ({
                name: recipient.emailAddress?.name || '',
                address: recipient.emailAddress?.address || ''
            })) || [],
            date: new Date(message.receivedDateTime),
            body: {
                text: message.body?.content || '',
                html: message.body?.contentType === 'html' ? message.body?.content : ''
            },
            attachments: [],
            flags: {
                seen: message.isRead,
                flagged: message.flag?.flagStatus === 'flagged',
                answered: false, // Graph API doesn't provide this directly
                deleted: false,
                recent: false
            },
            headers: {},
            uid: message.id,
            size: message.bodyPreview?.length || 0
        };

        // Fetch attachments if requested
        if (includeAttachments && message.hasAttachments) {
            try {
                const attachments = await this.graphClient
                    .api(`/me/messages/${message.id}/attachments`)
                    .get();

                email.attachments = attachments.value.map(attachment => ({
                    filename: attachment.name,
                    contentType: attachment.contentType,
                    size: attachment.size,
                    contentId: attachment.contentId,
                    content: attachment.contentBytes ? Buffer.from(attachment.contentBytes, 'base64') : null
                }));
            } catch (error) {
                console.error('Error fetching attachments:', error);
            }
        }

        return email;
    }

    async sendEmail(emailData) {
        try {
            if (!this.connected) {
                await this.connect();
            }

            const message = {
                subject: emailData.subject,
                body: {
                    contentType: emailData.html ? 'html' : 'text',
                    content: emailData.html || emailData.text || ''
                },
                toRecipients: this.formatRecipients(emailData.to),
                ccRecipients: emailData.cc ? this.formatRecipients(emailData.cc) : [],
                bccRecipients: emailData.bcc ? this.formatRecipients(emailData.bcc) : []
            };

            // Handle attachments
            if (emailData.attachments && emailData.attachments.length > 0) {
                message.attachments = emailData.attachments.map(attachment => ({
                    '@odata.type': '#microsoft.graph.fileAttachment',
                    name: attachment.filename,
                    contentType: attachment.contentType || 'application/octet-stream',
                    contentBytes: attachment.content ? attachment.content.toString('base64') : ''
                }));
            }

            const response = await this.graphClient
                .api('/me/sendMail')
                .post({ message });

            return { success: true, messageId: response.id };
        } catch (error) {
            console.error('Error sending email:', error);
            return { success: false, error: error.message };
        }
    }

    formatRecipients(recipients) {
        if (!recipients) return [];
        
        // Handle both string and array formats
        const recipientList = Array.isArray(recipients) ? recipients : [recipients];
        
        return recipientList.map(recipient => {
            if (typeof recipient === 'string') {
                return {
                    emailAddress: {
                        address: recipient
                    }
                };
            } else if (recipient.address) {
                return {
                    emailAddress: {
                        name: recipient.name || '',
                        address: recipient.address
                    }
                };
            }
            return null;
        }).filter(Boolean);
    }

    async getFolders() {
        try {
            if (!this.connected) {
                await this.connect();
            }

            const response = await this.graphClient.api('/me/mailFolders').get();
            return response.value.map(folder => ({
                name: folder.displayName,
                id: folder.id,
                unreadCount: folder.unreadItemCount,
                totalCount: folder.totalItemCount
            }));
        } catch (error) {
            console.error('Error getting folders:', error);
            return [];
        }
    }

    validateConfig() {
        if (!this.config) {
            throw new Error('Configuration is required');
        }

        if (!this.config.email) {
            throw new Error('Email address is required');
        }

        // For Graph API, we don't need password but we need client ID
        if (!this.config.clientId && !this.config.accessToken) {
            throw new Error('Client ID or access token is required');
        }

        return true;
    }
}

module.exports = OutlookGraphProvider;