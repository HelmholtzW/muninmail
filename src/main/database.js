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

        // Create indexes for better performance
        const createIndexes = [
            'CREATE INDEX IF NOT EXISTS idx_emails_message_id ON emails (message_id)',
            'CREATE INDEX IF NOT EXISTS idx_emails_sender ON emails (sender_email)',
            'CREATE INDEX IF NOT EXISTS idx_emails_date ON emails (date_received)',
            'CREATE INDEX IF NOT EXISTS idx_emails_folder ON emails (folder)',
            'CREATE INDEX IF NOT EXISTS idx_attachments_email_id ON attachments (email_id)'
        ];

        this.db.exec(createEmailsTable);
        this.db.exec(createAttachmentsTable);

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

    close() {
        if (this.db) {
            this.db.close();
            console.log('Database connection closed');
        }
    }
}

module.exports = EmailDatabase; 