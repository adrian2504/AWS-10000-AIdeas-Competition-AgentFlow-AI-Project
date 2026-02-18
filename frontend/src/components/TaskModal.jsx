// I display detailed task information in a modal
// I allow users to review and interact with tasks

import React, { useState } from 'react';
import './TaskModal.css';

function TaskModal({ task, onClose, onUpdate, onReview }) {
    const [feedback, setFeedback] = useState('');
    const [output, setOutput] = useState(task.output || '');
    const [notes, setNotes] = useState('');
    
    function handleApprove() {
        onReview(task.taskId, true, '');
    }
    
    function handleReject() {
        if (!feedback.trim()) {
            alert('Please provide feedback for rejection');
            return;
        }
        onReview(task.taskId, false, feedback);
    }
    
    function handleComplete() {
        if (!output.trim()) {
            alert('Please provide task output');
            return;
        }
        onUpdate(task.taskId, {
            status: 'REVIEW',
            output,
            notes
        });
    }
    
    const isHumanTask = task.assignmentType === 'HUMAN';
    const isInProgress = task.status === 'IN_PROGRESS';
    const isReview = task.status === 'REVIEW';
    
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{task.title}</h2>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>
                
                <div className="modal-body">
                    <div className="task-meta">
                        <span className={`badge badge-${task.assignmentType.toLowerCase()}`}>
                            {task.assignmentType === 'AI' ? '🤖 AI' : '👤 Human'}
                        </span>
                        <span className="badge">{task.category}</span>
                        <span className="badge">{task.estimatedComplexity}</span>
                        <span className={`status-badge status-${task.status.toLowerCase()}`}>
                            {task.status}
                        </span>
                    </div>
                    
                    <div className="section">
                        <h3>Description</h3>
                        <p>{task.description}</p>
                    </div>
                    
                    <div className="section">
                        <h3>Acceptance Criteria</h3>
                        <p>{task.acceptanceCriteria}</p>
                    </div>
                    
                    {task.routingReason && (
                        <div className="section">
                            <h3>Assignment Reason</h3>
                            <p className="routing-reason">{task.routingReason}</p>
                        </div>
                    )}
                    
                    {task.output && (
                        <div className="section">
                            <h3>Output</h3>
                            <div className="task-output">
                                {task.output}
                            </div>
                        </div>
                    )}
                    
                    {isHumanTask && task.status === 'QUEUED' && (
                        <div className="section">
                            <h3>Complete This Task</h3>
                            <textarea
                                value={output}
                                onChange={(e) => setOutput(e.target.value)}
                                placeholder="Enter your work output here..."
                                rows={6}
                            />
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Optional notes..."
                                rows={3}
                            />
                            <button 
                                className="btn btn-primary"
                                onClick={handleComplete}
                            >
                                Submit for Review
                            </button>
                        </div>
                    )}
                    
                    {isReview && (
                        <div className="section review-section">
                            <h3>Review Task</h3>
                            <textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="Feedback for rejection (optional for approval)"
                                rows={4}
                            />
                            <div className="review-actions">
                                <button 
                                    className="btn btn-danger"
                                    onClick={handleReject}
                                >
                                    Request Changes
                                </button>
                                <button 
                                    className="btn btn-success"
                                    onClick={handleApprove}
                                >
                                    Approve
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default TaskModal;
