// Common email provider configurations
const PROVIDER_CONFIGS = {
    gmail: {
        name: 'Gmail',
        providerType: 'imap-smtp',
        imapHost: 'imap.gmail.com',
        imapPort: 993,
        imapTls: true,
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpSecure: false,
        note: 'For Gmail, you need to use App Passwords instead of your regular password. Go to Google Account Settings > Security > App Passwords'
    },
    outlook: {
        name: 'Outlook/Hotmail',
        providerType: 'imap-smtp',
        imapHost: 'outlook.office365.com',
        imapPort: 993,
        imapTls: true,
        smtpHost: 'smtp-mail.outlook.com',
        smtpPort: 587,
        smtpSecure: false,
        note: 'For Outlook, you may need to enable IMAP in your account settings'
    },
    outlookGraph: {
        name: 'Microsoft Outlook',
        providerType: 'outlook-graph',
        clientId: process.env.AZURE_CLIENT_ID || 'YOUR_AZURE_CLIENT_ID_HERE', // Set via environment variable
        scopes: ['https://graph.microsoft.com/Mail.Read', 'https://graph.microsoft.com/Mail.Send', 'offline_access'],
        note: 'Secure OAuth 2.0 authentication with Microsoft. Just click login and authorize access to your emails - no additional setup required!'
    },
    yahoo: {
        name: 'Yahoo Mail',
        providerType: 'imap-smtp',
        imapHost: 'imap.mail.yahoo.com',
        imapPort: 993,
        imapTls: true,
        smtpHost: 'smtp.mail.yahoo.com',
        smtpPort: 587,
        smtpSecure: false,
        note: 'For Yahoo, you need to use App Passwords instead of your regular password'
    },
    icloud: {
        name: 'iCloud Mail',
        providerType: 'imap-smtp',
        imapHost: 'imap.mail.me.com',
        imapPort: 993,
        imapTls: true,
        smtpHost: 'smtp.mail.me.com',
        smtpPort: 587,
        smtpSecure: false,
        note: 'For iCloud, you need to use App Passwords instead of your regular password'
    },
    custom: {
        name: 'Custom IMAP/SMTP',
        providerType: 'imap-smtp',
        imapHost: '',
        imapPort: 993,
        imapTls: true,
        smtpHost: '',
        smtpPort: 587,
        smtpSecure: false,
        note: 'Enter your custom IMAP and SMTP server settings'
    }
};

class ProviderConfigHelper {
    static getProviderConfig(providerKey) {
        return PROVIDER_CONFIGS[providerKey] || null;
    }

    static getAllProviders() {
        return Object.keys(PROVIDER_CONFIGS).map(key => ({
            key,
            ...PROVIDER_CONFIGS[key]
        }));
    }

    static createAccountConfig(providerKey, email, password, displayName = null) {
        const providerConfig = this.getProviderConfig(providerKey);
        if (!providerConfig) {
            throw new Error(`Unknown provider: ${providerKey}`);
        }

        return {
            email,
            password,
            displayName: displayName || email,
            ...providerConfig
        };
    }

    static validateAccountConfig(config) {
        const requiredFields = ['email', 'password', 'imapHost', 'smtpHost'];
        const missingFields = requiredFields.filter(field => !config[field]);

        if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(config.email)) {
            throw new Error('Invalid email address format');
        }

        return true;
    }
}

module.exports = {
    PROVIDER_CONFIGS,
    ProviderConfigHelper
}; 