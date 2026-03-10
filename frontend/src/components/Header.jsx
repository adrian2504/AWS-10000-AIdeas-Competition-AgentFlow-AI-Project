// I provide the main navigation header for the application
// I show user info and navigation options

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

function Header() {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    
    async function handleSignOut() {
        await signOut();
        navigate('/login');
    }
    
    return (
        <header className="app-header">
            <div className="header-content">
                <div className="header-left">
                    <h1 className="logo" onClick={() => navigate('/')}>
                        AgentFlow
                    </h1>
                    <nav className="main-nav">
                        <button onClick={() => navigate('/')}>
                            Projects
                        </button>
                        <button onClick={() => navigate('/new-project')}>
                            New Project
                        </button>
                        <button onClick={() => navigate('/team')}>
                            Team
                        </button>
                    </nav>
                </div>
                
                <div className="header-right">
                    <button onClick={() => navigate('/profile')} className="profile-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                        </svg>
                        Profile
                    </button>
                    <span className="user-email">
                        {user?.attributes?.email || user?.username}
                    </span>
                    <button className="btn btn-secondary" onClick={handleSignOut}>
                        Sign Out
                    </button>
                </div>
            </div>
        </header>
    );
}

export default Header;
