// I manage team members and their skills with tag-based autocomplete
// I help users build their team and assign tasks effectively

import { useState, useEffect } from 'react';
import { getTeamMembers, addTeamMember, updateTeamMember, deleteTeamMember } from '../services/api';
import './TeamManagement.css';

// I provide common skills and roles for autocomplete
const COMMON_SKILLS = [
    'React', 'Node.js', 'Python', 'Java', 'TypeScript', 'JavaScript',
    'AWS', 'Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL', 'MySQL',
    'GraphQL', 'REST API', 'HTML', 'CSS', 'Tailwind', 'Bootstrap',
    'Vue.js', 'Angular', 'Django', 'Flask', 'Spring Boot', 'Express',
    'Git', 'CI/CD', 'Testing', 'Agile', 'Scrum', 'UI/UX Design',
    'Figma', 'Photoshop', 'Illustrator', 'Product Management'
];

const COMMON_ROLES = [
    'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
    'DevOps Engineer', 'UI/UX Designer', 'Product Manager',
    'QA Engineer', 'Data Scientist', 'Mobile Developer',
    'System Architect', 'Tech Lead', 'Scrum Master'
];

function TeamManagement() {
    const [members, setMembers] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [loading, setLoading] = useState(true);
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: '',
        skills: [],
        availability: 'AVAILABLE'
    });
    
    const [skillInput, setSkillInput] = useState('');
    const [showSkillSuggestions, setShowSkillSuggestions] = useState(false);
    const [showRoleSuggestions, setShowRoleSuggestions] = useState(false);
    
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
            skills: formData.skills
        };
        
        try {
            if (editingMember) {
                await updateTeamMember(editingMember.memberId, memberData);
            } else {
                await addTeamMember(memberData);
            }
            
            setFormData({ name: '', email: '', role: '', skills: [], availability: 'AVAILABLE' });
            setShowAddForm(false);
            setEditingMember(null);
            await loadTeamMembers();
        } catch (err) {
            console.error('Failed to save team member:', err);
            alert('Failed to save team member');
        }
    }
    
    function handleAddSkill(skill) {
        if (skill && !formData.skills.includes(skill)) {
            setFormData({...formData, skills: [...formData.skills, skill]});
        }
        setSkillInput('');
        setShowSkillSuggestions(false);
    }
    
    function handleRemoveSkill(skillToRemove) {
        setFormData({
            ...formData,
            skills: formData.skills.filter(s => s !== skillToRemove)
        });
    }
    
    function handleSkillInputKeyDown(e) {
        if (e.key === 'Enter' && skillInput.trim()) {
            e.preventDefault();
            handleAddSkill(skillInput.trim());
        }
    }
    
    const filteredSkills = COMMON_SKILLS.filter(skill => 
        skill.toLowerCase().includes(skillInput.toLowerCase()) &&
        !formData.skills.includes(skill)
    );
    
    const filteredRoles = COMMON_ROLES.filter(role =>
        role.toLowerCase().includes(formData.role.toLowerCase())
    );
    
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
            skills: member.skills || [],
            availability: member.availability
        });
        setShowAddForm(true);
    }
    
    function handleCancel() {
        setFormData({ name: '', email: '', role: '', skills: [], availability: 'AVAILABLE' });
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
                            <div className="autocomplete-wrapper">
                                <input
                                    type="text"
                                    value={formData.role}
                                    onChange={(e) => {
                                        setFormData({...formData, role: e.target.value});
                                        setShowRoleSuggestions(true);
                                    }}
                                    onFocus={() => setShowRoleSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowRoleSuggestions(false), 200)}
                                    placeholder="e.g., Frontend Developer"
                                    required
                                />
                                {showRoleSuggestions && filteredRoles.length > 0 && (
                                    <div className="autocomplete-dropdown">
                                        {filteredRoles.map(role => (
                                            <div
                                                key={role}
                                                className="autocomplete-item"
                                                onClick={() => {
                                                    setFormData({...formData, role});
                                                    setShowRoleSuggestions(false);
                                                }}
                                            >
                                                {role}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label>Skills</label>
                            <div className="skills-input-wrapper">
                                <div className="selected-skills">
                                    {formData.skills.map(skill => (
                                        <span key={skill} className="skill-tag">
                                            {skill}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveSkill(skill)}
                                                className="remove-skill"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <div className="autocomplete-wrapper">
                                    <input
                                        type="text"
                                        value={skillInput}
                                        onChange={(e) => {
                                            setSkillInput(e.target.value);
                                            setShowSkillSuggestions(true);
                                        }}
                                        onKeyDown={handleSkillInputKeyDown}
                                        onFocus={() => setShowSkillSuggestions(true)}
                                        onBlur={() => setTimeout(() => setShowSkillSuggestions(false), 200)}
                                        placeholder="Type to add skills..."
                                    />
                                    {showSkillSuggestions && filteredSkills.length > 0 && (
                                        <div className="autocomplete-dropdown">
                                            {filteredSkills.slice(0, 8).map(skill => (
                                                <div
                                                    key={skill}
                                                    className="autocomplete-item"
                                                    onClick={() => handleAddSkill(skill)}
                                                >
                                                    {skill}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
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
