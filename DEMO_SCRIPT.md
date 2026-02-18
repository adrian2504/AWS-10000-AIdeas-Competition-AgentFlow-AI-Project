# AgentFlow - Demo Video Script

A 4-minute demo script for the competition video. Keep it under 5 minutes!

## Video Structure (4 minutes)

1. **Introduction** (30 seconds)
2. **Problem Statement** (30 seconds)
3. **Solution Overview** (30 seconds)
4. **Live Demo** (2 minutes)
5. **Key Features** (30 seconds)
6. **Closing** (30 seconds)

---

## Script

### 1. Introduction (30 seconds)

**[Screen: AgentFlow logo/landing page]**

"Hi, I'm [Your Name], and I built AgentFlow - an AI-powered project management system that transforms messy project briefs into clean, executable task flows.

Instead of spending hours breaking down requirements, creating tickets, and chasing updates, AgentFlow does it automatically using AWS Bedrock, Lambda, and intelligent routing."

**Key Points:**
- Who you are
- What AgentFlow is
- Core value proposition

---

### 2. Problem Statement (30 seconds)

**[Screen: Show typical project management pain points - maybe a messy spreadsheet or long email thread]**

"Product managers spend 40-60% of their time on coordination instead of strategy. Teams waste hours in status meetings. Work gets blocked because people don't have the right context.

I built AgentFlow to solve this by automating the structured work and routing high-judgment tasks to humans."

**Key Points:**
- Real problem people face
- Time wasted on coordination
- Why automation + human judgment matters

---

### 3. Solution Overview (30 seconds)

**[Screen: Architecture diagram or flow diagram]**

"Here's how it works: Upload a project brief, and AgentFlow analyzes it with Claude 3 Sonnet, generates atomic tasks, identifies dependencies, and routes each task to either an AI agent or a human expert based on complexity and risk.

Everything runs on AWS serverless infrastructure - Lambda, DynamoDB, S3, and Bedrock - staying within the Free Tier."

**Key Points:**
- Simple workflow explanation
- AI + Human collaboration
- AWS serverless architecture

---

### 4. Live Demo (2 minutes)

#### Part A: Create Project (30 seconds)

**[Screen: Dashboard]**

"Let me show you. I'm signed in to AgentFlow. I'll create a new project by clicking 'New Project'."

**[Screen: New Project page]**

"I'll enter a project name - 'E-Commerce Website' - and paste a project brief describing what needs to be built."

**[Paste brief, click Create Project]**

"I click Create Project, and AgentFlow immediately starts analyzing the brief."

**Actions:**
- Click "New Project"
- Enter project name
- Paste brief (have it ready in clipboard)
- Click "Create Project"

#### Part B: Task Generation (30 seconds)

**[Screen: Project view loading, then tasks appear]**

"Within 30 seconds, AgentFlow has generated 12 atomic tasks. Each task has a clear description, acceptance criteria, and complexity level.

Notice some tasks are assigned to AI agents - marked with the robot icon - and others to human experts - marked with the person icon."

**Actions:**
- Wait for tasks to appear
- Point out AI vs Human badges
- Show task count

#### Part C: Task Details (30 seconds)

**[Screen: Click on an AI task]**

"Let me click on this AI task. You can see it's been automatically executed by Claude 3 Sonnet, with context from the project brief. The output is detailed and specific to our project.

The task is now in Review status, waiting for approval."

**[Close modal, click on a Human task]**

"This task was routed to a human because it requires design judgment. The routing reason explains why."

**Actions:**
- Click AI task
- Show output
- Point out context injection
- Close modal
- Click Human task
- Show routing reason

#### Part D: Review Process (30 seconds)

**[Screen: Review an AI task]**

"I can review the AI output and either approve it or request changes. If I approve, it moves to Done. If I reject it, it goes back to the queue with my feedback for improvement.

This review loop ensures quality while maintaining automation."

**[Approve the task]**

"I'll approve this one. It moves to the Done column."

**Actions:**
- Click Review task
- Show approve/reject options
- Click Approve
- Show task moving to Done

---

### 5. Key Features (30 seconds)

**[Screen: Kanban board with statistics]**

"The live Kanban board shows real-time progress across five columns. The statistics at the top show completion rate, AI vs Human distribution, and tasks in each stage.

Everything updates automatically every 5 seconds, so the entire team has visibility into what's happening."

**Key Points:**
- Live Kanban board
- Real-time updates
- Project statistics
- Team visibility

---

### 6. Closing (30 seconds)

**[Screen: Architecture diagram or summary slide]**

"AgentFlow demonstrates how AI can augment human capabilities in project management. By automating the structured work and routing high-judgment tasks to humans, teams can move faster while maintaining quality.

It's built entirely on AWS serverless services, costs less than $10 per month, and is ready for production use.

Thanks for watching! Check out the GitHub repository for the full code and documentation."

**Key Points:**
- AI + Human collaboration
- AWS serverless
- Low cost
- Production ready
- GitHub link

---

## Recording Tips

### Before Recording

