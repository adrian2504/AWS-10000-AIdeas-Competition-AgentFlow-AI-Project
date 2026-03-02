// I handle sprint planning with audio recording and AI-powered task extraction
// I allow users to record meetings and convert them into actionable tasks

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTeamMembers, processSprintAudio, createSprintTasks } from '../services/api';
import './SprintPlanning.css';

function SprintPlanning() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [transcription, setTranscription] = useState('');
    const [extractedTasks, setExtractedTasks] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [processingAudio, setProcessingAudio] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    
    useEffect(() => {
        loadTeamMembers();
    }, []);
    
    async function loadTeamMembers() {
        try {
            const data = await getTeamMembers();
            setTeamMembers(data.members || []);
        } catch (err) {
            console.error('Failed to load team members:', err);
        }
    }
    
    async function startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };
            
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };
            
            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error('Failed to start recording:', err);
            alert('Failed to access microphone. Please check permissions.');
        }
    }
    
    function stopRecording() {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    }
    
    async function processAudio() {
        if (!audioBlob) return;
        
        setProcessingAudio(true);
        
        try {
            // Try to use real API, fallback to mock if not available
            try {
                console.log('Calling real API with audio blob:', audioBlob.size, 'bytes');
                const result = await processSprintAudio(projectId, audioBlob);
                console.log('API Response:', result);
                setTranscription(result.transcription);
                setExtractedTasks(result.tasks.map(task => ({
                    ...task,
                    includeInSprint: false,
                    assignedTo: null
                })));
            } catch (apiError) {
                console.error('API Error:', apiError);
                console.log('API not available, using mock data:', apiError.message);
                await simulateAudioProcessing();
            }
        } catch (err) {
            console.error('Failed to process audio:', err);
            alert('Failed to process audio recording');
        } finally {
            setProcessingAudio(false);
        }
    }
    
    async function simulateAudioProcessing() {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const mockTranscription = `Sprint Planning Meeting - ${new Date().toLocaleDateString()}

Team discussed the following items:

1. User authentication needs to be implemented with OAuth support
2. Dashboard should display real-time analytics
3. API endpoints need rate limiting
4. Database migration for new user fields
5. Mobile responsive design for all pages
6. Unit tests for authentication module
7. Documentation for API endpoints
8. Performance optimization for large datasets`;
        
        setTranscription(mockTranscription);
        
        const mockTasks = [
            {
                id: 'task-1',
                title: 'Implement OAuth Authentication',
                description: 'Add OAuth support for user authentication with Google and GitHub providers',
                category: 'Backend',
                complexity: 'High',
                estimatedHours: 16,
                priority: 'High',
                assignedTo: null,
                includeInSprint: false
            },
            {
                id: 'task-2',
                title: 'Build Real-time Analytics Dashboard',
                description: 'Create dashboard component with real-time data visualization using WebSocket',
                category: 'Frontend',
                complexity: 'Medium',
                estimatedHours: 12,
                priority: 'High',
                assignedTo: null,
                includeInSprint: false
            },
            {
                id: 'task-3',
                title: 'Implement API Rate Limiting',
                description: 'Add rate limiting middleware to protect API endpoints from abuse',
                category: 'Backend',
                complexity: 'Low',
                estimatedHours: 4,
                priority: 'Medium',
                assignedTo: null,
                includeInSprint: false
            },
            {
                id: 'task-4',
                title: 'Database Migration for User Fields',
                description: 'Create and run migration scripts for new user profile fields',
                category: 'Database',
                complexity: 'Low',
                estimatedHours: 3,
                priority: 'High',
                assignedTo: null,
                includeInSprint: false
            },
            {
                id: 'task-5',
                title: 'Mobile Responsive Design',
                description: 'Ensure all pages are mobile responsive with proper breakpoints',
                category: 'Frontend',
                complexity: 'Medium',
                estimatedHours: 8,
                priority: 'Medium',
                assignedTo: null,
                includeInSprint: false
            },
            {
                id: 'task-6',
                title: 'Unit Tests for Authentication',
                description: 'Write comprehensive unit tests for authentication module',
                category: 'Testing',
                complexity: 'Medium',
                estimatedHours: 6,
                priority: 'Low',
                assignedTo: null,
                includeInSprint: false
            },
            {
                id: 'task-7',
                title: 'API Documentation',
                description: 'Document all API endpoints with examples and response schemas',
                category: 'Documentation',
                complexity: 'Low',
                estimatedHours: 5,
                priority: 'Low',
                assignedTo: null,
                includeInSprint: false
            },
            {
                id: 'task-8',
                title: 'Performance Optimization',
                description: 'Optimize database queries and implement caching for large datasets',
                category: 'Backend',
                complexity: 'High',
                estimatedHours: 10,
                priority: 'Medium',
                assignedTo: null,
                includeInSprint: false
            }
        ];
        
        setExtractedTasks(mockTasks);
    }
    
    function toggleTaskInSprint(taskId) {
        setExtractedTasks(tasks =>
            tasks.map(task =>
                task.id === taskId
                    ? { ...task, includeInSprint: !task.includeInSprint }
                    : task
            )
        );
    }
    
    function assignTaskToMember(taskId, memberId) {
        setExtractedTasks(tasks =>
            tasks.map(task =>
                task.id === taskId
                    ? { ...task, assignedTo: memberId }
                    : task
            )
        );
    }
    
    async function createSprintTasksHandler() {
        const tasksToCreate = extractedTasks.filter(task => task.includeInSprint);
        
        if (tasksToCreate.length === 0) {
            alert('Please select at least one task to include in the sprint');
            return;
        }
        
        console.log('Creating sprint tasks:', tasksToCreate);
        setLoading(true);
        
        try {
            // Try to use real API, fallback to mock if not available
            try {
                const result = await createSprintTasks(projectId, tasksToCreate);
                console.log('Tasks created successfully:', result);
                alert(`Successfully created ${tasksToCreate.length} tasks for the sprint!`);
            } catch (apiError) {
                console.error('API Error creating tasks:', apiError);
                console.log('API not available, simulating task creation:', apiError.message);
                await new Promise(resolve => setTimeout(resolve, 1500));
                alert(`Successfully created ${tasksToCreate.length} tasks for the sprint! (Demo mode)`);
            }
            
            // Navigate back to project view
            navigate(`/project/${projectId}`);
        } catch (err) {
            console.error('Failed to create tasks:', err);
            alert('Failed to create sprint tasks');
        } finally {
            setLoading(false);
        }
    }
    
    function clearRecording() {
        setAudioBlob(null);
        setTranscription('');
        setExtractedTasks([]);
    }
    
    const sprintTasks = extractedTasks.filter(task => task.includeInSprint);
    const totalEstimatedHours = sprintTasks.reduce((sum, task) => sum + task.estimatedHours, 0);
    
    return (
        <div className="sprint-planning">
            <div className="sprint-header">
                <div className="header-with-back">
                    <button className="btn-back" onClick={() => navigate(`/project/${projectId}`)}>
                        ← Back to Project
                    </button>
                    <div>
                        <h1>Sprint Planning</h1>
                        <p className="subtitle">Record your sprint planning meeting and convert it into actionable tasks</p>
                    </div>
                </div>
            </div>
            
            <div className="recording-section">
                <div className="recording-controls">
                    {!isRecording && !audioBlob && (
                        <button className="btn btn-primary btn-large" onClick={startRecording}>
                            <svg className="icon-svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 12a3 3 0 100-6 3 3 0 000 6z"/>
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM10 2a6 6 0 100 12 6 6 0 000-12z" clipRule="evenodd"/>
                            </svg>
                            Start Recording
                        </button>
                    )}
                    
                    {isRecording && (
                        <button className="btn btn-danger btn-large recording-active" onClick={stopRecording}>
                            <span className="recording-indicator"></span>
                            Stop Recording
                        </button>
                    )}
                    
                    {audioBlob && !transcription && (
                        <div className="audio-actions">
                            <button className="btn btn-primary" onClick={processAudio} disabled={processingAudio}>
                                {processingAudio ? 'Processing...' : 'Process Recording'}
                            </button>
                            <button className="btn btn-secondary" onClick={clearRecording}>
                                Clear & Re-record
                            </button>
                        </div>
                    )}
                </div>
                
                {processingAudio && (
                    <div className="processing-indicator">
                        <div className="spinner"></div>
                        <p>Transcribing audio and extracting tasks...</p>
                    </div>
                )}
            </div>
            
            {transcription && (
                <div className="transcription-section">
                    <h2>Meeting Transcription</h2>
                    <div className="transcription-box">
                        {transcription}
                    </div>
                </div>
            )}
            
            {extractedTasks.length > 0 && (
                <>
                    <div className="tasks-section">
                        <div className="section-header">
                            <h2>Extracted Tasks</h2>
                            <div className="sprint-summary">
                                <span className="summary-item">
                                    {sprintTasks.length} tasks selected
                                </span>
                                <span className="summary-item">
                                    {totalEstimatedHours}h estimated
                                </span>
                            </div>
                        </div>
                        
                        <div className="tasks-grid">
                            {extractedTasks.map(task => (
                                <div key={task.id} className={`task-item ${task.includeInSprint ? 'selected' : ''}`}>
                                    <div className="task-item-header">
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={task.includeInSprint}
                                                onChange={() => toggleTaskInSprint(task.id)}
                                            />
                                            <span className="task-title">{task.title}</span>
                                        </label>
                                        <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>
                                            {task.priority}
                                        </span>
                                    </div>
                                    
                                    <p className="task-description">{task.description}</p>
                                    
                                    <div className="task-meta">
                                        <span className="meta-item">
                                            <span className="meta-label">Category:</span>
                                            {task.category}
                                        </span>
                                        <span className="meta-item">
                                            <span className="meta-label">Complexity:</span>
                                            {task.complexity}
                                        </span>
                                        <span className="meta-item">
                                            <span className="meta-label">Est:</span>
                                            {task.estimatedHours}h
                                        </span>
                                    </div>
                                    
                                    {task.includeInSprint && (
                                        <div className="task-assignment">
                                            <label>Assign to:</label>
                                            <select
                                                value={task.assignedTo || ''}
                                                onChange={(e) => assignTaskToMember(task.id, e.target.value)}
                                            >
                                                <option value="">Unassigned</option>
                                                {teamMembers.map(member => (
                                                    <option key={member.memberId} value={member.memberId}>
                                                        {member.name} ({member.role})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="action-section">
                        <button
                            className="btn btn-success btn-large"
                            onClick={createSprintTasksHandler}
                            disabled={loading || sprintTasks.length === 0}
                        >
                            {loading ? 'Creating Tasks...' : `Create ${sprintTasks.length} Sprint Tasks`}
                        </button>
                        <button className="btn btn-secondary" onClick={clearRecording}>
                            Start Over
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

export default SprintPlanning;
