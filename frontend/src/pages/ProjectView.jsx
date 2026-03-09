// I display the live Kanban board for a project
// I show real-time task progress and allow users to interact with tasks

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTasks, updateTask, reviewTask } from '../services/api';
import KanbanBoard from '../components/KanbanBoard';
import SprintView from '../components/SprintView';
import TaskModal from '../components/TaskModal';
import ProjectStats from '../components/ProjectStats';
import CollaborationPanel from '../components/CollaborationPanel';
import ProjectHealth from '../components/ProjectHealth';
import { useAuth } from '../contexts/AuthContext';
import './ProjectView.css';

function ProjectView() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [kanbanBoard, setKanbanBoard] = useState(null);
    const [allTasks, setAllTasks] = useState([]);
    const [stats, setStats] = useState(null);
    const [selectedTask, setSelectedTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeView, setActiveView] = useState('kanban'); // 'kanban' or 'sprint'
    const [showCollaboration, setShowCollaboration] = useState(true);
    const [showHealth, setShowHealth] = useState(true);
    
    useEffect(() => {
        loadTasks();
        
        // I poll for updates every 5 seconds to keep the board fresh
        const interval = setInterval(loadTasks, 5000);
        return () => clearInterval(interval);
    }, [projectId]);
    
    async function loadTasks() {
        try {
            console.log('Loading tasks for project:', projectId);
            const data = await getTasks(projectId);
            console.log('Tasks loaded:', data);
            setKanbanBoard(data.kanbanBoard);
            setAllTasks(data.tasks || []);
            setStats(data.stats);
            setLoading(false);
        } catch (err) {
            console.error('Error loading tasks:', err);
            setError(`Failed to load tasks: ${err.message}`);
            setLoading(false);
        }
    }
    
    async function handleStatusChange(taskId, newStatus) {
        try {
            await updateTask(taskId, { status: newStatus });
            await loadTasks(); // I refresh the board
        } catch (err) {
            console.error('Failed to update task status:', err);
            alert('Failed to update task status');
        }
    }
    
    async function handleTaskUpdate(taskId, updates) {
        try {
            await updateTask(taskId, updates);
            await loadTasks(); // I refresh the board
        } catch (err) {
            console.error('Failed to update task:', err);
        }
    }
    
    async function handleTaskAssign(taskId, memberId) {
        try {
            await updateTask(taskId, { assignedTo: memberId });
            await loadTasks(); // I refresh the board
        } catch (err) {
            console.error('Failed to assign task:', err);
            alert('Failed to assign task');
        }
    }
    
    async function handleTaskReview(taskId, approved, feedback) {
        try {
            await reviewTask(taskId, approved, feedback);
            await loadTasks(); // I refresh the board
            setSelectedTask(null);
        } catch (err) {
            console.error('Failed to review task:', err);
        }
    }
    
    if (loading) {
        return (
            <div className="project-view loading">
                <h1>Project Dashboard</h1>
                <p>Loading board...</p>
                <div className="spinner"></div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="project-view error">
                <div className="error-message">{error}</div>
            </div>
        );
    }
    
    return (
        <div className="project-view">
            <div className="project-header">
                <div className="project-title-section">
                    <h1>Project Dashboard</h1>
                    <div className="project-controls">
                        <div className="view-toggle">
                            <button 
                                className={activeView === 'kanban' ? 'active' : ''}
                                onClick={() => setActiveView('kanban')}
                            >
                                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h6a1 1 0 100-2H7zm0 4a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
                                </svg>
                                Kanban
                            </button>
                            <button 
                                className={activeView === 'sprint' ? 'active' : ''}
                                onClick={() => setActiveView('sprint')}
                            >
                                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                                </svg>
                                Sprint
                            </button>
                        </div>
                        
                        <button 
                            className="btn-planning"
                            onClick={() => navigate(`/project/${projectId}/sprint-planning`)}
                        >
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd"/>
                            </svg>
                            Sprint Planning
                        </button>
                        
                        <div className="panel-toggles">
                            <button 
                                className={`btn-toggle ${showCollaboration ? 'active' : ''}`}
                                onClick={() => setShowCollaboration(!showCollaboration)}
                                title="Toggle Collaboration Panel"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            </button>
                            <button 
                                className={`btn-toggle ${showHealth ? 'active' : ''}`}
                                onClick={() => setShowHealth(!showHealth)}
                                title="Toggle Health Panel"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
                
                <ProjectStats stats={stats} />
            </div>
            
            <div className="project-content">
                <div className="main-content">
                    {activeView === 'kanban' ? (
                        <KanbanBoard 
                            board={kanbanBoard}
                            onTaskClick={setSelectedTask}
                            onStatusChange={handleStatusChange}
                        />
                    ) : (
                        <SprintView 
                            tasks={allTasks}
                            stats={stats}
                            projectName={projectId}
                            onTaskAssign={handleTaskAssign}
                        />
                    )}
                </div>
                
                {(showCollaboration || showHealth) && (
                    <div className="side-panels">
                        {showCollaboration && (
                            <CollaborationPanel 
                                projectId={projectId} 
                                currentUser={user}
                            />
                        )}
                        
                        {showHealth && (
                            <ProjectHealth projectId={projectId} />
                        )}
                    </div>
                )}
            </div>
            
            {selectedTask && (
                <TaskModal
                    task={selectedTask}
                    onClose={() => setSelectedTask(null)}
                    onUpdate={handleTaskUpdate}
                    onReview={handleTaskReview}
                />
            )}
        </div>
    );
}

export default ProjectView;
