// I handle user authentication - sign in and sign up
// I provide a clean interface for accessing AgentFlow

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

function Login() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [confirmationCode, setConfirmationCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [needsConfirmation, setNeedsConfirmation] = useState(false);
    const [needsPasswordReset, setNeedsPasswordReset] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { signIn, signUp, confirmSignUp, forgotPassword, forgotPasswordSubmit } = useAuth();
    
    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        
        try {
            if (needsPasswordReset) {
                // Submit new password with code
                const result = await forgotPasswordSubmit(email, confirmationCode, newPassword);
                if (result.success) {
                    setSuccess('Password reset successful! You can now sign in.');
                    setNeedsPasswordReset(false);
                    setIsForgotPassword(false);
                    setConfirmationCode('');
                    setNewPassword('');
                } else {
                    setError(result.error);
                }
            } else if (isForgotPassword) {
                // Request password reset code
                const result = await forgotPassword(email);
                if (result.success) {
                    setNeedsPasswordReset(true);
                    setSuccess('Password reset code sent to your email!');
                } else {
                    setError(result.error);
                }
            } else if (needsConfirmation) {
                const result = await confirmSignUp(email, confirmationCode);
                if (result.success) {
                    setNeedsConfirmation(false);
                    setIsSignUp(false);
                    setSuccess('Email confirmed! You can now sign in.');
                } else {
                    setError(result.error);
                }
            } else if (isSignUp) {
                const result = await signUp(email, password, name);
                if (result.success) {
                    setNeedsConfirmation(true);
                } else {
                    setError(result.error);
                }
            } else {
                const result = await signIn(email, password);
                if (!result.success) {
                    setError(result.error);
                }
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }
    
    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-header">
                    <h1>AgentFlow</h1>
                    <p>AI Project Co-Pilot</p>
                </div>
                
                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}
                
                {success && (
                    <div className="success-message">
                        {success}
                    </div>
                )}
                
                {needsPasswordReset ? (
                    <form onSubmit={handleSubmit}>
                        <h2>Reset Password</h2>
                        <p>Enter the code sent to {email}</p>
                        
                        <div className="form-group">
                            <input
                                type="text"
                                value={confirmationCode}
                                onChange={(e) => setConfirmationCode(e.target.value)}
                                placeholder="Confirmation code"
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="New password"
                                required
                                minLength={8}
                            />
                        </div>
                        
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                        
                        <div className="toggle-mode">
                            <button
                                type="button"
                                onClick={() => {
                                    setNeedsPasswordReset(false);
                                    setIsForgotPassword(false);
                                }}
                                className="link-button"
                            >
                                Back to Sign In
                            </button>
                        </div>
                    </form>
                ) : isForgotPassword ? (
                    <form onSubmit={handleSubmit}>
                        <h2>Forgot Password</h2>
                        <p>Enter your email to receive a reset code</p>
                        
                        <div className="form-group">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email"
                                required
                            />
                        </div>
                        
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Sending...' : 'Send Reset Code'}
                        </button>
                        
                        <div className="toggle-mode">
                            <button
                                type="button"
                                onClick={() => setIsForgotPassword(false)}
                                className="link-button"
                            >
                                Back to Sign In
                            </button>
                        </div>
                    </form>
                ) : needsConfirmation ? (
                    <form onSubmit={handleSubmit}>
                        <h2>Confirm Your Email</h2>
                        <p>We sent a confirmation code to {email}</p>
                        
                        <div className="form-group">
                            <input
                                type="text"
                                value={confirmationCode}
                                onChange={(e) => setConfirmationCode(e.target.value)}
                                placeholder="Confirmation code"
                                required
                            />
                        </div>
                        
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Confirming...' : 'Confirm'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <h2>{isSignUp ? 'Create Account' : 'Sign In'}</h2>
                        
                        {isSignUp && (
                            <div className="form-group">
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Full name"
                                    required
                                />
                            </div>
                        )}
                        
                        <div className="form-group">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email"
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                required
                            />
                        </div>
                        
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                        </button>
                        
                        {!isSignUp && (
                            <div className="forgot-password">
                                <button
                                    type="button"
                                    onClick={() => setIsForgotPassword(true)}
                                    className="link-button"
                                >
                                    Forgot password?
                                </button>
                            </div>
                        )}
                        
                        <div className="toggle-mode">
                            {isSignUp ? (
                                <p>
                                    Already have an account?{' '}
                                    <button
                                        type="button"
                                        onClick={() => setIsSignUp(false)}
                                        className="link-button"
                                    >
                                        Sign In
                                    </button>
                                </p>
                            ) : (
                                <p>
                                    Don't have an account?{' '}
                                    <button
                                        type="button"
                                        onClick={() => setIsSignUp(true)}
                                        className="link-button"
                                    >
                                        Sign Up
                                    </button>
                                </p>
                            )}
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

export default Login;