1. **Prepare Your Environment**
   - Clean desktop
   - Close unnecessary applications
   - Disable notifications
   - Use incognito/private browser window
   - Have project brief ready in clipboard
   - Test audio levels

2. **Prepare Test Data**
   - Create fresh test account
   - Have example brief ready
   - Know which tasks to click on
   - Practice the flow 2-3 times

3. **Recording Setup**
   - Use screen recording software (OBS, Loom, QuickTime)
   - Record at 1080p minimum
   - Use good microphone
   - Record in quiet environment
   - Have script visible but don't read it word-for-word

### During Recording

1. **Speak Clearly**
   - Moderate pace (not too fast)
   - Enthusiastic but professional
   - Pause between sections
   - Emphasize key points

2. **Show, Don't Tell**
   - Let the application speak for itself
   - Point out key features visually
   - Use mouse to highlight important elements
   - Don't rush through screens

3. **Handle Mistakes**
   - If you make a mistake, pause and restart that section
   - Edit out mistakes in post-production
   - Don't apologize on camera

### After Recording

1. **Edit**
   - Cut out long pauses
   - Add transitions between sections
   - Add text overlays for key points
   - Add background music (optional, keep it subtle)
   - Add intro/outro slides

2. **Add Captions**
   - YouTube auto-captions work well
   - Review and fix any errors
   - Helps with accessibility

3. **Optimize for YouTube**
   - Title: "AgentFlow - AI Project Co-Pilot | AWS AIdeas 2025"
   - Description: Include GitHub link, key features, AWS services used
   - Tags: AWS, AI, Project Management, Bedrock, Serverless
   - Thumbnail: Eye-catching image with AgentFlow logo

## Example Project Brief

Use this brief for the demo (or create your own):

```
Project: E-Commerce Website for Local Artisans

Overview:
Build a web platform where local artisans can sell their handmade products 
directly to customers. The platform should support product listings, shopping 
cart, checkout, and order management.

Requirements:
- User authentication (buyers and sellers)
- Product catalog with search and filters
- Shopping cart functionality
- Stripe payment integration
- Order tracking and management
- Seller dashboard for inventory management
- Responsive design for mobile and desktop
- Email notifications for orders

Technical Constraints:
- Must use React for frontend
- Node.js backend with Express
- PostgreSQL database
- Deploy on AWS
- Budget: $500/month for hosting
- Timeline: 8 weeks

Success Criteria:
- Users can browse and purchase products
- Sellers can manage their inventory
- Payment processing works reliably
- Site loads in under 2 seconds
- Mobile-friendly interface
```

## Timing Breakdown

| Section | Time | Cumulative |
|---------|------|------------|
| Introduction | 0:30 | 0:30 |
| Problem Statement | 0:30 | 1:00 |
| Solution Overview | 0:30 | 1:30 |
| Demo - Create Project | 0:30 | 2:00 |
| Demo - Task Generation | 0:30 | 2:30 |
| Demo - Task Details | 0:30 | 3:00 |
| Demo - Review Process | 0:30 | 3:30 |
| Key Features | 0:30 | 4:00 |
| Closing | 0:30 | 4:30 |

**Total: 4:30 (well under 5-minute limit)**

## Backup Plan

If something goes wrong during recording:

1. **Tasks don't generate**: Have a pre-recorded project ready
2. **AI execution fails**: Show a completed task instead
3. **Application crashes**: Have screenshots as backup
4. **Audio issues**: Record voiceover separately and sync

## Post-Production Checklist

- [ ] Video is under 5 minutes
- [ ] Audio is clear
- [ ] Screen is readable (1080p minimum)
- [ ] No sensitive information visible
- [ ] Transitions are smooth
- [ ] Key points are highlighted
- [ ] Intro/outro added
- [ ] Captions reviewed
- [ ] Uploaded to YouTube
- [ ] Video is public or unlisted
- [ ] Description includes GitHub link
- [ ] Thumbnail is eye-catching

## YouTube Upload Details

**Title:**
```
AgentFlow - AI Project Co-Pilot | AWS AIdeas 2025
```

**Description:**
```
AgentFlow is an AI-powered project management system that automatically 
transforms project briefs into executable task flows using AWS Bedrock, 
Lambda, and intelligent routing.

🔗 GitHub: [your-repo-link]
📚 Documentation: [your-docs-link]
🏆 AWS AIdeas Competition 2025

Built with:
- AWS Lambda (serverless compute)
- AWS Bedrock (Claude 3 Sonnet)
- AWS DynamoDB (data storage)
- AWS S3 (object storage)
- AWS EventBridge (orchestration)
- React (frontend)

Features:
✅ AI-powered brief analysis
✅ Automatic task generation
✅ Intelligent AI/Human routing
✅ RAG context injection
✅ Live Kanban dashboard
✅ Real-time updates

#AWS #AI #ProjectManagement #Bedrock #Serverless #AIdeas2025
```

**Tags:**
```
AWS, AI, Bedrock, Lambda, Serverless, Project Management, Claude, 
React, DynamoDB, EventBridge, AIdeas, Competition, Automation
```

---

Good luck with your demo! 🎬
