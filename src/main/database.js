const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

class EmailDatabase {
    constructor() {
        this.db = null;
    }

    initialize() {
        try {
            // Create database in user data directory
            const dbPath = path.join(app.getPath('userData'), 'local.db');
            console.log('Database path:', dbPath);

            this.db = new Database(dbPath);

            // Enable WAL mode for better performance
            this.db.pragma('journal_mode = WAL');

            this.createTables();
            console.log('Database initialized successfully');

            return true;
        } catch (error) {
            console.error('Failed to initialize database:', error);
            return false;
        }
    }

    createTables() {
        // Create emails table
        const createEmailsTable = `
      CREATE TABLE IF NOT EXISTS emails (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message_id TEXT UNIQUE NOT NULL,
        subject TEXT,
        sender_email TEXT NOT NULL,
        sender_name TEXT,
        recipient_email TEXT,
        recipient_name TEXT,
        cc TEXT,
        bcc TEXT,
        body_text TEXT,
        body_html TEXT,
        date_received DATETIME NOT NULL,
        date_sent DATETIME,
        is_read BOOLEAN DEFAULT 0,
        is_flagged BOOLEAN DEFAULT 0,
        folder TEXT DEFAULT 'INBOX',
        
        -- AI-generated metadata (will be used in Phase 2)
        classification TEXT,
        todos TEXT, -- JSON array of extracted todos
        needs_response BOOLEAN,
        ai_processed BOOLEAN DEFAULT 0,
        
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

        // Create attachments table
        const createAttachmentsTable = `
      CREATE TABLE IF NOT EXISTS attachments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email_id INTEGER NOT NULL,
        filename TEXT NOT NULL,
        content_type TEXT,
        size INTEGER,
        blob_data BLOB,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (email_id) REFERENCES emails (id) ON DELETE CASCADE
      )
    `;

        // Create LLM configurations table
        const createLLMConfigsTable = `
      CREATE TABLE IF NOT EXISTS llm_configs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        provider TEXT NOT NULL,
        model_name TEXT NOT NULL,
        api_key TEXT NOT NULL,
        base_url TEXT,
        is_active BOOLEAN DEFAULT 0,
        config_data TEXT, -- JSON string for additional configuration
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

        // Create indexes for better performance
        const createIndexes = [
            'CREATE INDEX IF NOT EXISTS idx_emails_message_id ON emails (message_id)',
            'CREATE INDEX IF NOT EXISTS idx_emails_sender ON emails (sender_email)',
            'CREATE INDEX IF NOT EXISTS idx_emails_date ON emails (date_received)',
            'CREATE INDEX IF NOT EXISTS idx_emails_folder ON emails (folder)',
            'CREATE INDEX IF NOT EXISTS idx_attachments_email_id ON attachments (email_id)',
            'CREATE INDEX IF NOT EXISTS idx_llm_configs_provider ON llm_configs (provider)',
            'CREATE INDEX IF NOT EXISTS idx_llm_configs_active ON llm_configs (is_active)'
        ];

        this.db.exec(createEmailsTable);
        this.db.exec(createAttachmentsTable);
        this.db.exec(createLLMConfigsTable);

        createIndexes.forEach(indexSql => {
            this.db.exec(indexSql);
        });

