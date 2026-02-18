# AIdeas: AgentFlow - AI Project Co-Pilot

![AgentFlow Banner](./docs/banner.png)

## App Category
**Workplace Efficiency**

## My Vision

AgentFlow is an AI-powered project management system that transforms messy project briefs into clean, executable task flows. Instead of spending hours breaking down requirements, creating tickets, and chasing updates, I built a system that does it automatically.

Upload a project brief, and AgentFlow:
- Analyzes the requirements and extracts deliverables
- Breaks everything into atomic, actionable tasks
- Routes each task to either an AI agent or a human expert
- Tracks execution through a live Kanban dashboard
- Runs review loops until tasks meet quality standards

I built AgentFlow because I've seen too many projects die in the "we'll figure it out later" phase. This system keeps work moving with clear ownership and real-time visibility.

## Why This Matters

Project coordination is one of the biggest time sinks in modern work. Product managers spend 40-60% of their time on coordination rather than strategy. Teams waste hours in status meetings. Work gets blocked because someone didn't have the right context.

AgentFlow solves this by:

1. **Eliminating coordination overhead**: No more manual ticket creation, assignment, or status chasing
2. **Intelligent work distribution**: AI handles the structured, repetitive work while humans focus on high-judgment tasks
3. **Context injection**: Every task comes with the relevant documentation, so nobody works blind
4. **Quality assurance**: Built-in review loops ensure outputs meet standards before moving forward
5. **Real-time visibility**: Live dashboard shows exactly what's happening across the entire project

This matters for:
- **Product managers** who want to focus on strategy instead of ticket management
- **Startup founders** running fast with small teams
- **Engineering teams** tired of unclear requirements and constant context switching
- **Research teams** managing complex, multi-phase projects

The result? Faster delivery, better quality, and teams that can scale without hiring an army of coordinators.

## How I Built This

### Architecture Overview

I built AgentFlow as a serverless application on AWS, designed to stay within Free Tier limits while handling real production workloads.

**Core AWS Services:**
- **Lambda**: 5 serverless functions handling brief processing, task generation, routing, AI execution, and task management
- **DynamoDB**: Two tables storing projects and tasks with GSIs for efficient querying
- **S3**: Buckets for storing project briefs and task outputs
- **Bedrock**: Claude 3 Sonnet for AI-powered analysis and task execution
- **EventBridge**: Event-driven orchestration connecting all components
- **API Gateway**: REST API for frontend communication
- **Cognito**: User authentication and authorization

**Frontend:**
- React application with real-time Kanban board
- AWS Amplify for authentication
- Polling-based updates (5-second intervals)

### Development Journey

**Phase 1: Brief Processing (Week 1)**

I started with the core problem: turning unstructured text into structured tasks. The brief processor Lambda uses Claude 3 Sonnet to analyze project briefs and extract:
- Deliverables (what needs to be built)
- Requirements (functional and non-functional)
- Constraints (timeline, budget, technical)
- Success criteria (definition of done)

This structured analysis becomes the foundation for everything else.

**Phase 2: Task Generation (Week 1-2)**

The task generator takes the analysis and creates atomic tasks. I spent time tuning the prompts to ensure tasks are:
- Small enough to complete independently
- Clear about what "done" looks like
- Properly categorized (RESEARCH, DESIGN, DEVELOPMENT, etc.)
- Marked with complexity levels

The dependency identification was tricky. I use a second AI call to analyze task relationships and build a dependency graph. This ensures work happens in the right order.

**Phase 3: Intelligent Routing (Week 2)**

The routing logic decides AI vs Human for each task. I built a rule-based system that considers:
- Explicit human judgment flags from task generation
- Complexity levels (HIGH → Human)
- Task categories (DESIGN, RESEARCH → Human)
- Keywords suggesting decision-making or creativity

This routing is conservative - when in doubt, route to humans. Better to have human oversight than AI making high-stakes decisions.

**Phase 4: AI Execution (Week 2-3)**

The AI executor is where the magic happens. For AI-assigned tasks, it:
1. Gathers context from the project brief and previous task outputs (RAG)
2. Constructs a detailed prompt with task requirements and context
3. Executes using Claude 3 Sonnet
4. Stores the output in S3
5. Moves the task to REVIEW status

I implemented retry logic and error handling to make this robust.

**Phase 5: Review Loop (Week 3)**

The review system allows humans to approve or reject task outputs. Rejected tasks go back to QUEUED with feedback, creating an improvement loop. This ensures quality while maintaining automation.

**Phase 6: Frontend Dashboard (Week 3-4)**

The React frontend provides:
- Project creation with brief upload
- Live Kanban board with 5 columns (Queued, In Progress, Review, Done, Failed)
- Task detail modals for reviewing and completing work
- Project statistics showing progress and AI/Human distribution
- Real-time updates via polling

I kept the UI minimal and focused on the information that matters.

### Key Technical Decisions

**Why EventBridge over Step Functions?**
EventBridge gives me loose coupling between components. Each Lambda can evolve independently, and I can add new event handlers without changing existing code.

**Why polling over WebSockets?**
Simpler to implement and debug. For a project management tool, 5-second latency is acceptable. WebSockets would add complexity without meaningful UX improvement.

