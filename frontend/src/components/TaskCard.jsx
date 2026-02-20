// I display a single task in a compact, readable format with action buttons
// I show the key information users need and allow manual status changes

import React from 'react';
import './TaskCard.css';

function TaskCard({ task, onClick, onStatusChange }) {
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
    
    const handleStatusChange = (e, newStatus) => {
        e.stopPropagation();
        onStatusChange(task.taskId, newStatus);
    };
    
    const getAvailableActions = () => {
        const actions = [];
        
        if (task.status === 'QUEUED') {
            actions.push(
                <button 
                    key="start"
                    className="task-action-btn start"
                    onClick={(e) => handleStatusChange(e, 'IN_PROGRESS')}
                    title="Start working on this task"
                >
                    ▶️ Start
                </button>
            );
        }
        
        if (task.status === 'IN_PROGRESS') {
            actions.push(
                <button 
                    key="review"
                    className="task-action-btn review"
                    onClick={(e) => handleStatusChange(e, 'REVIEW')}
                    title="Submit for review"
                >
                    👁️ Review
                </button>
            );
        }
        
        if (task.status === 'REVIEW') {
            actions.push(
                <button 
                    key="approve"
                    className="task-action-btn approve"
                    onClick={(e) => handleStatusChange(e, 'DONE')}
                    title="Approve and mark as done"
                >
                    ✅ Approve
                </button>,
                <button 
                    key="reject"
                    className="task-action-btn reject"
                    onClick={(e) => handleStatusChange(e, 'IN_PROGRESS')}
                    title="Send back for rework"
                >
                    ↩️ Rework
                </button>
            );
        }
        
        return actions;
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
            
            {getAvailableActions().length > 0 && (
                <div className="task-actions">
                    {getAvailableActions()}
                </div>
            )}
        </div>
    );
}

export default TaskCard;
