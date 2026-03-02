// I render the Kanban board with columns for each task status
// I make it easy to see what's happening across the entire project

import React from 'react';
import TaskCard from './TaskCard';
import './KanbanBoard.css';

function KanbanBoard({ board, onTaskClick, onStatusChange }) {
    const columns = [
        { key: 'QUEUED', title: 'Queued', icon: 'queue' },
        { key: 'IN_PROGRESS', title: 'In Progress', icon: 'progress' },
        { key: 'REVIEW', title: 'Review', icon: 'review' },
        { key: 'DONE', title: 'Done', icon: 'done' }
    ];
    
    const getColumnIcon = (iconType) => {
        const icons = {
            queue: (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h6a1 1 0 100-2H7zm0 4a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
                </svg>
            ),
            progress: (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                </svg>
            ),
            review: (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                </svg>
            ),
            done: (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
            )
        };
        return icons[iconType];
    };
    
    if (!board) {
        return <div className="kanban-board loading">Loading board...</div>;
    }
    
    return (
        <div className="kanban-board">
            {columns.map(column => (
                <div key={column.key} className="kanban-column">
                    <div className="column-header">
                        <span className="column-icon">{getColumnIcon(column.icon)}</span>
                        <h3>{column.title}</h3>
                        <span className="task-count">
                            {board[column.key]?.length || 0}
                        </span>
                    </div>
                    
                    <div className="column-content">
                        {board[column.key]?.length === 0 ? (
                            <div className="empty-column">
                                No tasks
                            </div>
                        ) : (
                            board[column.key]?.map(task => (
                                <TaskCard
                                    key={task.taskId}
                                    task={task}
                                    onClick={() => onTaskClick(task)}
                                    onStatusChange={onStatusChange}
                                />
                            ))
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default KanbanBoard;
