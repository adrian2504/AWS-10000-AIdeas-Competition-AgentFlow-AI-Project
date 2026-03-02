// I display project statistics in a clean, visual format
// I help users understand project progress at a glance

import React from 'react';
import './ProjectStats.css';

function ProjectStats({ stats }) {
    if (!stats) return null;
    
    const completionRate = stats.total > 0 
        ? Math.round((stats.completed / stats.total) * 100)
        : 0;
    
    return (
        <div className="project-stats">
            <div className="stat-card">
                <div className="stat-value">{stats.total}</div>
                <div className="stat-label">Total Tasks</div>
            </div>
            
            <div className="stat-card">
                <div className="stat-value">{completionRate}%</div>
                <div className="stat-label">Complete</div>
            </div>
            
            <div className="stat-card">
                <div className="stat-value">{stats.inProgress}</div>
                <div className="stat-label">In Progress</div>
            </div>
            
            <div className="stat-card">
                <div className="stat-value">{stats.review}</div>
                <div className="stat-label">In Review</div>
            </div>
            
            <div className="stat-card highlight-ai">
                <div className="stat-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>
                <div className="stat-value">{stats.aiTasks}</div>
                <div className="stat-label">AI Tasks</div>
            </div>
            
            <div className="stat-card highlight-human">
                <div className="stat-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </div>
                <div className="stat-value">{stats.humanTasks}</div>
                <div className="stat-label">Human Tasks</div>
            </div>
        </div>
    );
}

export default ProjectStats;
