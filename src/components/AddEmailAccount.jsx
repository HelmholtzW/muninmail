import React, { useState, useEffect } from 'react';
import './AddEmailAccount.css';

function AddEmailAccount({ onAccountAdded }) {
    const [isOpen, setIsOpen] = useState(false);
    const [providers, setProviders] = useState([]);
    const [selectedProvider, setSelectedProvider] = useState('gmail');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        displayName: '',
        imapHost: '',
        imapPort: 993,
        smtpHost: '',
        smtpPort: 587,
        imapTls: true,
        smtpSecure: false
    });

    useEffect(() => {
        loadProviders();
    }, []);

    const loadProviders = async () => {
        try {
            const providerConfigs = await window.electronAPI.email.getProviderConfigs();
            setProviders(providerConfigs);
        } catch (error) {
            console.error('Failed to load providers:', error);
        }
    };

    const handleProviderChange = async (providerKey) => {
        setSelectedProvider(providerKey);

        try {
            const providerConfig = await window.electronAPI.email.getProviderConfig(providerKey);
            if (providerConfig) {
                setFormData(prev => ({
                    ...prev,
                    imapHost: providerConfig.imapHost || '',
                    imapPort: providerConfig.imapPort || 993,
                    smtpHost: providerConfig.smtpHost || '',
                    smtpPort: providerConfig.smtpPort || 587,
                    imapTls: providerConfig.imapTls !== false,
                    smtpSecure: providerConfig.smtpSecure || false
                }));
            }
        } catch (error) {
            console.error('Failed to load provider config:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            const accountData = {
                ...formData,
                displayName: formData.displayName || formData.email,
                providerType: 'imap-smtp'
            };

            const result = await window.electronAPI.email.addAccount(accountData);

            if (result.success) {
                setSuccess('Account added successfully!');
                setFormData({
                    email: '',
                    password: '',
                    displayName: '',
                    imapHost: '',
                    imapPort: 993,
                    smtpHost: '',
                    smtpPort: 587,
                    imapTls: true,
                    smtpSecure: false
                });
                setTimeout(() => {
                    setIsOpen(false);
                    setSuccess('');
                    if (onAccountAdded) {
                        onAccountAdded();
                    }
                }, 2000);
            } else {
                setError(result.error || 'Failed to add account');
            }
        } catch (error) {
            console.error('Error adding account:', error);
            setError('Failed to add account. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const selectedProviderConfig = providers.find(p => p.key === selectedProvider);

    return (
        <>
            <button
                className="add-account-btn"
                onClick={() => setIsOpen(true)}
            >
                + Add Email Account
            </button>

            {isOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Add Email Account</h2>
                            <button
                                className="close-btn"
                                onClick={() => setIsOpen(false)}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="account-form">
                            <div className="form-group">
                                <label htmlFor="provider">Email Provider</label>
                                <select
                                    id="provider"
                                    value={selectedProvider}
                                    onChange={(e) => handleProviderChange(e.target.value)}
                                    className="form-input"
                                >
                                    {providers.map(provider => (
                                        <option key={provider.key} value={provider.key}>
                                            {provider.name}
                                        </option>
                                    ))}
                                </select>
                                {selectedProviderConfig?.note && (
                                    <div className="provider-note">
                                        <strong>Note:</strong> {selectedProviderConfig.note}
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="email">Email Address</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="password">Password</label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="displayName">Display Name (optional)</label>
                                <input
                                    type="text"
                                    id="displayName"
                                    name="displayName"
                                    value={formData.displayName}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    placeholder="Your Name"
                                />
                            </div>

                            {selectedProvider === 'custom' && (
                                <>
                                    <div className="form-group">
                                        <label htmlFor="imapHost">IMAP Host</label>
                                        <input
                                            type="text"
                                            id="imapHost"
                                            name="imapHost"
                                            value={formData.imapHost}
                                            onChange={handleInputChange}
                                            className="form-input"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="imapPort">IMAP Port</label>
                                        <input
                                            type="number"
                                            id="imapPort"
                                            name="imapPort"
                                            value={formData.imapPort}
                                            onChange={handleInputChange}
                                            className="form-input"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="smtpHost">SMTP Host</label>
                                        <input
                                            type="text"
                                            id="smtpHost"
                                            name="smtpHost"
                                            value={formData.smtpHost}
                                            onChange={handleInputChange}
                                            className="form-input"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="smtpPort">SMTP Port</label>
                                        <input
                                            type="number"
                                            id="smtpPort"
                                            name="smtpPort"
                                            value={formData.smtpPort}
                                            onChange={handleInputChange}
                                            className="form-input"
                                            required
                                        />
                                    </div>
                                </>
                            )}

                            {error && <div className="error-message">{error}</div>}
                            {success && <div className="success-message">{success}</div>}

                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Adding...' : 'Add Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

export default AddEmailAccount; 