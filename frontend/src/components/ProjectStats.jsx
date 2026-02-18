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
                <div className="stat-value">🤖 {stats.aiTasks}</div>
                <div className="stat-label">AI Tasks</div>
            </div>
            
            <div className="stat-card highlight-human">
                <div className="stat-value">👤 {stats.humanTasks}</div>
                <div className="stat-label">Human Tasks</div>
            </div>
        </div>
    );
}

export default ProjectStats;
