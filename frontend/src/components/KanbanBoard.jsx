// I render the Kanban board with columns for each task status
// I make it easy to see what's happening across the entire project

import React from 'react';
import TaskCard from './TaskCard';
import './KanbanBoard.css';

function KanbanBoard({ board, onTaskClick, onTaskUpdate }) {
    const columns = [
        { key: 'QUEUED', title: 'Queued', icon: '📋' },
        { key: 'IN_PROGRESS', title: 'In Progress', icon: '⚙️' },
        { key: 'REVIEW', title: 'Review', icon: '👀' },
        { key: 'DONE', title: 'Done', icon: '✅' },
        { key: 'FAILED', title: 'Failed', icon: '❌' }
    ];
    
    if (!board) {
        return <div className="kanban-board loading">Loading board...</div>;
    }
    
    return (
        <div className="kanban-board">
            {columns.map(column => (
                <div key={column.key} className="kanban-column">
                    <div className="column-header">
                        <span className="column-icon">{column.icon}</span>
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
