const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const EmailDatabase = require('./database');
const EmailManager = require('./email-manager');
const { ProviderConfigHelper } = require('./email-providers/provider-configs');
const LLMService = require('./llm-service');

let mainWindow;
let database;
let emailManager;
let llmService;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        show: false
    });

    const startUrl = isDev
        ? 'http://localhost:5173'
        : `file://${path.join(__dirname, '../../dist/index.html')}`;

    mainWindow.loadURL(startUrl);

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();

        if (isDev) {
            mainWindow.webContents.openDevTools();
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    // Initialize database
    database = new EmailDatabase();
    const dbInitialized = database.initialize();

    if (!dbInitialized) {
        console.error('Failed to initialize database. App may not function properly.');
    }

    // Initialize email manager
    emailManager = new EmailManager(database);

    // Initialize LLM service
    llmService = new LLMService(database);

    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        // Close database connection before quitting
        if (database) {
            database.close();
        }
        app.quit();
    }
});

app.on('before-quit', async () => {
    // Ensure database is closed when app is quitting
    if (database) {
        database.close();
    }

    // Disconnect all email providers
    if (emailManager) {
        await emailManager.disconnectAll();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// IPC handlers for the application
ipcMain.handle('app-version', () => {
    return app.getVersion();
});

// Database IPC handlers
ipcMain.handle('db-get-all-emails', async () => {
    try {
        return database.getAllEmails();
    } catch (error) {
        console.error('Error fetching emails:', error);
        return [];
    }
});

ipcMain.handle('db-get-email-by-id', async (event, id) => {
    try {
        return database.getEmailById(id);
    } catch (error) {
        console.error('Error fetching email by id:', error);
        return null;
    }
});

ipcMain.handle('db-insert-email', async (event, emailData) => {
    try {
        return database.insertEmail(emailData);
    } catch (error) {
        console.error('Error inserting email:', error);
        return null;
    }
});

ipcMain.handle('db-get-attachments', async (event, emailId) => {
    try {
        return database.getAttachmentsByEmailId(emailId);
    } catch (error) {
        console.error('Error fetching attachments:', error);
        return [];
    }
});

ipcMain.handle('db-insert-attachment', async (event, attachmentData) => {
    try {
        return database.insertAttachment(attachmentData);
    } catch (error) {
        console.error('Error inserting attachment:', error);
        return null;
    }
});

// Email Account Management IPC handlers
ipcMain.handle('email-add-account', async (event, accountData) => {
    try {
        return await emailManager.addAccount(accountData);
    } catch (error) {
        console.error('Error adding email account:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('email-remove-account', async (event, accountId) => {
    try {
        return await emailManager.removeAccount(accountId);
    } catch (error) {
        console.error('Error removing email account:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('email-get-accounts', async () => {
    try {
        return await emailManager.getAccounts();
    } catch (error) {
        console.error('Error getting email accounts:', error);
        return [];
    }
});

ipcMain.handle('email-test-connection', async (event, accountId) => {
    try {
        return await emailManager.testAccountConnection(accountId);
    } catch (error) {
        console.error('Error testing email connection:', error);
        return { success: false, error: error.message };
    }
});

// Email Operations IPC handlers
ipcMain.handle('email-sync', async (event, accountId, options = {}) => {
    try {
        return await emailManager.syncEmails(accountId, options);
    } catch (error) {
        console.error('Error syncing emails:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('email-send', async (event, accountId, emailData) => {
    try {
        return await emailManager.sendEmail(accountId, emailData);
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('email-get-folders', async (event, accountId) => {
    try {
        return await emailManager.getFolders(accountId);
    } catch (error) {
        console.error('Error getting folders:', error);
        return [];
    }
});

// LLM Configuration IPC handlers
ipcMain.handle('llm-add-config', async (event, configData) => {
    try {
        return await llmService.addLLMConfig(configData);
    } catch (error) {
        console.error('Error adding LLM config:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('llm-update-config', async (event, id, configData) => {
    try {
        return await llmService.updateLLMConfig(id, configData);
    } catch (error) {
        console.error('Error updating LLM config:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('llm-delete-config', async (event, id) => {
    try {
        return await llmService.deleteLLMConfig(id);
    } catch (error) {
        console.error('Error deleting LLM config:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('llm-set-active-config', async (event, id) => {
    try {
        return await llmService.setActiveLLMConfig(id);
    } catch (error) {
        console.error('Error setting active LLM config:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('llm-get-all-configs', async () => {
    try {
        return await llmService.getAllLLMConfigs();
    } catch (error) {
        console.error('Error getting all LLM configs:', error);
        return [];
    }
});

ipcMain.handle('llm-get-config-by-id', async (event, id) => {
    try {
        return await llmService.getLLMConfigById(id);
    } catch (error) {
        console.error('Error getting LLM config by ID:', error);
        return null;
    }
});

ipcMain.handle('llm-get-active-config', async () => {
    try {
        return llmService.getActiveLLMConfig();
    } catch (error) {
        console.error('Error getting active LLM config:', error);
        return null;
    }
});

ipcMain.handle('llm-test-connection', async (event, id) => {
    try {
        return await llmService.testLLMConnection(id);
    } catch (error) {
        console.error('Error testing LLM connection:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('llm-get-providers', async () => {
    try {
        return llmService.getAllProviders();
    } catch (error) {
        console.error('Error getting LLM providers:', error);
        return [];
    }
});

ipcMain.handle('llm-get-provider-info', async (event, providerKey) => {
    try {
        return llmService.getProviderInfo(providerKey);
    } catch (error) {
        console.error('Error getting provider info:', error);
        return null;
    }
});

// Provider Configuration IPC handlers
ipcMain.handle('email-get-provider-configs', async () => {
    try {
        return ProviderConfigHelper.getAllProviders();
    } catch (error) {
        console.error('Error getting provider configs:', error);
        return [];
    }
});

ipcMain.handle('email-get-provider-config', async (event, providerKey) => {
    try {
        return ProviderConfigHelper.getProviderConfig(providerKey);
    } catch (error) {
        console.error('Error getting provider config:', error);
        return null;
    }
}); 