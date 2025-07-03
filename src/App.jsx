import React, { useState, useEffect } from 'react';
import './App.css';
import AddEmailAccount from './components/AddEmailAccount';
import EmailList from './components/EmailList';

function App() {
    const [version, setVersion] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        const getVersion = async () => {
            try {
                const appVersion = await window.electronAPI.getVersion();
                setVersion(appVersion);
            } catch (error) {
                console.error('Failed to get app version:', error);
            }
        };

        getVersion();
    }, []);

    const handleAccountAdded = () => {
        // Trigger refresh of EmailList component
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <div className="App">
            <header className="App-header">
                <h1>Munin Email Client</h1>
                <p>AI-Native Email Client</p>
                <p>Version: {version}</p>
            </header>
            <main className="App-main">
                <div className="email-app-container">
                    <div className="email-app-header">
                        <h2>Your Emails</h2>
                        <AddEmailAccount onAccountAdded={handleAccountAdded} />
                    </div>
                    <EmailList refreshTrigger={refreshTrigger} />
                </div>
            </main>
        </div>
    );
}

export default App; 