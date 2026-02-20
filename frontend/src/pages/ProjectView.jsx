// I display the live Kanban board for a project
// I show real-time task progress and allow users to interact with tasks

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getTasks, updateTask, reviewTask } from '../services/api';
import KanbanBoard from '../components/KanbanBoard';
import SprintView from '../components/SprintView';
import TaskModal from '../components/TaskModal';
import ProjectStats from '../components/ProjectStats';
import './ProjectView.css';

function ProjectView() {
    const { projectId } = useParams();
    const [kanbanBoard, setKanbanBoard] = useState(null);
    const [allTasks, setAllTasks] = useState([]);
    const [stats, setStats] = useState(null);
    const [selectedTask, setSelectedTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeView, setActiveView] = useState('kanban'); // 'kanban' or 'sprint'
    
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
                <h1>Project Dashboard</h1>
                <div className="view-toggle">
                    <button 
                        className={activeView === 'kanban' ? 'active' : ''}
                        onClick={() => setActiveView('kanban')}
                    >
                        📋 Kanban
                    </button>
                    <button 
                        className={activeView === 'sprint' ? 'active' : ''}
                        onClick={() => setActiveView('sprint')}
                    >
                        📊 Sprint
                    </button>
                </div>
                <ProjectStats stats={stats} />
            </div>
            
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
