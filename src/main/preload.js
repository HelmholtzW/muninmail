const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // App info
    getVersion: () => ipcRenderer.invoke('app-version'),

    // Database operations
    db: {
        getAllEmails: () => ipcRenderer.invoke('db-get-all-emails'),
        getEmailById: (id) => ipcRenderer.invoke('db-get-email-by-id', id),
        insertEmail: (emailData) => ipcRenderer.invoke('db-insert-email', emailData),
        getAttachments: (emailId) => ipcRenderer.invoke('db-get-attachments', emailId),
        insertAttachment: (attachmentData) => ipcRenderer.invoke('db-insert-attachment', attachmentData)
    },

    // Email Account Management
    email: {
        addAccount: (accountData) => ipcRenderer.invoke('email-add-account', accountData),
        removeAccount: (accountId) => ipcRenderer.invoke('email-remove-account', accountId),
        getAccounts: () => ipcRenderer.invoke('email-get-accounts'),
        testConnection: (accountId) => ipcRenderer.invoke('email-test-connection', accountId),

        // Email Operations
        syncEmails: (accountId, options) => ipcRenderer.invoke('email-sync', accountId, options),
        sendEmail: (accountId, emailData) => ipcRenderer.invoke('email-send', accountId, emailData),
        getFolders: (accountId) => ipcRenderer.invoke('email-get-folders', accountId),

        // Provider Configurations
        getProviderConfigs: () => ipcRenderer.invoke('email-get-provider-configs'),
        getProviderConfig: (providerKey) => ipcRenderer.invoke('email-get-provider-config', providerKey)
    },

    // LLM Configuration Management
    llm: {
        addConfig: (configData) => ipcRenderer.invoke('llm-add-config', configData),
        updateConfig: (id, configData) => ipcRenderer.invoke('llm-update-config', id, configData),
        deleteConfig: (id) => ipcRenderer.invoke('llm-delete-config', id),
        setActiveConfig: (id) => ipcRenderer.invoke('llm-set-active-config', id),
        getAllConfigs: () => ipcRenderer.invoke('llm-get-all-configs'),
        getConfigById: (id) => ipcRenderer.invoke('llm-get-config-by-id', id),
        getActiveConfig: () => ipcRenderer.invoke('llm-get-active-config'),
        testConnection: (id) => ipcRenderer.invoke('llm-test-connection', id),
        getProviders: () => ipcRenderer.invoke('llm-get-providers'),
        getProviderInfo: (providerKey) => ipcRenderer.invoke('llm-get-provider-info', providerKey)
    }
}); 