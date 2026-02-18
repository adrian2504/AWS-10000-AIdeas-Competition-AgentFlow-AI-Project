// I display a project card on the dashboard
// I show key project information in a compact format

import React from 'react';
import './ProjectCard.css';

function ProjectCard({ project, onClick }) {
    const getStatusColor = () => {
        const colors = {
            'ANALYZING': 'blue',
            'TASKS_GENERATED': 'purple',
            'IN_PROGRESS': 'orange',
            'COMPLETED': 'green',
            'FAILED': 'red'
        };
        return colors[project.status] || 'gray';
    };
    
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };
    
    return (
        <div className="project-card" onClick={onClick}>
            <div className="project-card-header">
                <h3>{project.projectName}</h3>
                <span 
                    className="status-indicator"
                    style={{ backgroundColor: getStatusColor() }}
                >
                    {project.status.replace('_', ' ')}
                </span>
            </div>
            
            <div className="project-card-body">
                <p className="project-brief">
                    {project.briefContent?.substring(0, 150)}
                    {project.briefContent?.length > 150 ? '...' : ''}
                </p>
                
                {project.taskCount > 0 && (
                    <div className="project-stats-mini">
                        <span>📋 {project.taskCount} tasks</span>
                    </div>
                )}
            </div>
            
            <div className="project-card-footer">
                <span className="project-date">
                    Created {formatDate(project.createdAt)}
                </span>
            </div>
        </div>
    );
}

export default ProjectCard;
