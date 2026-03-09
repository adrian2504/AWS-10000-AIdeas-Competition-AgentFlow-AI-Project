// I handle real-time collaboration features
// I show active users, comments, and activity feed

import React, { useState, useEffect } from 'react';
import { 
    updatePresence, 
    getPresence, 
    addComment, 
    getComments, 
    trackActivity, 
    getActivity 
} from '../services/api';
import './CollaborationPanel.css';

function CollaborationPanel({ projectId, currentUser }) {
    const [activeUsers, setActiveUsers] = useState([]);
    const [comments, setComments] = useState([]);
    const [activities, setActivities] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('users');
    
    useEffect(() => {
        if (projectId) {
            loadCollaborationData();
            
            // Update presence every 30 seconds
            const presenceInterval = setInterval(() => {
                updateUserPresence('online', 'kanban');
            }, 30000);
            
            // Refresh data every 10 seconds
            const dataInterval = setInterval(loadCollaborationData, 10000);
            
            // Initial presence update
            updateUserPresence('online', 'kanban');
            
            return () => {
                clearInterval(presenceInterval);
                clearInterval(dataInterval);
                updateUserPresence('offline', 'kanban');
            };
        }
    }, [projectId]);
    
    async function loadCollaborationData() {
        try {
            const [presenceData, commentsData, activityData] = await Promise.all([
                getPresence(projectId),
                getComments(projectId),
                getActivity(projectId)
            ]);
            
            setActiveUsers(presenceData.activeUsers || []);
            setComments(commentsData.comments || []);
            setActivities(activityData.activities || []);
        } catch (error) {
            console.error('Failed to load collaboration data:', error);
        }
    }
    
    async function updateUserPresence(status, view) {
        try {
            await updatePresence(projectId, status, view);
        } catch (error) {
            console.error('Failed to update presence:', error);
        }
    }
    
    async function handleAddComment() {
        if (!newComment.trim()) return;
        
        try {
            setLoading(true);
            await addComment(projectId, null, newComment, []);
            setNewComment('');
            await loadCollaborationData();
        } catch (error) {
            console.error('Failed to add comment:', error);
        } finally {
            setLoading(false);
        }
    }
    
    function getStatusColor(status) {
        switch (status) {
            case 'online': return '#037f0c';
            case 'away': return '#f89406';
            default: return '#687078';
        }
    }
    
    function formatTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffMinutes = Math.floor((now - time) / (1000 * 60));
        
        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
        return `${Math.floor(diffMinutes / 1440)}d ago`;
    }
    
    return (
        <div className="collaboration-panel">
            <div className="collaboration-header">
                <h3>Collaboration</h3>
                <div className="collaboration-tabs">
                    <button 
                        className={activeTab === 'users' ? 'active' : ''}
                        onClick={() => setActiveTab('users')}
                    >
                        Users ({activeUsers.length})
                    </button>
                    <button 
                        className={activeTab === 'comments' ? 'active' : ''}
                        onClick={() => setActiveTab('comments')}
                    >
                        Comments
                    </button>
                    <button 
                        className={activeTab === 'activity' ? 'active' : ''}
                        onClick={() => setActiveTab('activity')}
                    >
                        Activity
                    </button>
                </div>
            </div>
            
            <div className="collaboration-content">
                {activeTab === 'users' && (
                    <div className="users-tab">
                        <div className="users-list">
                            {activeUsers.map(user => (
                                <div key={user.userId} className="user-item">
                                    <div className="user-avatar">
                                        <div 
                                            className="status-indicator"
                                            style={{ backgroundColor: getStatusColor(user.status) }}
                                        ></div>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <div className="user-info">
                                        <div className="user-email">{user.userEmail}</div>
                                        <div className="user-status">
                                            {user.status} • {user.currentView} • {formatTimeAgo(user.lastSeen)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            {activeUsers.length === 0 && (
                                <div className="empty-state">
                                    <p>No active users</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                
                {activeTab === 'comments' && (
                    <div className="comments-tab">
                        <div className="add-comment">
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add a comment..."
                                rows={3}
                            />
                            <button 
                                className="btn btn-primary btn-sm"
                                onClick={handleAddComment}
                                disabled={loading || !newComment.trim()}
                            >
                                {loading ? 'Adding...' : 'Comment'}
                            </button>
                        </div>
                        
                        <div className="comments-list">
                            {comments.map(comment => (
                                <div key={comment.commentId} className="comment-item">
                                    <div className="comment-header">
                                        <span className="comment-author">{comment.userEmail}</span>
                                        <span className="comment-time">{formatTimeAgo(comment.timestamp)}</span>
                                    </div>
                                    <div className="comment-content">{comment.comment}</div>
                                </div>
                            ))}
                            
                            {comments.length === 0 && (
                                <div className="empty-state">
                                    <p>No comments yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                
                {activeTab === 'activity' && (
                    <div className="activity-tab">
                        <div className="activity-list">
                            {activities.map(activity => (
                                <div key={activity.activityId} className="activity-item">
                                    <div className="activity-icon">
                                        {getActivityIcon(activity.action)}
                                    </div>
                                    <div className="activity-content">
                                        <div className="activity-description">
                                            <strong>{activity.userEmail}</strong> {getActivityDescription(activity.action, activity.details)}
                                        </div>
                                        <div className="activity-time">{formatTimeAgo(activity.timestamp)}</div>
                                    </div>
                                </div>
                            ))}
                            
                            {activities.length === 0 && (
                                <div className="empty-state">
                                    <p>No recent activity</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function getActivityIcon(action) {
    switch (action) {
        case 'task_created':
            return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>;
        case 'task_completed':
            return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.51 0 2.93.37 4.18 1.03"/></svg>;
        case 'task_updated':
            return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="m18.5 2.5 a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
        default:
            return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
    }
}

function getActivityDescription(action, details) {
    switch (action) {
        case 'task_created':
            return `created a new task: ${details?.taskTitle || 'Untitled'}`;
        case 'task_completed':
            return `completed task: ${details?.taskTitle || 'Untitled'}`;
        case 'task_updated':
            return `updated task: ${details?.taskTitle || 'Untitled'}`;
        case 'project_updated':
            return 'updated the project';
        case 'comment_added':
            return 'added a comment';
        default:
            return `performed action: ${action}`;
    }
}

export default CollaborationPanel;