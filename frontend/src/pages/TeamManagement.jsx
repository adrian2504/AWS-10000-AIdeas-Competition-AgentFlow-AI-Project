// I manage team members and their skills
// I help users build their team and assign tasks effectively

import React, { useState, useEffect } from 'react';
import { getTeamMembers, addTeamMember, updateTeamMember, deleteTeamMember } from '../services/api';
import './TeamManagement.css';

function TeamManagement() {
    const [members, setMembers] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [loading, setLoading] = useState(true);
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: '',
        skills: '',
        availability: 'AVAILABLE'
    });
    
    useEffect(() => {
        loadTeamMembers();
    }, []);
    
    async function loadTeamMembers() {
        try {
            const data = await getTeamMembers();
            setMembers(data.members);
            setLoading(false);
        } catch (err) {
            console.error('Failed to load team members:', err);
            setLoading(false);
        }
    }
    
    async function handleSubmit(e) {
        e.preventDefault();
        
        const memberData = {
            ...formData,
            skills: formData.skills.split(',').map(s => s.trim()).filter(s => s)
        };
        
        try {
            if (editingMember) {
                await updateTeamMember(editingMember.memberId, memberData);
            } else {
                await addTeamMember(memberData);
            }
            
            setFormData({ name: '', email: '', role: '', skills: '', availability: 'AVAILABLE' });
            setShowAddForm(false);
            setEditingMember(null);
            await loadTeamMembers();
        } catch (err) {
            console.error('Failed to save team member:', err);
            alert('Failed to save team member');
        }
    }
    
    async function handleDelete(memberId) {
        if (!window.confirm('Are you sure you want to remove this team member?')) {
            return;
        }
        
        try {
            await deleteTeamMember(memberId);
            await loadTeamMembers();
        } catch (err) {
            console.error('Failed to delete team member:', err);
            alert('Failed to delete team member');
        }
    }
    
    function handleEdit(member) {
        setEditingMember(member);
        setFormData({
            name: member.name,
            email: member.email,
            role: member.role,
            skills: member.skills.join(', '),
            availability: member.availability
        });
        setShowAddForm(true);
    }
    
    function handleCancel() {
        setFormData({ name: '', email: '', role: '', skills: '', availability: 'AVAILABLE' });
        setShowAddForm(false);
        setEditingMember(null);
    }
    
    if (loading) {
        return <div className="team-management loading">Loading team...</div>;
    }
    
    return (
        <div className="team-management">
            <div className="team-header">
                <h1>Team Management</h1>
                <button 
                    className="btn-primary"
                    onClick={() => setShowAddForm(true)}
                >
                    + Add Team Member
                </button>
            </div>
            
            {showAddForm && (
                <div className="add-member-form">
                    <h2>{editingMember ? 'Edit Team Member' : 'Add Team Member'}</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Role</label>
                            <input
                                type="text"
                                value={formData.role}
                                onChange={(e) => setFormData({...formData, role: e.target.value})}
                                placeholder="e.g., Frontend Developer, Designer"
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Skills (comma-separated)</label>
                            <input
                                type="text"
                                value={formData.skills}
                                onChange={(e) => setFormData({...formData, skills: e.target.value})}
                                placeholder="e.g., React, Node.js, AWS, Design"
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Availability</label>
                            <select
                                value={formData.availability}
                                onChange={(e) => setFormData({...formData, availability: e.target.value})}
                            >
                                <option value="AVAILABLE">Available</option>
                                <option value="BUSY">Busy</option>
                                <option value="UNAVAILABLE">Unavailable</option>
                            </select>
                        </div>
                        
                        <div className="form-actions">
                            <button type="submit" className="btn-primary">
                                {editingMember ? 'Update' : 'Add'} Member
                            </button>
                            <button type="button" className="btn-secondary" onClick={handleCancel}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}
            
            <div className="team-list">
                {members.length === 0 ? (
                    <div className="empty-state">
                        <p>No team members yet. Add your first team member to get started!</p>
                    </div>
                ) : (
                    <div className="members-grid">
                        {members.map(member => (
                            <div key={member.memberId} className="member-card">
                                <div className="member-header">
                                    <h3>{member.name}</h3>
                                    <span className={`availability-badge ${member.availability.toLowerCase()}`}>
                                        {member.availability}
                                    </span>
                                </div>
                                
                                <p className="member-role">{member.role}</p>
                                <p className="member-email">{member.email}</p>
                                
                                <div className="member-skills">
                                    {member.skills.map((skill, idx) => (
                                        <span key={idx} className="skill-tag">{skill}</span>
                                    ))}
                                </div>
                                
                                <div className="member-stats">
                                    <span>Tasks: {member.tasksAssigned}</span>
                                    <span>Completed: {member.tasksCompleted}</span>
                                </div>
                                
                                <div className="member-actions">
                                    <button onClick={() => handleEdit(member)} className="btn-edit">
                                        Edit
                                    </button>
                                    <button onClick={() => handleDelete(member.memberId)} className="btn-delete">
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default TeamManagement;
