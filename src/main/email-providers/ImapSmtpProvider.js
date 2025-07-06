const BaseEmailProvider = require('./BaseEmailProvider');
const Imap = require('imap');
const nodemailer = require('nodemailer');
const { simpleParser } = require('mailparser');

class ImapSmtpProvider extends BaseEmailProvider {
    constructor(config) {
        super(config);
        this.imapClient = null;
        this.smtpTransporter = null;
        this.setupImap();
        this.setupSmtp();
    }

    buildXoauth2Token(user, accessToken) {
        // Generates a base64 encoded XOAUTH2 token string
        const authString = [
            `user=${user}`,
            `auth=Bearer ${accessToken}`,
            '',
            ''
        ].join('\x01');
        return Buffer.from(authString).toString('base64');
    }

    setupImap() {
        const imapConfig = {
            user: this.config.email,
            host: this.config.imapHost,
            port: this.config.imapPort || 993,
            tls: this.config.imapTls !== false,
            keepalive: true,
            tlsOptions: {
                rejectUnauthorized: false
            }
        };

        if (this.config.password) {
            imapConfig.password = this.config.password;
        } else if (this.config.accessToken) {
            imapConfig.xoauth2 = this.buildXoauth2Token(this.config.email, this.config.accessToken);
        }

        this.imapClient = new Imap(imapConfig);

        this.imapClient.on('error', (err) => {
            console.error('IMAP error:', err);
        });

        this.imapClient.on('end', () => {
            console.log('IMAP connection ended');
            this.connected = false;
        });
    }

    setupSmtp() {
        let transportConfig = {
            host: this.config.smtpHost,
            port: this.config.smtpPort || 587,
            secure: this.config.smtpSecure || false
        };

        if (this.config.password) {
            transportConfig.auth = {
                user: this.config.email,
                pass: this.config.password
            };
        } else if (this.config.accessToken) {
            transportConfig.auth = {
                type: 'OAuth2',
                user: this.config.email,
                accessToken: this.config.accessToken,
                refreshToken: this.config.refreshToken,
                clientId: this.config.clientId,
                clientSecret: this.config.clientSecret
            };
        }

        this.smtpTransporter = nodemailer.createTransport(transportConfig);
    }

    async connect() {
        return new Promise((resolve, reject) => {
            this.imapClient.once('ready', () => {
                console.log('IMAP connection ready');
                this.connected = true;
                resolve();
            });

            this.imapClient.once('error', (err) => {
                console.error('IMAP connection error:', err);
                reject(err);
            });

            this.imapClient.connect();
        });
    }

    async disconnect() {
        return new Promise((resolve) => {
            if (this.imapClient && this.connected) {
                this.imapClient.end();
                this.connected = false;
            }
            resolve();
        });
    }

    async testConnection() {
        try {
            await this.connect();

            // Test SMTP connection
            await this.smtpTransporter.verify();

            console.log('Email connection test successful');
            return { success: true };
        } catch (error) {
            console.error('Email connection test failed:', error);
            return { success: false, error: error.message };
        } finally {
            await this.disconnect();
        }
    }

    async fetchEmails(options = {}) {
        if (!this.connected) {
            await this.connect();
        }

        return new Promise((resolve, reject) => {
            const folder = options.folder || 'INBOX';
            const limit = options.limit || 50;

            this.imapClient.openBox(folder, true, (err, box) => {
                if (err) {
                    reject(err);
                    return;
                }

                const totalMessages = box.messages.total;
                const fetchStart = Math.max(1, totalMessages - limit + 1);
                const fetchEnd = totalMessages;

                if (totalMessages === 0) {
                    resolve([]);
                    return;
                }

                const fetch = this.imapClient.fetch(`${fetchStart}:${fetchEnd}`, {
                    bodies: '',
                    struct: true,
                    envelope: true
                });

                const emails = [];

                fetch.on('message', (msg, seqno) => {
                    let buffer = '';
                    let attributes = null;

                    msg.on('body', (stream, info) => {
                        stream.on('data', (chunk) => {
                            buffer += chunk.toString('utf8');
                        });
                    });

                    msg.on('attributes', (attrs) => {
                        attributes = attrs;
                    });

                    msg.on('end', async () => {
                        try {
                            const parsed = await simpleParser(buffer);

                            // Convert date objects to ISO strings
                            const dateReceived = attributes.envelope.date ?
                                (attributes.envelope.date instanceof Date ?
                                    attributes.envelope.date.toISOString() :
                                    new Date(attributes.envelope.date).toISOString()) :
                                new Date().toISOString();

                            // Convert arrays/objects to strings
                            const ccText = parsed.cc?.text || (parsed.cc ? JSON.stringify(parsed.cc) : '');
                            const bccText = parsed.bcc?.text || (parsed.bcc ? JSON.stringify(parsed.bcc) : '');

                            emails.push({
                                messageId: (attributes.envelope.messageId || '').toString(),
                                subject: (parsed.subject || '').toString(),
                                senderEmail: (parsed.from?.value?.[0]?.address || '').toString(),
                                senderName: (parsed.from?.value?.[0]?.name || '').toString(),
                                recipientEmail: (parsed.to?.value?.[0]?.address || '').toString(),
                                recipientName: (parsed.to?.value?.[0]?.name || '').toString(),
                                cc: ccText.toString(),
                                bcc: bccText.toString(),
                                bodyText: (parsed.text || '').toString(),
                                bodyHtml: (parsed.html || '').toString(),
                                dateReceived: dateReceived,
                                dateSent: dateReceived, // Using same date for both
                                folder: folder.toString()
                            });
                        } catch (parseError) {
                            console.error('Error parsing email:', parseError);
                        }
                    });
                });

                fetch.on('error', (err) => {
                    reject(err);
                });

                fetch.on('end', () => {
                    resolve(emails);
                });
            });
        });
    }

    async sendEmail(emailData) {
        const mailOptions = {
            from: this.config.email,
            to: emailData.to,
            cc: emailData.cc || '',
            bcc: emailData.bcc || '',
            subject: emailData.subject,
            text: emailData.text,
            html: emailData.html,
            attachments: emailData.attachments || []
        };

        try {
            const result = await this.smtpTransporter.sendMail(mailOptions);
            console.log('Email sent:', result.messageId);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('Error sending email:', error);
            return { success: false, error: error.message };
        }
    }

    async getFolders() {
        if (!this.connected) {
            await this.connect();
        }

        return new Promise((resolve, reject) => {
            this.imapClient.getBoxes((err, boxes) => {
                if (err) {
                    reject(err);
                    return;
                }

                const folders = this.parseBoxes(boxes);
                resolve(folders);
            });
        });
    }

    parseBoxes(boxes, prefix = '') {
        const folders = [];

        for (const [name, box] of Object.entries(boxes)) {
            const fullName = prefix ? `${prefix}${box.delimiter}${name}` : name;

            folders.push({
                name: fullName,
                displayName: name,
                attributes: box.attribs,
                delimiter: box.delimiter,
                hasChildren: box.children && Object.keys(box.children).length > 0
            });

            if (box.children) {
                folders.push(...this.parseBoxes(box.children, fullName));
            }
        }

        return folders;
    }
}

module.exports = ImapSmtpProvider; 