        console.log('Database tables created successfully');
    }

    // Basic email operations
    insertEmail(emailData) {
        const stmt = this.db.prepare(`
      INSERT INTO emails (
        message_id, subject, sender_email, sender_name, 
        recipient_email, recipient_name, cc, bcc,
        body_text, body_html, date_received, date_sent, folder
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

        try {
            const result = stmt.run(
                emailData.messageId,
                emailData.subject,
                emailData.senderEmail,
                emailData.senderName,
                emailData.recipientEmail,
                emailData.recipientName,
                emailData.cc,
                emailData.bcc,
                emailData.bodyText,
                emailData.bodyHtml,
                emailData.dateReceived,
                emailData.dateSent,
                emailData.folder || 'INBOX'
            );

            return result.lastInsertRowid;
        } catch (error) {
            console.error('Error inserting email:', error);
            return null;
        }
    }

    getAllEmails() {
        try {
            const stmt = this.db.prepare(`
      SELECT * FROM emails 
      ORDER BY date_received DESC
    `);
            return stmt.all();
        } catch (error) {
            console.error('Error fetching emails:', error);
            return [];
        }
    }

    getEmailById(id) {
        try {
            const stmt = this.db.prepare('SELECT * FROM emails WHERE id = ?');
            return stmt.get(id);
        } catch (error) {
            console.error('Error fetching email by id:', error);
            return null;
        }
    }

    insertAttachment(attachmentData) {
        const stmt = this.db.prepare(`
      INSERT INTO attachments (email_id, filename, content_type, size, blob_data)
      VALUES (?, ?, ?, ?, ?)
    `);

        try {
            const result = stmt.run(
                attachmentData.emailId,
                attachmentData.filename,
                attachmentData.contentType,
                attachmentData.size,
                attachmentData.blobData
            );

            return result.lastInsertRowid;
        } catch (error) {
            console.error('Error inserting attachment:', error);
            return null;
        }
    }

    getAttachmentsByEmailId(emailId) {
        try {
            const stmt = this.db.prepare('SELECT * FROM attachments WHERE email_id = ?');
            return stmt.all(emailId);
        } catch (error) {
            console.error('Error fetching attachments:', error);
            return [];
        }
    }

    // LLM Configuration operations
    insertLLMConfig(configData) {
        const stmt = this.db.prepare(`
      INSERT INTO llm_configs (provider, model_name, api_key, base_url, is_active, config_data)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

        try {
            const result = stmt.run(
                configData.provider,
                configData.modelName,
                configData.apiKey,
                configData.baseUrl || null,
                configData.isActive || 0,
                configData.configData ? JSON.stringify(configData.configData) : null
            );

            return result.lastInsertRowid;
        } catch (error) {
            console.error('Error inserting LLM config:', error);
            return null;
        }
    }

    getAllLLMConfigs() {
        try {
            const stmt = this.db.prepare(`
        SELECT * FROM llm_configs 
        ORDER BY created_at DESC
      `);
            return stmt.all().map(config => ({
                ...config,
                configData: config.config_data ? JSON.parse(config.config_data) : null
            }));
        } catch (error) {
            console.error('Error fetching LLM configs:', error);
            return [];
        }
    }

    getLLMConfigById(id) {
        try {
            const stmt = this.db.prepare('SELECT * FROM llm_configs WHERE id = ?');
            const config = stmt.get(id);
            if (config) {
                return {
                    ...config,
                    configData: config.config_data ? JSON.parse(config.config_data) : null
                };
            }
            return null;
        } catch (error) {
            console.error('Error fetching LLM config by id:', error);
            return null;
        }
    }

    getActiveLLMConfig() {
        try {
            const stmt = this.db.prepare('SELECT * FROM llm_configs WHERE is_active = 1 LIMIT 1');
            const config = stmt.get();
            if (config) {
                return {
                    ...config,
                    configData: config.config_data ? JSON.parse(config.config_data) : null
                };
            }
            return null;
        } catch (error) {
            console.error('Error fetching active LLM config:', error);
            return null;
        }
    }

    updateLLMConfig(id, configData) {
        const stmt = this.db.prepare(`
      UPDATE llm_configs 
      SET provider = ?, model_name = ?, api_key = ?, base_url = ?, is_active = ?, config_data = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

        try {
            const result = stmt.run(
                configData.provider,
                configData.modelName,
                configData.apiKey,
                configData.baseUrl || null,
                configData.isActive || 0,
                configData.configData ? JSON.stringify(configData.configData) : null,
                id
            );

            return result.changes > 0;
        } catch (error) {
            console.error('Error updating LLM config:', error);
            return false;
        }
    }

    setActiveLLMConfig(id) {
        const transaction = this.db.transaction(() => {
            // First, deactivate all configs
            const deactivateStmt = this.db.prepare('UPDATE llm_configs SET is_active = 0');
            deactivateStmt.run();

            // Then activate the specified config
            const activateStmt = this.db.prepare('UPDATE llm_configs SET is_active = 1 WHERE id = ?');
            return activateStmt.run(id);
        });

        try {
            const result = transaction();
            return result.changes > 0;
        } catch (error) {
            console.error('Error setting active LLM config:', error);
            return false;
        }
    }

    deleteLLMConfig(id) {
        const stmt = this.db.prepare('DELETE FROM llm_configs WHERE id = ?');

        try {
            const result = stmt.run(id);
            return result.changes > 0;
        } catch (error) {
            console.error('Error deleting LLM config:', error);
            return false;
        }
    }

    close() {
        if (this.db) {
            this.db.close();
            console.log('Database connection closed');
        }
    }
}

module.exports = EmailDatabase; 