// I'm the main application component that handles routing and layout
// I manage the overall user experience and navigation

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProjectView from './pages/ProjectView';
import NewProject from './pages/NewProject';
import TeamManagement from './pages/TeamManagement';
import SprintPlanning from './pages/SprintPlanning';
import Header from './components/Header';
import Footer from './components/Footer';
import ConfigCheck from './ConfigCheck';
import './App.css';

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="app">
                    <ConfigCheck />
                    <AppContent />
                </div>
            </Router>
        </AuthProvider>
    );
}

function AppContent() {
    const { isAuthenticated, loading } = useAuth();
    
    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
                <p>Loading AgentFlow...</p>
            </div>
        );
    }
    
    return (
        <>
            {isAuthenticated && <Header />}
            <main className="main-content">
                <Routes>
                    <Route 
                        path="/login" 
                        element={isAuthenticated ? <Navigate to="/" /> : <Login />} 
                    />
                    <Route 
                        path="/" 
                        element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} 
                    />
                    <Route 
                        path="/new-project" 
                        element={isAuthenticated ? <NewProject /> : <Navigate to="/login" />} 
                    />
                    <Route 
                        path="/project/:projectId" 
                        element={isAuthenticated ? <ProjectView /> : <Navigate to="/login" />} 
                    />
                    <Route 
                        path="/team" 
                        element={isAuthenticated ? <TeamManagement /> : <Navigate to="/login" />} 
                    />
                    <Route 
                        path="/project/:projectId/sprint-planning" 
                        element={isAuthenticated ? <SprintPlanning /> : <Navigate to="/login" />} 
                    />
                </Routes>
            </main>
            <Footer />
        </>
    );
}

export default App;
