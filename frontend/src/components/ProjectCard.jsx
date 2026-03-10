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
            </div>
            
            <div className="project-card-body">
                <p className="project-brief">
                    {project.briefContent?.substring(0, 150)}
                    {project.briefContent?.length > 150 ? '...' : ''}
                </p>
                
                {project.taskCount > 0 && (
                    <div className="project-stats-mini">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        <span>{project.taskCount} tasks</span>
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
