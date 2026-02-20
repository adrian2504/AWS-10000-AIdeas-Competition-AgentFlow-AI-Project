// I display the footer with credits and technology stack
// I show who built this amazing project

import './Footer.css';

function Footer() {
    return (
        <footer className="app-footer">
            <div className="footer-content">
                <div className="footer-text">
                    Designed and Developed by{' '}
                    <a 
                        href="https://www.linkedin.com/in/adrian-dsouza-b84a7a1b0/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="highlight linkedin-link"
                    >
                        Adrian Dsouza
                    </a>
                </div>
                <div className="footer-tech">
                    <span className="tech-label">Built with</span>
                    <div className="tech-stack">
                        <a 
                            href="https://kiro.ai" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="tech-badge kiro"
                        >
                            <span className="tech-icon">🤖</span>
                            Kiro AI
                        </a>
                        <span className="separator">+</span>
                        <a 
                            href="https://aws.amazon.com" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="tech-badge aws"
                        >
                            <span className="tech-icon">☁️</span>
                            AWS
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
