// I display all projects and provide quick access to create new ones
// I'm the home screen where users see their project portfolio

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProjects } from '../services/api';
import ProjectCard from '../components/ProjectCard';
import './Dashboard.css';

function Dashboard() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    
    useEffect(() => {
        loadProjects();
    }, []);
    
    async function loadProjects() {
        try {
            setLoading(true);
            const data = await getProjects();
            setProjects(data.projects);
        } catch (err) {
            setError('Failed to load projects');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }
    
    if (loading) {
        return (
            <div className="dashboard loading">
                <div className="spinner"></div>
            </div>
        );
    }
    
    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>My Projects</h1>
                <button 
                    className="btn btn-primary"
                    onClick={() => navigate('/new-project')}
                >
                    + New Project
                </button>
            </div>
            
            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}
            
            {projects.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <h2>No projects yet</h2>
                    <p>Create your first project to get started with AgentFlow</p>
                    <button 
                        className="btn btn-primary"
                        onClick={() => navigate('/new-project')}
                    >
                        Create Project
                    </button>
                </div>
            ) : (
                <div className="projects-grid">
                    {projects.map(project => (
                        <ProjectCard 
                            key={project.projectId}
                            project={project}
                            onClick={() => navigate(`/project/${project.projectId}`)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default Dashboard;
