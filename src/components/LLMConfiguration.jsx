import React, { useState, useEffect } from 'react';
import './LLMConfiguration.css';

const LLMConfiguration = ({ onConfigAdded }) => {
    const [showForm, setShowForm] = useState(false);
    const [providers, setProviders] = useState([]);
    const [configs, setConfigs] = useState([]);
    const [selectedProvider, setSelectedProvider] = useState('');
    const [formData, setFormData] = useState({
        provider: '',
        modelName: '',
        apiKey: '',
        baseUrl: '',
        isActive: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editingConfig, setEditingConfig] = useState(null);

    useEffect(() => {
        loadProviders();
        loadConfigs();
    }, []);

    const loadProviders = async () => {
        try {
            const providers = await window.electronAPI.llm.getProviders();
            setProviders(providers);
        } catch (error) {
            console.error('Error loading providers:', error);
        }
    };

    const loadConfigs = async () => {
        try {
            const configs = await window.electronAPI.llm.getAllConfigs();
            setConfigs(configs);
        } catch (error) {
            console.error('Error loading configs:', error);
        }
    };

    const handleProviderChange = (providerKey) => {
        const provider = providers.find(p => p.key === providerKey);
        setSelectedProvider(provider || null);
        setFormData({
            ...formData,
            provider: providerKey,
            modelName: provider?.defaultModel || '',
            baseUrl: provider?.defaultBaseUrl || '',
            apiKey: provider?.requiresApiKey ? '' : 'not-required'
        });
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            let result;
            if (editingConfig) {
                result = await window.electronAPI.llm.updateConfig(editingConfig.id, formData);
            } else {
                result = await window.electronAPI.llm.addConfig(formData);
            }

            if (result.success) {
                setSuccess(editingConfig ? 'Configuration updated successfully!' : 'Configuration added successfully!');
                setShowForm(false);
                setEditingConfig(null);
                resetForm();
                await loadConfigs();
                if (onConfigAdded) onConfigAdded();
            } else {
                setError(result.error || 'Failed to save configuration');
            }
        } catch (error) {
            setError('Error saving configuration: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            provider: '',
            modelName: '',
            apiKey: '',
            baseUrl: '',
            isActive: false
        });
        setSelectedProvider('');
        setEditingConfig(null);
    };

    const handleEdit = (config) => {
        setEditingConfig(config);
        setFormData({
            provider: config.provider,
            modelName: config.model_name,
            apiKey: '', // Don't populate API key for security
            baseUrl: config.base_url || '',
            isActive: config.is_active
        });
        const provider = providers.find(p => p.key === config.provider);
        setSelectedProvider(provider || null);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this configuration?')) {
            try {
                const result = await window.electronAPI.llm.deleteConfig(id);
                if (result.success) {
                    setSuccess('Configuration deleted successfully!');
                    await loadConfigs();
                } else {
                    setError(result.error || 'Failed to delete configuration');
                }
            } catch (error) {
                setError('Error deleting configuration: ' + error.message);
            }
        }
    };

    const handleSetActive = async (id) => {
        try {
            const result = await window.electronAPI.llm.setActiveConfig(id);
            if (result.success) {
                setSuccess('Active configuration updated!');
                await loadConfigs();
            } else {
                setError(result.error || 'Failed to set active configuration');
            }
        } catch (error) {
            setError('Error setting active configuration: ' + error.message);
        }
    };

    const handleTest = async (id) => {
        try {
            const result = await window.electronAPI.llm.testConnection(id);
            if (result.success) {
                setSuccess('Configuration is valid!');
            } else {
                setError(result.error || 'Configuration test failed');
            }
        } catch (error) {
            setError('Error testing configuration: ' + error.message);
        }
    };

    return (
        <div className="llm-configuration">
            <div className="llm-configuration-header">
                <h3>LLM Configuration</h3>
                <button
                    className="add-config-btn"
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? 'Cancel' : 'Add Configuration'}
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            {showForm && (
                <form onSubmit={handleSubmit} className="llm-config-form">
                    <h4>{editingConfig ? 'Edit Configuration' : 'Add New Configuration'}</h4>
                    
                    <div className="form-group">
                        <label htmlFor="provider">Provider:</label>
                        <select
                            id="provider"
                            name="provider"
                            value={formData.provider}
                            onChange={(e) => handleProviderChange(e.target.value)}
                            required
                        >
                            <option value="">Select a provider...</option>
                            {providers.map(provider => (
                                <option key={provider.key} value={provider.key}>
                                    {provider.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedProvider && (
                        <>
                            <div className="provider-info">
                                <p>{selectedProvider.description}</p>
                            </div>

                            <div className="form-group">
                                <label htmlFor="modelName">{selectedProvider.modelLabel}:</label>
                                <input
                                    type="text"
                                    id="modelName"
                                    name="modelName"
                                    value={formData.modelName}
                                    onChange={handleInputChange}
                                    placeholder={selectedProvider.modelPlaceholder}
                                    required
                                />
                            </div>

                            {selectedProvider.requiresApiKey && (
                                <div className="form-group">
                                    <label htmlFor="apiKey">{selectedProvider.apiKeyLabel}:</label>
                                    <input
                                        type="password"
                                        id="apiKey"
                                        name="apiKey"
                                        value={formData.apiKey}
                                        onChange={handleInputChange}
                                        placeholder={selectedProvider.apiKeyPlaceholder}
                                        required
                                    />
                                </div>
                            )}

                            {selectedProvider.supportsCustomBaseUrl && (
                                <div className="form-group">
                                    <label htmlFor="baseUrl">{selectedProvider.baseUrlLabel || 'Base URL'}:</label>
                                    <input
                                        type="url"
                                        id="baseUrl"
                                        name="baseUrl"
                                        value={formData.baseUrl}
                                        onChange={handleInputChange}
                                        placeholder={selectedProvider.baseUrlPlaceholder}
                                    />
                                </div>
                            )}

                            <div className="form-group">
                                <label>
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        checked={formData.isActive}
                                        onChange={handleInputChange}
                                    />
                                    Set as active configuration
                                </label>
                            </div>
                        </>
                    )}

                    <div className="form-actions">
                        <button type="submit" disabled={loading || !selectedProvider}>
                            {loading ? 'Saving...' : (editingConfig ? 'Update' : 'Add')} Configuration
                        </button>
                        <button type="button" onClick={() => {
                            setShowForm(false);
                            resetForm();
                        }}>
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            <div className="llm-configs-list">
                <h4>Existing Configurations</h4>
                {configs.length === 0 ? (
                    <p>No configurations found. Add your first LLM configuration above.</p>
                ) : (
                    <div className="configs-grid">
                        {configs.map(config => (
                            <div key={config.id} className={`config-card ${config.is_active ? 'active' : ''}`}>
                                <div className="config-header">
                                    <h5>{config.provider}</h5>
                                    {config.is_active && <span className="active-badge">Active</span>}
                                </div>
                                <div className="config-details">
                                    <p><strong>Model:</strong> {config.model_name}</p>
                                    <p><strong>API Key:</strong> {config.hasApiKey ? 'Configured' : 'Not set'}</p>
                                    {config.base_url && <p><strong>Base URL:</strong> {config.base_url}</p>}
                                </div>
                                <div className="config-actions">
                                    <button onClick={() => handleEdit(config)}>Edit</button>
                                    <button onClick={() => handleTest(config.id)}>Test</button>
                                    {!config.is_active && (
                                        <button onClick={() => handleSetActive(config.id)}>Set Active</button>
                                    )}
                                    <button 
                                        onClick={() => handleDelete(config.id)}
                                        className="delete-btn"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LLMConfiguration;