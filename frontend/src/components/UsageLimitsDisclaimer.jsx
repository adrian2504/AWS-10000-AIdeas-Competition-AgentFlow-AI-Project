// I display usage limits and disclaimer to users
// I help set expectations about system constraints

import './UsageLimitsDisclaimer.css';

function UsageLimitsDisclaimer({ onClose }) {
    return (
        <div className="disclaimer-overlay">
            <div className="disclaimer-modal">
                <div className="disclaimer-header">
                    <h2>⚠️ Usage Limits & Disclaimer</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                
                <div className="disclaimer-content">
                    <div className="disclaimer-section">
                        <h3>📊 System Limits</h3>
                        <ul>
                            <li>
                                <strong>Maximum Projects:</strong> 1 project per user
                                <p className="limit-note">To create a new project, please delete your existing project first.</p>
                            </li>
                            <li>
                                <strong>Purpose:</strong> This limit prevents system overload and ensures fair usage for all users.
                            </li>
                        </ul>
                    </div>
                    
                    <div className="disclaimer-section">
                        <h3>🎯 Demo Purpose</h3>
                        <p>
                            This application is built as a demonstration project for the AWS 10,000 AI Ideas Competition. 
                            It showcases AI-powered project management capabilities using AWS services and Kiro AI.
                        </p>
                    </div>
                    
                    <div className="disclaimer-section important">
                        <h3>⚡ Important Notes</h3>
                        <ul>
                            <li>AI-generated tasks and content are suggestions and should be reviewed</li>
                            <li>System performance may vary based on AWS service availability</li>
                            <li>Data is stored securely in AWS DynamoDB and S3</li>
                            <li>For questions or issues, contact the developer via LinkedIn</li>
                        </ul>
                    </div>
                </div>
                
                <div className="disclaimer-footer">
                    <button className="btn-accept" onClick={onClose}>
                        I Understand
                    </button>
                </div>
            </div>
        </div>
    );
}

export default UsageLimitsDisclaimer;
