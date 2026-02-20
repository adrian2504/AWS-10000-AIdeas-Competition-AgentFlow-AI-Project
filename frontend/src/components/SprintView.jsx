// I show sprint planning, timeline, progress charts, and team assignments
// I help visualize project progress and workload distribution

import { useState, useEffect } from 'react';
import { getTeamMembers } from '../services/api';
import './SprintView.css';

function SprintView({ tasks, stats, projectName }) {
    const [teamMembers, setTeamMembers] = useState([]);
    
    useEffect(() => {
        loadTeamMembers();
    }, []);
    
    async function loadTeamMembers() {
        try {
            const data = await getTeamMembers();
            setTeamMembers(data.members);
        } catch (err) {
            console.error('Failed to load team members:', err);
        }
    }
    
    // I calculate sprint progress
    const totalTasks = stats?.total || 0;
    const completedTasks = stats?.completed || 0;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    // I calculate estimated completion date (assuming 2 days per task)
    const remainingTasks = totalTasks - completedTasks;
    const daysRemaining = Math.ceil(remainingTasks * 2);
    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + daysRemaining);
    
    // I get AI task outputs for preview
    const aiTasks = tasks?.filter(t => t.assignmentType === 'AI' && t.status === 'DONE') || [];
    
    // I assign team members to human tasks
    const humanTasks = tasks?.filter(t => t.assignmentType === 'HUMAN') || [];
    const memberAssignments = {};
    
    teamMembers.forEach(member => {
        memberAssignments[member.memberId] = {
            member,
            tasks: []
        };
    });
    
    // I distribute human tasks among available team members
    humanTasks.forEach((task, index) => {
        const availableMembers = teamMembers.filter(m => m.availability === 'AVAILABLE');
        if (availableMembers.length > 0) {
            const memberIndex = index % availableMembers.length;
            const member = availableMembers[memberIndex];
            if (memberAssignments[member.memberId]) {
                memberAssignments[member.memberId].tasks.push(task);
            }
        }
    });
    
    return (
        <div className="sprint-view">
            <div className="sprint-header">
                <h2>Sprint Overview: {projectName}</h2>
                <div className="sprint-dates">
                    <span>Est. Completion: {completionDate.toLocaleDateString()}</span>
                </div>
            </div>
            
            <div className="sprint-timeline">
                <h3>Sprint Progress</h3>
                <div className="timeline-wrapper">
                    <div 
                        className="timeline-bar" 
                        style={{'--progress': `${progress}%`}}
                    >
                        <span className="timeline-marker start-marker">Start</span>
                        <span className="timeline-marker progress-marker" style={{left: `${progress}%`}}>
                            {Math.round(progress)}%
                        </span>
                        <span className="timeline-marker end-marker">End</span>
                    </div>
                </div>
                <p style={{textAlign: 'center', color: '#666', marginTop: '1.5rem'}}>
                    {completedTasks} of {totalTasks} tasks completed • {daysRemaining} days remaining
                </p>
            </div>
            
            <div className="sprint-stats">
                <div className="stat-card">
                    <h3>Total Tasks</h3>
                    <div className="value">{stats?.total || 0}</div>
                </div>
                <div className="stat-card">
                    <h3>In Progress</h3>
                    <div className="value" style={{color: '#2196F3'}}>{stats?.inProgress || 0}</div>
                </div>
                <div className="stat-card">
                    <h3>In Review</h3>
                    <div className="value" style={{color: '#FF9800'}}>{stats?.review || 0}</div>
                </div>
                <div className="stat-card">
                    <h3>Completed</h3>
                    <div className="value" style={{color: '#4CAF50'}}>{stats?.completed || 0}</div>
                </div>
            </div>
            
            <div className="charts-row">
                <div className="chart-container">
                    <h3>Task Distribution by Status</h3>
                    <div className="progress-chart">
                        <div style={{flex: 1}}>
                            <div 
                                className="chart-bar queued" 
                                style={{height: `${(stats?.queued / stats?.total) * 100}%`}}
                            ></div>
                            <div className="chart-label">Queued<br/>{stats?.queued || 0}</div>
                        </div>
                        <div style={{flex: 1}}>
                            <div 
                                className="chart-bar in-progress" 
                                style={{height: `${(stats?.inProgress / stats?.total) * 100}%`}}
                            ></div>
                            <div className="chart-label">In Progress<br/>{stats?.inProgress || 0}</div>
                        </div>
                        <div style={{flex: 1}}>
                            <div 
                                className="chart-bar review" 
                                style={{height: `${(stats?.review / stats?.total) * 100}%`}}
                            ></div>
                            <div className="chart-label">Review<br/>{stats?.review || 0}</div>
                        </div>
                        <div style={{flex: 1}}>
                            <div 
                                className="chart-bar done" 
                                style={{height: `${(stats?.completed / stats?.total) * 100}%`}}
                            ></div>
                            <div className="chart-label">Done<br/>{stats?.completed || 0}</div>
                        </div>
                    </div>
                </div>
                
                <div className="chart-container">
                    <h3>AI vs Human Tasks</h3>
                    <div className="pie-chart-wrapper">
                        <svg viewBox="0 0 200 200" className="pie-chart">
                            <circle
                                cx="100"
                                cy="100"
                                r="80"
                                fill="none"
                                stroke="#4CAF50"
                                strokeWidth="40"
                                strokeDasharray={`${(stats?.aiTasks / stats?.total) * 502.4} 502.4`}
                                transform="rotate(-90 100 100)"
                            />
                            <circle
                                cx="100"
                                cy="100"
                                r="80"
                                fill="none"
                                stroke="#2196F3"
                                strokeWidth="40"
                                strokeDasharray={`${(stats?.humanTasks / stats?.total) * 502.4} 502.4`}
                                strokeDashoffset={`-${(stats?.aiTasks / stats?.total) * 502.4}`}
                                transform="rotate(-90 100 100)"
                            />
                        </svg>
                        <div className="pie-legend">
                            <div className="legend-item">
                                <span className="legend-color" style={{background: '#4CAF50'}}></span>
                                <span>🤖 AI Tasks: {stats?.aiTasks || 0}</span>
                            </div>
                            <div className="legend-item">
                                <span className="legend-color" style={{background: '#2196F3'}}></span>
                                <span>👤 Human Tasks: {stats?.humanTasks || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="team-assignments">
                <h3>Team Assignments ({humanTasks.length} Human Tasks)</h3>
                {teamMembers.length === 0 ? (
                    <p style={{color: '#999', marginTop: '1rem'}}>
                        No team members added yet. Go to Team page to add members.
                    </p>
                ) : (
                    <div className="assignment-list">
                        {Object.values(memberAssignments).map(({member, tasks}) => (
                            <div key={member.memberId} className="assignment-item">
                                <div className="member-info">
                                    <div className="member-avatar">
                                        {member.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{fontWeight: 500}}>{member.name}</div>
                                        <div style={{fontSize: '0.85rem', color: '#666'}}>
                                            {member.role}
                                        </div>
                                    </div>
                                </div>
                                <div className="task-count">
                                    {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            {aiTasks.length > 0 && (
                <div className="chart-container">
                    <h3>AI Generated Content ({aiTasks.length} AI Tasks Completed)</h3>
                    {aiTasks.slice(0, 2).map(task => (
                        <div key={task.taskId} className="ai-output-preview">
                            <h4>🤖 {task.title}</h4>
                            <p style={{color: '#666', fontSize: '0.9rem', marginBottom: '0.5rem'}}>
                                {task.description}
                            </p>
                            {task.output && (
                                <pre>
                                    {typeof task.output === 'string' 
                                        ? task.output.substring(0, 300) 
                                        : JSON.stringify(task.output, null, 2).substring(0, 300)
                                    }...
                                </pre>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default SprintView;
