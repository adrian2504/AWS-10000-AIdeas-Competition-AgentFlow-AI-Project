// I display AI-powered project health insights and recommendations
// I show risk levels, completion rates, and actionable recommendations

import React, { useState, useEffect } from 'react';
import { getProjectHealth, analyzeProjectHealth } from '../services/api';
import './ProjectHealth.css';

function ProjectHealth({ projectId }) {
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        if (projectId) {
            loadHealth();
        }
    }, [projectId]);
    
    async function loadHealth() {
        try {
            setLoading(true);
            setError(null);
            const healthData = await getProjectHealth(projectId);
            setHealth(healthData);
        } catch (err) {
            if (err.message.includes('No health data found')) {
                setHealth(null);
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    }
    
    async function runAnalysis() {
        try {
            setAnalyzing(true);
            setError(null);
            const analysisResult = await analyzeProjectHealth(projectId);
            setHealth(analysisResult);
        } catch (err) {
            setError(err.message);
        } finally {
            setAnalyzing(false);
        }
    }
    
    function getRiskColor(riskLevel) {
        switch (riskLevel) {
            case 'LOW': return '#037f0c';
            case 'MEDIUM': return '#f89406';
            case 'HIGH': return '#d91515';
            default: return '#687078';
        }
    }
    
    function getScoreColor(score) {
        if (score >= 80) return '#037f0c';
        if (score >= 60) return '#f89406';
        return '#d91515';
    }
    
    if (loading) {
        return (
            <div className="project-health loading">
                <div className="spinner"></div>
            </div>
        );
    }
    
    if (!health) {
        return (
            <div className="project-health">
                <div className="health-header">
                    <div className="health-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                        </svg>
                    </div>
                    <div>
                        <h3>Project Health Analysis</h3>
                        <p>Get AI-powered insights about your project's health and risks</p>
                    </div>
                </div>
                
                <button 
                    className="btn btn-primary"
                    onClick={runAnalysis}
                    disabled={analyzing}
                >
                    {analyzing ? (
                        <>
                            <div className="spinner-sm"></div>
                            Analyzing...
                        </>
                    ) : (
                        'Run Health Analysis'
                    )}
                </button>
                
                {error && (
                    <div className="error-message">{error}</div>
                )}
            </div>
        );
    }
    
    return (
        <div className="project-health">
            <div className="health-header">
                <div className="health-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                </div>
                <div>
                    <h3>Project Health</h3>
                    <p>Last analyzed: {new Date(health.timestamp).toLocaleString()}</p>
                </div>
                <button 
                    className="btn btn-secondary btn-sm"
                    onClick={runAnalysis}
                    disabled={analyzing}
                >
                    {analyzing ? 'Analyzing...' : 'Refresh'}
                </button>
            </div>
            
            <div className="health-metrics">
                <div className="metric-card primary">
                    <div className="metric-value" style={{ color: getScoreColor(health.healthScore) }}>
                        {health.healthScore}
                    </div>
                    <div className="metric-label">Health Score</div>
                </div>
                
                <div className="metric-card">
                    <div className="metric-value" style={{ color: getRiskColor(health.riskLevel) }}>
                        {health.riskLevel}
                    </div>
                    <div className="metric-label">Risk Level</div>
                </div>
                
                <div className="metric-card">
                    <div className="metric-value">
                        {health.metrics?.completionRate || 0}%
                    </div>
                    <div className="metric-label">Completion</div>
                </div>
                
                <div className="metric-card">
                    <div className="metric-value">
                        {health.metrics?.teamUtilization || 0}%
                    </div>
                    <div className="metric-label">Team Utilization</div>
                </div>
            </div>
            
            {health.insights?.summary && (
                <div className="health-summary">
                    <h4>AI Summary</h4>
                    <p>{health.insights.summary}</p>
                </div>
            )}
            
            {health.insights?.risks?.length > 0 && (
                <div className="health-risks">
                    <h4>Identified Risks</h4>
                    <div className="risks-list">
                        {health.insights.risks.map((risk, index) => (
                            <div key={index} className={`risk-item ${risk.severity.toLowerCase()}`}>
                                <div className="risk-header">
                                    <span className="risk-type">{risk.type}</span>
                                    <span className="risk-severity">{risk.severity}</span>
                                </div>
                                <p className="risk-description">{risk.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {health.insights?.recommendations?.length > 0 && (
                <div className="health-recommendations">
                    <h4>AI Recommendations</h4>
                    <ul className="recommendations-list">
                        {health.insights.recommendations.map((rec, index) => (
                            <li key={index}>{rec}</li>
                        ))}
                    </ul>
                </div>
            )}
            
            {health.insights?.strengths?.length > 0 && (
                <div className="health-strengths">
                    <h4>Project Strengths</h4>
                    <ul className="strengths-list">
                        {health.insights.strengths.map((strength, index) => (
                            <li key={index}>{strength}</li>
                        ))}
                    </ul>
                </div>
            )}
            
            {error && (
                <div className="error-message">{error}</div>
            )}
        </div>
    );
}

export default ProjectHealth;