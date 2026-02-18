# AgentFlow - AI Project Co-Pilot

> Transform project briefs into executable task flows with intelligent AI/Human routing

AgentFlow is an AI-powered project management system that automatically breaks down project briefs into atomic tasks, intelligently routes them to AI agents or human experts, and tracks execution through a live Kanban dashboard.

## 🎯 What It Does

1. **Upload a project brief** → AgentFlow analyzes it with AI
2. **Tasks are generated** → 8-15 atomic, actionable tasks with dependencies
3. **Smart routing** → Each task goes to AI or Human based on complexity
4. **Automatic execution** → AI handles structured work, humans handle judgment calls
5. **Live tracking** → Real-time Kanban board shows progress
6. **Quality assurance** → Built-in review loops ensure quality

## ✨ Key Features

- 📄 **Brief Analysis**: AI extracts deliverables, requirements, and constraints
- 🤖 **Task Generation**: Automatic breakdown into atomic tasks
- 🔀 **Intelligent Routing**: AI vs Human based on complexity and risk
- 📚 **Context Injection (RAG)**: Every task gets relevant documentation
- ⚡ **AI Execution**: Automated task completion with Bedrock
- 👥 **Human Interface**: Clean UI for human task completion
- 🔄 **Review Loop**: Approve or reject with feedback
- 📊 **Live Dashboard**: Real-time Kanban board with statistics

## 🏗️ Architecture

### AWS Services
- **Lambda**: 5 serverless functions for processing
- **DynamoDB**: Projects and tasks storage
- **S3**: Brief and output storage
- **Bedrock**: Claude 3 Sonnet for AI
- **EventBridge**: Event-driven orchestration
- **API Gateway**: REST API
- **Cognito**: User authentication

### Tech Stack
- **Backend**: Node.js 18, AWS SDK
- **Frontend**: React 18, AWS Amplify
- **Infrastructure**: AWS CDK
- **AI**: Claude 3 Sonnet via Bedrock

## 🚀 Quick Start

### Prerequisites
- AWS Account with Free Tier
- Node.js 18+
- AWS CLI configured

### 30-Minute Setup

```bash
# 1. Clone and setup
git clone https://github.com/yourusername/agentflow.git
cd agentflow
chmod +x setup.sh
./setup.sh

# 2. Deploy backend
cd backend/infrastructure
cdk bootstrap
npm run deploy

# 3. Configure frontend
cd ../../frontend
# Create .env with CDK outputs
echo "REACT_APP_API_URL=<your-api-url>" > .env
echo "REACT_APP_USER_POOL_ID=<your-pool-id>" >> .env
echo "REACT_APP_USER_POOL_CLIENT_ID=<your-client-id>" >> .env
echo "REACT_APP_AWS_REGION=us-east-1" >> .env

# 4. Run frontend
npm start
```

See [QUICKSTART.md](QUICKSTART.md) for detailed instructions.

## 📖 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Get running in 30 minutes
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Detailed deployment guide
- **[TESTING.md](TESTING.md)** - Comprehensive testing procedures
- **[PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)** - Architecture deep dive
- **[BUILD_SUMMARY.md](BUILD_SUMMARY.md)** - What was built and how
- **[ARTICLE.md](ARTICLE.md)** - Competition article

## 💡 How It Works

```
Project Brief
    ↓
AI Analysis (Bedrock)
    ↓
Task Generation (8-15 tasks)
    ↓
Dependency Mapping
    ↓
Smart Routing (AI vs Human)
    ↓
Execution (Automated + Manual)
    ↓
Review & Approval
    ↓
Done!
```

## 🎨 Screenshots

### Dashboard
![Dashboard](docs/dashboard-preview.png)

### Live Kanban Board
![Kanban Board](docs/kanban-preview.png)

### Task Details
![Task Modal](docs/task-modal-preview.png)

## 💰 Cost

Designed for AWS Free Tier:
- **Lambda**: FREE (under 1M requests/month)
- **DynamoDB**: FREE (under 25GB storage)
- **S3**: FREE (under 5GB storage)
- **API Gateway**: FREE (under 1M requests/month)
- **Bedrock**: ~$5-10/month (pay per use)

**Total: $5-10/month**

## 🧪 Testing

```bash
# Run the test suite
cd backend/infrastructure
npm test

# Test individual components
cd ../lambda/brief-processor
npm test
```

See [TESTING.md](TESTING.md) for comprehensive testing guide.

## 🔒 Security

- ✅ Cognito authentication with email verification
- ✅ API Gateway with JWT authorization
- ✅ S3 encryption at rest
- ✅ DynamoDB encryption at rest
- ✅ IAM roles with least privilege
- ✅ No sensitive data in logs

## 📊 Project Stats

- **5** Lambda functions
- **2** DynamoDB tables
- **2** S3 buckets
- **1** REST API
- **10** React components
- **~6,100** lines of code
- **7** documentation files

## 🎯 Use Cases

- **Product Managers**: Automate ticket creation and assignment
- **Startup Founders**: Run fast with small teams
- **Engineering Teams**: Clear requirements and context
- **Research Teams**: Manage complex multi-phase projects

## 🚧 Roadmap

### Phase 2
- WebSocket support for real-time updates
- Dependency graph visualization
- Task templates for common projects
- Analytics dashboard

### Phase 3
- Multi-tenant workspaces
- Slack/GitHub integrations
- Custom workflows
- Advanced RAG with vector embeddings

See [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) for full roadmap.

## 🤝 Contributing

This project was built for the AWS AIdeas Competition 2025. Contributions welcome after the competition!

## 📝 License

MIT License - see LICENSE file for details

## 🏆 Competition

Built for **AWS AIdeas Competition 2025**
- **Category**: Workplace Efficiency
- **Region**: NAMER
- **Tags**: #aideas-2025 #workplace-efficiency #NAMER

## 📧 Contact

- **GitHub**: [yourusername](https://github.com/yourusername)
- **Email**: your.email@example.com
- **Demo**: [Video walkthrough](https://youtube.com/your-demo)

---

Built with ❤️ using AWS, React, and Claude 3 Sonnet
