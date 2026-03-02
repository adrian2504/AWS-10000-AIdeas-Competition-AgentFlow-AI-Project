# Sprint Planning Feature Guide

## Overview

The Sprint Planning feature allows teams to record their sprint planning meetings and automatically convert the discussion into actionable tasks. This feature uses AI to transcribe audio and extract structured tasks with assignments.

## Features

### 1. Audio Recording
- Record sprint planning meetings directly in the browser
- Visual recording indicator with pulse animation
- Stop and re-record capability
- Supports all modern browsers with microphone access

### 2. AI-Powered Transcription
- Automatic audio-to-text conversion
- Preserves meeting context and discussion points
- Real-time processing indicator

### 3. Intelligent Task Extraction
- AI analyzes transcription to identify actionable tasks
- Extracts key information:
  - Task title and description
  - Category (Frontend, Backend, Database, etc.)
  - Complexity level (Low, Medium, High)
  - Estimated hours
  - Priority (High, Medium, Low)

### 4. Sprint Task Management
- Review extracted tasks before adding to sprint
- Select which tasks to include in the sprint
- Assign tasks to team members
- See total estimated hours for selected tasks
- Visual indicators for selected tasks

### 5. Team Integration
- Automatically loads team members
- Assign tasks during sprint planning
- Filter by role and availability

## How to Use

### Step 1: Navigate to Sprint Planning
1. Open a project from the dashboard
2. Click the "🎤 Sprint Planning" button in the project view
3. You'll be taken to the Sprint Planning page

### Step 2: Record Your Meeting
1. Click "Start Recording" to begin
2. Conduct your sprint planning meeting
3. Discuss tasks, priorities, and assignments
4. Click "Stop Recording" when finished

### Step 3: Process the Recording
1. Click "Process Recording" to analyze the audio
2. Wait for AI to transcribe and extract tasks
3. Review the meeting transcription

### Step 4: Review Extracted Tasks
1. Review all extracted tasks
2. Check task details (title, description, complexity, etc.)
3. Verify estimated hours and priorities

### Step 5: Select Tasks for Sprint
1. Check the boxes next to tasks you want to include
2. See the sprint summary update in real-time
3. Total estimated hours are calculated automatically

### Step 6: Assign Tasks
1. For each selected task, choose a team member from the dropdown
2. Consider team member availability and skills
3. Balance workload across the team

### Step 7: Create Sprint Tasks
1. Review your selections
2. Click "Create X Sprint Tasks" button
3. Tasks are added to the project board
4. You'll be redirected back to the project view

## UI Components

### Recording Section
- Large, prominent recording button
- Visual feedback during recording
- Clear audio controls

### Transcription Display
- Formatted text box with meeting transcription
- Scrollable for long meetings
- Easy to read layout

### Task Cards
- Visual distinction for selected tasks
- Priority badges with color coding
- Expandable assignment section
- Hover effects for better UX

### Sprint Summary
- Real-time task count
- Total estimated hours
- Prominent display at top of task list

## Technical Details

### Frontend
- **Component**: `SprintPlanning.jsx`
- **Styling**: `SprintPlanning.css`
- **API Integration**: `api.js`

### Backend
- **Lambda**: `sprint-planner`
- **Services Used**:
  - AWS Transcribe (audio-to-text)
  - Amazon Bedrock (task extraction)
  - DynamoDB (task storage)
  - S3 (audio storage)

### Browser Requirements
- Modern browser with MediaRecorder API support
- Microphone access permission
- JavaScript enabled

## Best Practices

### During Recording
1. Speak clearly and at a moderate pace
2. Mention task details explicitly
3. State priorities and complexity
4. Discuss time estimates
5. Mention team member names for assignments

### Task Selection
1. Review all extracted tasks carefully
2. Ensure tasks are well-defined
3. Check estimated hours are reasonable
4. Consider team capacity
5. Balance priorities

### Team Assignment
1. Match tasks to team member skills
2. Check availability before assigning
3. Distribute workload evenly
4. Consider task dependencies
5. Leave complex tasks for experienced members

## Example Meeting Script

```
"Let's start with the authentication feature. We need to implement OAuth 
support for Google and GitHub. This is a high priority, high complexity 
task. I estimate about 16 hours. John, can you take this one?

Next, we need a real-time analytics dashboard. This is medium complexity, 
high priority. Should take about 12 hours. Sarah, this would be perfect 
for you.

We also need to add rate limiting to our API endpoints. This is low 
complexity but medium priority. About 4 hours. Mike, can you handle this?

Finally, we need to run a database migration for the new user fields. 
Low complexity, high priority, about 3 hours. I'll take this one."
```

## Troubleshooting

### Microphone Not Working
- Check browser permissions
- Ensure microphone is connected
- Try a different browser
- Check system audio settings

### Processing Takes Too Long
- Check internet connection
- Verify backend services are running
- Try with a shorter recording
- Contact support if issue persists

### Tasks Not Extracted Correctly
- Speak more clearly during recording
- Be more explicit about task details
- Manually edit tasks after creation
- Provide feedback for AI improvement

### Assignment Dropdown Empty
- Ensure team members are added
- Check team management page
- Refresh the page
- Verify API connection

## Future Enhancements

- Real-time transcription during recording
- Multi-language support
- Custom task templates
- Integration with calendar for sprint dates
- Automatic sprint velocity calculation
- Task dependency detection
- Voice commands for task management
- Export transcription and tasks to PDF
- Integration with Slack/Teams for notifications

## Support

For issues or questions:
1. Check this guide first
2. Review the main README.md
3. Check browser console for errors
4. Contact the development team
