// I display the live Kanban board for a project
// I show real-time task progress and allow users to interact with tasks

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getTasks, updateTask, reviewTask } from '../services/api';
import KanbanBoard from '../components/KanbanBoard';
import TaskModal from '../components/TaskModal';
import ProjectStats from '../components/ProjectStats';
import './ProjectView.css';

function ProjectView() {
    const { projectId } = useParams();
    const [kanbanBoard, setKanbanBoard] = useState(null);
    const [stats, setStats] = useState(null);
    const [selectedTask, setSelectedTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        loadTasks();
        
        // I poll for updates every 5 seconds to keep the board fresh
        const interval = setInterval(loadTasks, 5000);
        return () => clearInterval(interval);
    }, [projectId]);
    
    async function loadTasks() {
        try {
            const data = await getTasks(projectId);
            setKanbanBoard(data.kanbanBoard);
            setStats(data.stats);
            setLoading(false);
        } catch (err) {
            setError('Failed to load tasks');
            console.error(err);
            setLoading(false);
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
                <ProjectStats stats={stats} />
            </div>
            
            <KanbanBoard 
                board={kanbanBoard}
                onTaskClick={setSelectedTask}
                onTaskUpdate={handleTaskUpdate}
            />
            
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