**Why DynamoDB over RDS?**
Serverless-native, scales automatically, and fits the Free Tier perfectly. The access patterns (query by project, query by status) map well to DynamoDB's key-value model with GSIs.

**Why Claude 3 Sonnet?**
Best balance of capability and cost. Haiku is cheaper but struggles with complex analysis. Opus is overkill for this use case.

### Challenges and Solutions

**Challenge 1: Bedrock Rate Limits**
Early testing hit rate limits quickly. I added exponential backoff and request queuing to handle this gracefully.

**Challenge 2: Task Dependency Complexity**
Initial dependency detection was unreliable. I improved it by having the AI explain its reasoning, then parsing both the dependencies and the explanations.

**Challenge 3: Context Window Management**
Large project briefs + multiple task outputs can exceed context windows. I implemented smart truncation that keeps the most relevant information.

**Challenge 4: Cold Start Latency**
Lambda cold starts were noticeable. I increased memory allocation (more CPU = faster cold starts) and implemented connection pooling for DynamoDB.

## Demo

### Screenshots

**Dashboard View:**
![Dashboard showing multiple projects](./docs/dashboard.png)

**Project Creation:**
![Upload project brief interface](./docs/new-project.png)

**Live Kanban Board:**
![Kanban board with tasks in different stages](./docs/kanban-board.png)

**Task Detail Modal:**
![Task details with review options](./docs/task-modal.png)

**Project Statistics:**
![Real-time project stats](./docs/project-stats.png)

### Video Demo

[Watch the 4-minute demo video](https://youtube.com/your-demo-video)

The demo shows:
1. Creating a new project from a brief
2. Watching tasks generate automatically
3. Seeing AI vs Human routing decisions
4. AI executing a task with context
5. Reviewing and approving task outputs
6. Tracking progress on the Kanban board

## What I Learned

### Technical Insights

**1. Event-Driven Architecture is Powerful**
EventBridge made the system incredibly flexible. I could add new features by creating new event handlers without touching existing code. This loose coupling is perfect for evolving systems.

**2. AI Prompt Engineering is Critical**
I spent 30% of development time tuning prompts. Small changes in wording dramatically affected output quality. The key was being specific about format, constraints, and examples.

**3. Serverless Has Real Benefits**
Zero infrastructure management meant I could focus entirely on business logic. The pay-per-use model is perfect for variable workloads. Cold starts are manageable with proper configuration.

**4. RAG Makes AI Practical**
Injecting relevant context into each task execution made AI outputs dramatically better. Without context, AI would hallucinate or produce generic responses. With context, it produces specific, actionable work.

**5. Human-in-the-Loop is Essential**
Pure automation isn't the goal. The best results come from AI handling structured work while humans focus on judgment and creativity. The routing logic is the key to making this work.

### Development Process Insights

**1. Start with the Core Loop**
I built brief → tasks → execution → review first, then added features. This kept me focused on delivering value rather than building infrastructure.

**2. Test with Real Briefs**
Using actual project briefs from past work revealed edge cases I never would have found with toy examples. Real data is essential for AI systems.

**3. Observability from Day One**
CloudWatch Logs saved me countless hours. I logged every decision point, making debugging straightforward even in a distributed system.

**4. Free Tier is Generous**
I ran hundreds of test executions and never hit Free Tier limits. AWS's free tier is genuinely useful for building and testing.

### Product Insights

**1. Visibility Drives Trust**
The live Kanban board isn't just useful - it's essential for trust. Users need to see what's happening to trust the automation.

**2. Routing Transparency Matters**
Showing why each task was routed to AI or Human helps users understand and trust the system's decisions.

**3. Review Loops Enable Quality**
The ability to reject and improve task outputs makes users comfortable with AI execution. It's not "AI does everything" - it's "AI does the first pass, humans ensure quality."

**4. Context is Everything**
Users care less about the technology and more about whether tasks have the right information. The RAG system is invisible but critical.

### What I'd Do Differently

**1. Add WebSocket Support Earlier**
While polling works, real-time updates would improve the UX. I'd add this for production.

**2. Implement Better Dependency Visualization**
The dependency graph exists in data but isn't visualized. A graph view would help users understand task relationships.

**3. Add Task Templates**
Common project types (web app, research project, etc.) could have templates that speed up task generation.

**4. Build Better Analytics**
Track which tasks take longest, which get rejected most, AI vs Human performance, etc. This data would improve routing over time.

**5. Implement Skill-Based Human Routing**
Right now, human tasks go to a generic pool. Routing based on skills (frontend dev, designer, etc.) would be more efficient.

### Key Takeaways

1. **AI + Humans > AI Alone**: The best systems augment human capabilities rather than replace them
2. **Serverless Enables Rapid Development**: Focus on logic, not infrastructure
3. **Event-Driven Architecture Scales**: Both technically and organizationally
4. **Context is the Killer Feature**: RAG transforms AI from generic to specific
5. **Visibility Builds Trust**: Show users what's happening and why

---

**Tags:** #aideas-2025 #workplace-efficiency #NAMER

**GitHub Repository:** [github.com/yourusername/agentflow](https://github.com/yourusername/agentflow)

**Live Demo:** [agentflow-demo.com](https://agentflow-demo.com)
