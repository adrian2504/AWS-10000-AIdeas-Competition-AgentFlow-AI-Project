// I manage authentication state across the entire application
// I handle login, logout, and session management

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Amplify, Auth } from 'aws-amplify';
import { awsConfig } from '../aws-config';

// I configure Amplify with the Cognito settings
Amplify.configure(awsConfig);

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    
    useEffect(() => {
        checkAuth();
    }, []);
    
    async function checkAuth() {
        try {
            const currentUser = await Auth.currentAuthenticatedUser();
            setUser(currentUser);
            setIsAuthenticated(true);
        } catch (error) {
            setUser(null);
            setIsAuthenticated(false);
        } finally {
            setLoading(false);
        }
    }
    
    async function signIn(email, password) {
        try {
            const user = await Auth.signIn(email, password);
            setUser(user);
            setIsAuthenticated(true);
            return { success: true };
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error: error.message };
        }
    }
    
    async function signUp(email, password, name) {
        try {
            console.log('Attempting sign up with:', { email, name });
            const result = await Auth.signUp({
                username: email,
                password,
                attributes: {
                    email,
                    name
                }
            });
            console.log('Sign up successful:', result);
            return { success: true };
        } catch (error) {
            console.error('Sign up error:', error);
            return { 
                success: false, 
                error: error.message || 'Failed to sign up. Please try again.'
            };
        }
    }
    
    async function signOut() {
        try {
            await Auth.signOut();
            setUser(null);
            setIsAuthenticated(false);
        } catch (error) {
            console.error('Sign out error:', error);
        }
    }
    
    async function confirmSignUp(email, code) {
        try {
            await Auth.confirmSignUp(email, code);
            return { success: true };
        } catch (error) {
            console.error('Confirm sign up error:', error);
            return { success: false, error: error.message };
        }
    }
    
    const value = {
        user,
        isAuthenticated,
        loading,
        signIn,
        signUp,
        signOut,
        confirmSignUp
    };
    
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
