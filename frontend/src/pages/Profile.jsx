// I handle user profile management and settings
// I provide options to update profile info and change password

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Auth } from 'aws-amplify';
import './Profile.css';

function Profile() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    
    // Profile form state
    const [profileData, setProfileData] = useState({
        name: '',
        email: ''
    });
    
    // Password change form state
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    
    // Forgot password state
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
    const [resetCode, setResetCode] = useState('');
    const [newPasswordReset, setNewPasswordReset] = useState('');
    const [showResetForm, setShowResetForm] = useState(false);
    
    useEffect(() => {
        if (user) {
            setProfileData({
                name: user.attributes?.name || '',
                email: user.attributes?.email || ''
            });
            setForgotPasswordEmail(user.attributes?.email || '');
        }
    }, [user]);
    
    async function handleProfileUpdate(e) {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');
        
        try {
            await Auth.updateUserAttributes(user, {
                name: profileData.name
            });
            setMessage('Profile updated successfully!');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }
    
    async function handlePasswordChange(e) {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');
        
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError('New passwords do not match');
            setLoading(false);
            return;
        }
        
        if (passwordData.newPassword.length < 8) {
            setError('Password must be at least 8 characters long');
            setLoading(false);
            return;
        }
        
        try {
            await Auth.changePassword(user, passwordData.currentPassword, passwordData.newPassword);
            setMessage('Password changed successfully!');
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }
    
    async function handleForgotPassword(e) {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');
        
        try {
            await Auth.forgotPassword(forgotPasswordEmail);
            setShowResetForm(true);
            setMessage('Reset code sent to your email!');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }
    
    async function handlePasswordReset(e) {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');
        
        try {
            await Auth.forgotPasswordSubmit(forgotPasswordEmail, resetCode, newPasswordReset);
            setMessage('Password reset successfully!');
            setShowResetForm(false);
            setResetCode('');
            setNewPasswordReset('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }
    
    return (
        <div className="profile-page">
            <div className="profile-container">
                <div className="profile-header">
                    <h1>Profile Settings</h1>
                    <p>Manage your account settings and preferences</p>
                </div>
                
                <div className="profile-tabs">
                    <button
                        className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        Profile Info
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'password' ? 'active' : ''}`}
                        onClick={() => setActiveTab('password')}
                    >
                        Change Password
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'reset' ? 'active' : ''}`}
                        onClick={() => setActiveTab('reset')}
                    >
                        Reset Password
                    </button>
                </div>
                
                {message && (
                    <div className="success-message">
                        {message}
                    </div>
                )}
                
                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}
                
                <div className="profile-content">
                    {activeTab === 'profile' && (
                        <form onSubmit={handleProfileUpdate} className="profile-form">
                            <h2>Profile Information</h2>
                            
                            <div className="form-group">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    value={profileData.name}
                                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                                    placeholder="Enter your full name"
                                    required
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    value={profileData.email}
                                    disabled
                                    className="disabled-input"
                                />
                                <small>Email cannot be changed. Contact support if needed.</small>
                            </div>
                            
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Updating...' : 'Update Profile'}
                            </button>
                        </form>
                    )}
                    
                    {activeTab === 'password' && (
                        <form onSubmit={handlePasswordChange} className="profile-form">
                            <h2>Change Password</h2>
                            <p>Enter your current password and choose a new one.</p>
                            
                            <div className="form-group">
                                <label>Current Password</label>
                                <input
                                    type="password"
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                                    placeholder="Enter current password"
                                    required
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>New Password</label>
                                <input
                                    type="password"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                                    placeholder="Enter new password"
                                    required
                                    minLength={8}
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Confirm New Password</label>
                                <input
                                    type="password"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                    placeholder="Confirm new password"
                                    required
                                    minLength={8}
                                />
                            </div>
                            
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Changing...' : 'Change Password'}
                            </button>
                        </form>
                    )}
                    
                    {activeTab === 'reset' && (
                        <div className="profile-form">
                            <h2>Reset Password</h2>
                            <p>Use this if you've forgotten your password or want to reset it via email.</p>
                            
                            {!showResetForm ? (
                                <form onSubmit={handleForgotPassword}>
                                    <div className="form-group">
                                        <label>Email Address</label>
                                        <input
                                            type="email"
                                            value={forgotPasswordEmail}
                                            onChange={(e) => setForgotPasswordEmail(e.target.value)}
                                            placeholder="Enter your email"
                                            required
                                        />
                                    </div>
                                    
                                    <button type="submit" className="btn btn-primary" disabled={loading}>
                                        {loading ? 'Sending...' : 'Send Reset Code'}
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handlePasswordReset}>
                                    <div className="form-group">
                                        <label>Reset Code</label>
                                        <input
                                            type="text"
                                            value={resetCode}
                                            onChange={(e) => setResetCode(e.target.value)}
                                            placeholder="Enter the code from your email"
                                            required
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>New Password</label>
                                        <input
                                            type="password"
                                            value={newPasswordReset}
                                            onChange={(e) => setNewPasswordReset(e.target.value)}
                                            placeholder="Enter new password"
                                            required
                                            minLength={8}
                                        />
                                    </div>
                                    
                                    <div className="form-actions">
                                        <button type="submit" className="btn btn-primary" disabled={loading}>
                                            {loading ? 'Resetting...' : 'Reset Password'}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={() => {
                                                setShowResetForm(false);
                                                setResetCode('');
                                                setNewPasswordReset('');
                                            }}
                                        >
                                            Back
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Profile;