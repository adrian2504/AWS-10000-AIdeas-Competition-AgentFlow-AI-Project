# AgentFlow Testing Guide

This guide helps you test AgentFlow end-to-end after deployment.

## Prerequisites

- Backend deployed to AWS
- Frontend configured with API endpoints
- Cognito User Pool created
- Bedrock access enabled

## Test 1: User Authentication

### Sign Up
1. Open the frontend application
2. Click "Sign Up"
3. Enter email, password, and name
4. Check email for verification code
5. Enter verification code
6. Verify successful account creation

**Expected Result:** User is created and can sign in

### Sign In
1. Enter email and password
2. Click "Sign In"
3. Verify redirect to dashboard

**Expected Result:** User is authenticated and sees empty dashboard

## Test 2: Project Creation

### Create Project from Brief
1. Click "New Project" button
2. Enter project name: "Test E-Commerce Website"
3. Paste the example brief (see below)
4. Click "Create Project"
5. Verify redirect to project view

**Expected Result:** 
- Project is created
- Brief is stored in S3
- Brief processor Lambda is triggered
- User sees loading state

### Example Brief

```
Project: E-Commerce Website for Local Artisans

Overview:
Build a web platform where local artisans can sell their handmade products directly to customers. The platform should support product listings, shopping cart, checkout, and order management.

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

## Test 3: Task Generation

### Verify Task Generation
1. Wait 30-60 seconds after project creation
2. Refresh the project view
3. Verify tasks appear in the Kanban board

**Expected Result:**
- 8-15 tasks generated
- Tasks appear in "Queued" column
- Each task has title, description, category
- Tasks show AI or Human assignment

### Check Task Quality
1. Click on several tasks
2. Verify each task has:
   - Clear title
   - Detailed description
   - Acceptance criteria
   - Complexity level (LOW/MEDIUM/HIGH)
   - Category (RESEARCH/DESIGN/DEVELOPMENT/etc.)
   - Assignment type (AI/HUMAN)
   - Routing reason

**Expected Result:** Tasks are atomic, actionable, and well-defined

## Test 4: Task Routing

### Verify Routing Logic
1. Check the distribution of AI vs Human tasks
2. Verify high-complexity tasks go to humans
3. Verify design/research tasks go to humans
4. Verify development tasks go to AI

**Expected Result:**
- Intelligent routing based on task characteristics
- Clear routing reasons displayed
- Mix of AI and human assignments

## Test 5: AI Task Execution

### Watch AI Execute Tasks
1. Wait for AI-assigned tasks to move to "In Progress"
2. Monitor task status changes
3. Wait for tasks to move to "Review"
4. Click on completed tasks to see outputs

**Expected Result:**
- AI tasks execute automatically
- Tasks move through statuses: QUEUED → IN_PROGRESS → REVIEW
- Task outputs are relevant and detailed
- Outputs reference project context

### Verify Context Injection (RAG)
1. Check AI task outputs
2. Verify outputs reference the original brief
3. Verify outputs are specific to the project

**Expected Result:** AI outputs show understanding of project context

## Test 6: Human Task Completion

### Complete a Human Task
1. Find a task assigned to "Human"
2. Click on the task
3. Enter output in the text area
4. Add optional notes
5. Click "Submit for Review"

**Expected Result:**
- Task moves to "Review" status
- Output is saved
- Task appears in Review column

## Test 7: Task Review

### Approve a Task
1. Click on a task in "Review" status
2. Click "Approve" button
3. Verify task moves to "Done"

**Expected Result:**
- Task status changes to DONE
- Task appears in Done column
- Completion timestamp is recorded

### Reject a Task
1. Click on a task in "Review" status
2. Enter feedback in the text area
3. Click "Request Changes"
4. Verify task moves back to "Queued"

**Expected Result:**
- Task status changes to QUEUED
- Feedback is saved
- Task can be re-executed with feedback

## Test 8: Dashboard and Statistics

### Verify Project Statistics
1. Check the statistics bar at the top
2. Verify counts for:
   - Total tasks
   - Completion percentage
   - In Progress count
   - Review count
   - AI tasks count
   - Human tasks count

**Expected Result:** All statistics are accurate and update in real-time

### Verify Real-Time Updates
1. Keep the project view open
2. Wait for task status changes
3. Verify board updates automatically (5-second polling)

**Expected Result:** Board refreshes and shows latest task statuses

## Test 9: Multiple Projects

### Create Second Project
1. Return to dashboard
2. Create another project with different brief
3. Verify both projects appear on dashboard
4. Switch between projects

**Expected Result:**
- Multiple projects work independently
- Each project has its own task flow
- Dashboard shows all projects

## Test 10: Error Handling

### Test Invalid Brief
1. Create project with very short brief (< 50 characters)
2. Verify system handles gracefully

### Test Network Issues
1. Disconnect internet briefly
2. Try to load tasks
3. Verify error message appears

**Expected Result:** Errors are handled gracefully with user-friendly messages

## Performance Testing

### Check Lambda Cold Starts
1. Wait 15 minutes (Lambda cold start)
2. Create new project
3. Measure time to first task generation

**Expected Result:** Cold start < 10 seconds

### Check Task Generation Speed
1. Create project with detailed brief
2. Measure time from creation to tasks appearing

**Expected Result:** Tasks generated within 60 seconds

### Check AI Execution Speed
1. Monitor AI task execution time
2. Measure time from QUEUED to REVIEW

**Expected Result:** Simple tasks complete within 30-60 seconds

## AWS Console Verification

### Check DynamoDB
1. Open DynamoDB console
2. Check AgentFlow-Projects table
3. Verify project records exist
4. Check AgentFlow-Tasks table
5. Verify task records exist

### Check S3
1. Open S3 console
2. Check agentflow-briefs bucket
3. Verify brief files are stored
4. Check agentflow-outputs bucket
5. Verify task outputs are stored

### Check CloudWatch Logs
1. Open CloudWatch console
2. Check logs for each Lambda function
3. Verify no errors
4. Check execution times

### Check EventBridge
1. Open EventBridge console
2. Check event bus
3. Verify events are being published
4. Check rule invocations

## Cost Monitoring

### Check AWS Costs
1. Open AWS Cost Explorer
2. Filter by service
3. Verify costs are within Free Tier

**Expected Services:**
- Lambda: < 1M requests
- DynamoDB: < 25 RCU/WCU
- S3: < 5GB storage
- Bedrock: Pay per use (monitor closely)

## Troubleshooting

### Tasks Not Generating
- Check CloudWatch logs for brief-processor Lambda
- Verify EventBridge rule is enabled
- Check Bedrock permissions

### AI Tasks Not Executing
- Check CloudWatch logs for ai-executor Lambda
- Verify Bedrock model access is enabled
- Check S3 permissions for context retrieval

### Frontend Not Loading
- Verify .env configuration
- Check API Gateway endpoint
- Verify Cognito configuration
- Check browser console for errors

### Authentication Issues
- Verify Cognito User Pool is active
- Check user pool client configuration
- Verify email verification is working

## Success Criteria

All tests pass if:
- ✅ Users can sign up and sign in
- ✅ Projects are created from briefs
- ✅ Tasks are generated automatically
- ✅ Tasks are routed intelligently
- ✅ AI executes tasks with context
- ✅ Humans can complete tasks
- ✅ Review loop works correctly
- ✅ Dashboard shows real-time updates
- ✅ Multiple projects work independently
- ✅ Errors are handled gracefully
- ✅ Costs stay within Free Tier

## Reporting Issues

If you encounter issues:
1. Check CloudWatch Logs
2. Verify AWS service quotas
3. Check IAM permissions
4. Review EventBridge rules
5. Verify Bedrock access

Document:
- What you were doing
- Expected behavior
- Actual behavior
- Error messages
- CloudWatch log excerpts
