// I handle the creation of new projects from briefs
// I provide a simple interface for uploading project briefs

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProject } from '../services/api';
import './NewProject.css';

function NewProject() {
    const [projectName, setProjectName] = useState('');
    const [briefContent, setBriefContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    
    async function handleSubmit(e) {
        e.preventDefault();
        
        if (!projectName.trim() || !briefContent.trim()) {
            setError('Please provide both project name and brief');
            return;
        }
        
        try {
            setLoading(true);
            setError(null);
            
            const result = await createProject(projectName, briefContent);
            
            // I redirect to the project view
            navigate(`/project/${result.projectId}`);
            
        } catch (err) {
            // I handle limit errors specially
            if (err.message && err.message.includes('limit')) {
                setError(
                    <div>
                        <strong>Project Limit Reached</strong>
                        <p>You have reached the maximum limit of 1 project per user.</p>
                        <p>Please delete your existing project from the Dashboard to create a new one.</p>
                        <button 
                            className="btn btn-secondary" 
                            style={{marginTop: '1rem'}}
                            onClick={() => navigate('/')}
                        >
                            Go to Dashboard
                        </button>
                    </div>
                );
            } else {
                setError(err.message || 'Failed to create project');
            }
            setLoading(false);
        }
    }
    
    function handleFileUpload(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setBriefContent(event.target.result);
            };
            reader.readAsText(file);
        }
    }
    
    return (
        <div className="new-project">
            <div className="new-project-container">
                <h1>Create New Project</h1>
                <p className="subtitle">
                    Upload your project brief and I'll break it down into actionable tasks
                </p>
                
                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="projectName">Project Name</label>
                        <input
                            id="projectName"
                            type="text"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            placeholder="Enter project name"
                            disabled={loading}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="briefContent">Project Brief</label>
                        <div className="file-upload">
                            <input
                                type="file"
                                accept=".txt,.md"
                                onChange={handleFileUpload}
                                disabled={loading}
                            />
                            <span className="file-upload-hint">
                                Or paste your brief below
                            </span>
                        </div>
                        <textarea
                            id="briefContent"
                            value={briefContent}
                            onChange={(e) => setBriefContent(e.target.value)}
                            placeholder="Paste your project brief here..."
                            rows={15}
                            disabled={loading}
                        />
                        <div className="char-count">
                            {briefContent.length} characters
                        </div>
                    </div>
                    
                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => navigate('/')}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Creating Project...' : 'Create Project'}
                        </button>
                    </div>
                </form>
                
                <div className="info-box">
                    <h3>What happens next?</h3>
                    <ol>
                        <li>I'll analyze your brief and extract key requirements</li>
                        <li>I'll break it down into atomic, actionable tasks</li>
                        <li>I'll route each task to AI or human experts</li>
                        <li>You'll see everything on a live Kanban board</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}

export default NewProject;
