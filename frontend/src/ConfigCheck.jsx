// I help debug configuration issues
import React from 'react';

function ConfigCheck() {
    const config = {
        apiUrl: process.env.REACT_APP_API_URL,
        userPoolId: process.env.REACT_APP_USER_POOL_ID,
        clientId: process.env.REACT_APP_USER_POOL_CLIENT_ID,
        region: process.env.REACT_APP_AWS_REGION || process.env.REACT_APP_REGION
    };
    
    // Check if all values exist and are not empty strings or 'undefined' string
    const allConfigured = Object.values(config).every(val => {
        return val && val !== 'undefined' && val.trim() !== '';
    });
    
    if (allConfigured) {
        return null; // Don't show anything if all is good
    }
    
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: '#ff6b6b',
            color: 'white',
            padding: '10px',
            textAlign: 'center',
            zIndex: 9999
        }}>
            ⚠️ Configuration Error: Missing environment variables. Check your .env file.
            <details style={{ marginTop: '10px', textAlign: 'left', maxWidth: '600px', margin: '10px auto' }}>
                <summary style={{ cursor: 'pointer' }}>Show Details</summary>
                <pre style={{ fontSize: '12px', marginTop: '10px' }}>
                    {JSON.stringify(config, null, 2)}
                </pre>
            </details>
        </div>
    );
}

export default ConfigCheck;
