# Contributing Guide

## Getting Started

### Prerequisites
- AWS Account with Bedrock access
- Node.js 18+
- Python 3.11+
- AWS CLI configured
- Git

### Initial Setup

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd SAP-Notification-Demo
   ```

2. **Configure Environment**
   ```bash
   cp env.example env
   # Edit env file with your credentials
   ```

3. **Install Dependencies**
   ```bash
   cd infrastructure
   npm install
   ```

## Development Workflow

### 1. Create Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes
- Follow existing code structure
- Update documentation if needed
- Test your changes locally

### 3. Test Changes
```bash
# Build TypeScript
cd infrastructure
npm run build

# Test locally
npm run test:stepfunctions
```

### 4. Commit Changes
```bash
git add .
git commit -m "feat: description of your changes"
```

### 5. Push and Create PR
```bash
git push origin feature/your-feature-name
# Create Pull Request on GitHub
```

## Code Standards

### TypeScript/JavaScript
- Use TypeScript for infrastructure code
- Follow existing naming conventions
- Add JSDoc comments for functions
- Use async/await for asynchronous code

### Python
- Follow PEP 8 style guide
- Use type hints
- Add docstrings for functions

### Documentation
- Update README.md if adding features
- Add comments for complex logic
- Update architecture diagrams if needed

## Project Structure

```
SAP-Notification-Demo/
├── docs/                    # Documentation
│   ├── guides/             # Setup and deployment guides
│   ├── diagrams/           # Architecture diagrams
│   └── scripts/            # Helper scripts
├── infrastructure/          # CDK infrastructure code
│   ├── lib/                # Stack definitions
│   └── lambda/             # Lambda functions
├── test-data/              # Test files
└── generated-diagrams/     # Generated diagrams
```

## Testing

### Unit Tests
```bash
cd infrastructure
npm test
```

### Integration Tests
```bash
npm run test:upload
```

### Manual Testing
1. Deploy to dev environment
2. Upload test voice file
3. Verify SAP incident creation
4. Check CloudWatch logs

## Security

### Never Commit
- Credentials or API keys
- `env` file (use `env.example`)
- AWS account IDs (use placeholders)
- SAP system URLs with credentials

### Always
- Use environment variables
- Follow least privilege principle
- Review security before committing

## Documentation

### When to Update Docs
- Adding new features
- Changing architecture
- Modifying deployment process
- Fixing bugs that affect usage

### Documentation Files
- `README.md` - Main project documentation
- `docs/guides/` - Deployment guides
- `docs/diagrams/` - Architecture documentation
- Code comments - Complex logic

## Deployment

### Development
```bash
npx cdk deploy --profile dev
```

### Production
1. Test in dev environment first
2. Get approval from team lead
3. Deploy during maintenance window
4. Monitor for issues

## Getting Help

- Check `docs/` directory
- Review existing code
- Ask team members
- Create GitHub issue

## Pull Request Guidelines

### PR Title Format
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Test changes

### PR Description
- Describe what changed
- Why the change was needed
- How to test the changes
- Any breaking changes

### Before Submitting
- [ ] Code builds successfully
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No sensitive data committed
- [ ] Follows code standards

## Questions?

Contact the team lead or create a GitHub issue.

---

**Last Updated**: December 6, 2025
