// I provide admin analytics and user management
// Only accessible by adriandsouza2504@gmail.com

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAdminUsers, getAdminUsage, getAdminLogins } from '../services/api';
import './AdminPortal.css';

function AdminPortal() {
    const [users, setUsers] = useState([]);
    const [usage, setUsage] = useState(null);
    const [logins, setLogins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('users');
    const navigate = useNavigate();
    const { user } = useAuth();
    
    useEffect(() => {
        // I verify admin access
        if (user?.attributes?.email !== 'adriandsouza2504@gmail.com') {
            navigate('/');
            return;
        }
        
        loadData();
    }, [user, navigate]);
    
    async function loadData() {
        try {
            setLoading(true);
            setError(null);
            
            const [usersData, usageData, loginsData] = await Promise.all([
                getAdminUsers(),
                getAdminUsage(),
                getAdminLogins()
            ]);
            
            setUsers(usersData.users || []);
            setUsage(usageData);
            setLogins(loginsData.logins || []);
        } catch (err) {
            setError(err.message);
            console.error('Failed to load admin data:', err);
        } finally {
            setLoading(false);
        }
    }
    
    if (loading) {
        return (
            <div className="admin-portal loading">
                <div className="spinner"></div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="admin-portal">
                <div className="error-message">{error}</div>
            </div>
        );
    }
    
    return (
        <div className="admin-portal">
            <div className="admin-header">
                <h1>Admin Portal</h1>
                <p className="subtitle">System analytics and user management</p>
            </div>
            
            <div className="admin-tabs">
                <button 
                    className={activeTab === 'users' ? 'active' : ''}
                    onClick={() => setActiveTab('users')}
                >
                    Users
                </button>
                <button 
                    className={activeTab === 'usage' ? 'active' : ''}
                    onClick={() => setActiveTab('usage')}
                >
                    Usage
                </button>
                <button 
                    className={activeTab === 'logins' ? 'active' : ''}
                    onClick={() => setActiveTab('logins')}
                >
                    Logins
                </button>
            </div>
            
            {activeTab === 'users' && (
                <div className="admin-section">
                    <h2>User Statistics</h2>
                    <div className="stats-grid">
                        <div className="stat-box">
                            <div className="stat-value">{users.length}</div>
                            <div className="stat-label">Total Users</div>
                        </div>
                        <div className="stat-box">
                            <div className="stat-value">
                                {users.reduce((sum, u) => sum + u.projectCount, 0)}
                            </div>
                            <div className="stat-label">Total Projects</div>
                        </div>
                        <div className="stat-box">
                            <div className="stat-value">
                                {users.reduce((sum, u) => sum + u.transcriptionCount, 0)}
                            </div>
                            <div className="stat-label">Total Transcriptions</div>
                        </div>
                    </div>
                    
                    <div className="users-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Email</th>
                                    <th>Projects</th>
                                    <th>Tasks</th>
                                    <th>Transcriptions</th>
                                    <th>Last Active</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.userId}>
                                        <td>{user.email}</td>
                                        <td>{user.projectCount}</td>
                                        <td>{user.taskCount}</td>
                                        <td>{user.transcriptionCount}</td>
                                        <td>{new Date(user.lastActive).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {activeTab === 'usage' && usage && (
                <div className="admin-section">
                    <h2>Usage Statistics</h2>
                    <div className="stats-grid">
                        <div className="stat-box">
                            <div className="stat-value">{usage.transcriptions}</div>
                            <div className="stat-label">Total Transcriptions</div>
                        </div>
                        <div className="stat-box">
                            <div className="stat-value">{usage.projectCreations}</div>
                            <div className="stat-label">Projects Created</div>
                        </div>
                        <div className="stat-box">
                            <div className="stat-value">{usage.taskCreations}</div>
                            <div className="stat-label">Tasks Created</div>
                        </div>
                    </div>
                    
                    <h3>Usage by Date</h3>
                    <div className="usage-chart">
                        {Object.entries(usage.byDate || {}).map(([date, stats]) => (
                            <div key={date} className="usage-row">
                                <div className="usage-date">{date}</div>
                                <div className="usage-bars">
                                    <div className="usage-bar">
                                        <span>Transcriptions: {stats.transcriptions}</span>
                                        <div 
                                            className="bar" 
                                            style={{ width: `${stats.transcriptions * 10}%` }}
                                        ></div>
                                    </div>
                                    <div className="usage-bar">
                                        <span>Projects: {stats.projects}</span>
                                        <div 
                                            className="bar projects" 
                                            style={{ width: `${stats.projects * 20}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {activeTab === 'logins' && (
                <div className="admin-section">
                    <h2>Recent Logins</h2>
                    <div className="logins-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Email</th>
                                    <th>Timestamp</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logins.slice(0, 50).map(login => (
                                    <tr key={login.loginId}>
                                        <td>{login.email}</td>
                                        <td>{new Date(login.timestamp).toLocaleString()}</td>
                                        <td>{login.date}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminPortal;
