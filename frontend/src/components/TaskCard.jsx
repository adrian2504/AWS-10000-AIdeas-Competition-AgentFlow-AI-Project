// I display a single task in a compact, readable format
// I show the key information users need at a glance

import React from 'react';
import './TaskCard.css';

function TaskCard({ task, onClick }) {
    const getAssignmentBadge = () => {
        if (task.assignmentType === 'AI') {
            return <span className="badge badge-ai">🤖 AI</span>;
        }
        return <span className="badge badge-human">👤 Human</span>;
    };
    
    const getComplexityColor = () => {
        const colors = {
            LOW: 'green',
            MEDIUM: 'orange',
            HIGH: 'red'
        };
        return colors[task.estimatedComplexity] || 'gray';
    };
    
    return (
        <div className="task-card" onClick={onClick}>
            <div className="task-header">
                <h4 className="task-title">{task.title}</h4>
                {getAssignmentBadge()}
            </div>
            
            <p className="task-description">
                {task.description.length > 100 
                    ? `${task.description.substring(0, 100)}...`
                    : task.description
                }
            </p>
            
            <div className="task-footer">
                <span className="task-category">{task.category}</span>
                <span 
                    className="task-complexity"
                    style={{ color: getComplexityColor() }}
                >
                    {task.estimatedComplexity}
                </span>
            </div>
            
            {task.dependencyCount > 0 && (
                <div className="task-dependencies">
                    🔗 {task.dependencyCount} dependencies
                </div>
            )}
        </div>
    );
}

export default TaskCard;
