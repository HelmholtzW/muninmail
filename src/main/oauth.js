const { oauth2 } = require('electron-oauth2');

// Window parameters used for the OAuth popup
const windowParams = {
    alwaysOnTop: true,
    autoHideMenuBar: true,
    webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
    }
};

/**
 * Holds OAuth configuration for supported providers.
 * Client ID / secret should be supplied via environment variables for security.
 */
const PROVIDER_OAUTH_CONFIGS = {
    gmail: {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        useBasicAuthorizationHeader: false,
        redirectUri: 'http://localhost',
        scopes: ['https://mail.google.com/'],
        additionalAuthCodeParams: {
            access_type: 'offline',
            prompt: 'consent'
        }
    },
    outlook: {
        clientId: process.env.OUTLOOK_CLIENT_ID || '',
        clientSecret: process.env.OUTLOOK_CLIENT_SECRET || '',
        authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        useBasicAuthorizationHeader: false,
        redirectUri: 'http://localhost',
        scopes: [
            'offline_access',
            'https://outlook.office.com/IMAP.AccessAsUser.All',
            'https://outlook.office.com/SMTP.Send'
        ],
        additionalAuthCodeParams: {}
    }
};

function validateProviderKey(providerKey) {
    if (!PROVIDER_OAUTH_CONFIGS[providerKey]) {
        throw new Error(`Unsupported OAuth provider: ${providerKey}`);
    }
}

/**
 * Starts the OAuth flow for the given provider and resolves with the token response
 *
 * @param {string} providerKey 'gmail' | 'outlook'
 * @returns {Promise<{accessToken: string, refreshToken?: string, expiresIn?: number, tokenType: string}>}
 */
async function getTokensForProvider(providerKey) {
    validateProviderKey(providerKey);
    const cfg = PROVIDER_OAUTH_CONFIGS[providerKey];

    if (!cfg.clientId || !cfg.clientSecret) {
        throw new Error(`Missing OAuth credentials (clientId/clientSecret) for provider: ${providerKey}`);
    }

    const oauthConfig = {
        clientId: cfg.clientId,
        clientSecret: cfg.clientSecret,
        authorizationUrl: cfg.authorizationUrl,
        tokenUrl: cfg.tokenUrl,
        useBasicAuthorizationHeader: cfg.useBasicAuthorizationHeader,
        redirectUri: cfg.redirectUri
    };

    // electron-oauth2 expects scopes as space-separated string
    const options = {
        scope: cfg.scopes.join(' '),
        accessType: 'offline',
        ...cfg.additionalAuthCodeParams
    };

    const oauth = oauth2(oauthConfig, windowParams);

    // This opens the BrowserWindow and waits for the user to complete the flow
    const tokenResponse = await oauth.getAccessToken(options);

    // electron-oauth2 returns an object:
    // { access_token, refresh_token, expires_in, token_type }

    return {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresIn: tokenResponse.expires_in,
        tokenType: tokenResponse.token_type
    };
}

module.exports = {
    getTokensForProvider
};