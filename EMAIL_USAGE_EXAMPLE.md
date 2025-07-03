# Email System Usage Example

## Overview
The email system provides a secure, extensible way to connect to email accounts using IMAP/SMTP protocols. All credentials are stored securely in the OS keychain.

## Adding an Email Account

### Using Gmail
```javascript
// First, get the provider configuration
const providers = await window.electronAPI.email.getProviderConfigs();
const gmailConfig = providers.find(p => p.key === 'gmail');

// Add account with Gmail configuration
const accountData = {
    email: 'your-email@gmail.com',
    password: 'your-app-password', // Use App Password, not regular password
    displayName: 'My Gmail Account',
    ...gmailConfig
};

const result = await window.electronAPI.email.addAccount(accountData);
if (result.success) {
    console.log('Account added successfully:', result.accountId);
} else {
    console.error('Failed to add account:', result.error);
}
```

### Using Custom IMAP/SMTP
```javascript
const customAccount = {
    email: 'your-email@domain.com',
    password: 'your-password',
    displayName: 'Custom Account',
    providerType: 'imap-smtp',
    imapHost: 'imap.domain.com',
    imapPort: 993,
    imapTls: true,
    smtpHost: 'smtp.domain.com',
    smtpPort: 587,
    smtpSecure: false
};

const result = await window.electronAPI.email.addAccount(customAccount);
```

## Managing Accounts

### Get All Accounts
```javascript
const accounts = await window.electronAPI.email.getAccounts();
console.log('Available accounts:', accounts);
```

### Test Connection
```javascript
const testResult = await window.electronAPI.email.testConnection(accountId);
if (testResult.success) {
    console.log('Connection successful');
} else {
    console.error('Connection failed:', testResult.error);
}
```

### Remove Account
```javascript
const result = await window.electronAPI.email.removeAccount(accountId);
if (result.success) {
    console.log('Account removed successfully');
}
```

## Email Operations

### Sync Emails
```javascript
// Sync latest 50 emails from INBOX
const syncResult = await window.electronAPI.email.syncEmails(accountId, {
    folder: 'INBOX',
    limit: 50
});

if (syncResult.success) {
    console.log(`Synced ${syncResult.count} emails`);
}
```

### Send Email
```javascript
const emailData = {
    to: 'recipient@example.com',
    subject: 'Test Email',
    text: 'This is a test email',
    html: '<h1>This is a test email</h1>',
    cc: 'cc@example.com',
    bcc: 'bcc@example.com'
};

const sendResult = await window.electronAPI.email.sendEmail(accountId, emailData);
if (sendResult.success) {
    console.log('Email sent successfully:', sendResult.messageId);
}
```

### Get Folders
```javascript
const folders = await window.electronAPI.email.getFolders(accountId);
console.log('Available folders:', folders);
```

## Security Features

1. **Secure Storage**: All credentials are stored in the OS keychain (macOS Keychain, Windows Credential Manager, Linux Secret Service)
2. **No Plaintext**: Passwords never touch the filesystem
3. **Connection Testing**: Credentials are validated before being saved
4. **Automatic Cleanup**: Connections are properly closed when the app exits

## Supported Providers

The system comes with pre-configured settings for:
- Gmail (requires App Password)
- Outlook/Hotmail
- Yahoo Mail (requires App Password)
- iCloud Mail (requires App Password)
- Custom IMAP/SMTP servers

## Future Extensibility

The architecture is designed to easily add new providers:
- Gmail API (OAuth2)
- Microsoft Graph API (OAuth2)
- Other proprietary email APIs

The base `EmailProvider` class ensures consistent interfaces across all provider types.

## Error Handling

All operations return standardized responses:
```javascript
{
    success: true/false,
    error: 'Error message if failed',
    // Additional data for successful operations
}
```

## Best Practices

1. Always test connections before saving accounts
2. Use App Passwords for major providers (Gmail, Yahoo, iCloud)
3. Handle errors gracefully in your UI
4. Sync emails periodically, not continuously
5. Clean up unused accounts to maintain security 