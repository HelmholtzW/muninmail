import React, { useState, useEffect } from 'react';
import './EmailList.css';

function EmailList({ refreshTrigger }) {
    const [accounts, setAccounts] = useState([]);
    const [selectedAccount, setSelectedAccount] = useState('');
    const [emails, setEmails] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        loadAccounts();
    }, [refreshTrigger]);

    useEffect(() => {
        if (selectedAccount) {
            loadEmails();
        }
    }, [selectedAccount]);

    const loadAccounts = async () => {
        try {
            const accountList = await window.electronAPI.email.getAccounts();
            setAccounts(accountList);

            // Auto-select first account if available
            if (accountList.length > 0 && !selectedAccount) {
                setSelectedAccount(accountList[0].id);
            }
        } catch (error) {
            console.error('Failed to load accounts:', error);
            setError('Failed to load email accounts');
        }
    };

    const loadEmails = async () => {
        setIsLoading(true);
        setError('');

        try {
            const emailList = await window.electronAPI.db.getAllEmails();
            // Sort by date and take last 10
            const sortedEmails = emailList
                .sort((a, b) => new Date(b.date_received) - new Date(a.date_received))
                .slice(0, 10);
            setEmails(sortedEmails);
        } catch (error) {
            console.error('Failed to load emails:', error);
            setError('Failed to load emails');
        } finally {
            setIsLoading(false);
        }
    };

    const syncEmails = async () => {
        if (!selectedAccount) return;

        setIsSyncing(true);
        setError('');

        try {
            const result = await window.electronAPI.email.syncEmails(selectedAccount, {
                folder: 'INBOX',
                limit: 10
            });

            if (result.success) {
                await loadEmails(); // Refresh the email list
                console.log(`Synced ${result.count} emails`);
            } else {
                setError(result.error || 'Failed to sync emails');
            }
        } catch (error) {
            console.error('Failed to sync emails:', error);
            setError('Failed to sync emails');
        } finally {
            setIsSyncing(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            return 'Today';
        } else if (diffDays === 2) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays - 1} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    const truncateText = (text, maxLength = 100) => {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    if (accounts.length === 0) {
        return (
            <div className="email-list-container">
                <div className="empty-state">
                    <h3>No Email Accounts</h3>
                    <p>Add an email account to start viewing your emails.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="email-list-container">
            <div className="email-list-header">
                <div className="account-selector">
                    <label htmlFor="account-select">Email Account:</label>
                    <select
                        id="account-select"
                        value={selectedAccount}
                        onChange={(e) => setSelectedAccount(e.target.value)}
                        className="account-select"
                    >
                        {accounts.map(account => (
                            <option key={account.id} value={account.id}>
                                {account.displayName || account.email}
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={syncEmails}
                    disabled={!selectedAccount || isSyncing}
                    className="sync-btn"
                >
                    {isSyncing ? 'Syncing...' : 'Sync Emails'}
                </button>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {isLoading ? (
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading emails...</p>
                </div>
            ) : (
                <div className="email-list">
                    {emails.length === 0 ? (
                        <div className="empty-state">
                            <h3>No Emails</h3>
                            <p>Click "Sync Emails" to fetch your latest emails.</p>
                        </div>
                    ) : (
                        <>
                            <div className="email-list-title">
                                <h3>Latest 10 Emails</h3>
                            </div>
                            <div className="email-items">
                                {emails.map(email => (
                                    <div key={email.id} className="email-item">
                                        <div className="email-header">
                                            <div className="email-sender">
                                                <strong>{email.sender_name || email.sender_email}</strong>
                                                <span className="email-address">{email.sender_email}</span>
                                            </div>
                                            <div className="email-date">
                                                {formatDate(email.date_received)}
                                            </div>
                                        </div>
                                        <div className="email-subject">
                                            {email.subject || '(No Subject)'}
                                        </div>
                                        <div className="email-preview">
                                            {truncateText(email.body_text)}
                                        </div>
                                        <div className="email-meta">
                                            <span className="email-folder">{email.folder}</span>
                                            {email.is_read ? null : <span className="unread-badge">New</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default EmailList; 