#!/bin/bash
set -e

echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║                   Git Commit Preparation                                   ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
echo ""

# Check if we're in the right directory
if [ ! -f "README.md" ]; then
    echo "❌ Error: Not in SAP-Notification-Demo directory"
    exit 1
fi

# Check git status
echo "📊 Current Git Status:"
echo "────────────────────────────────────────────────────────────────────────────"
git status --short
echo ""

# Verify no sensitive files
echo "🔐 Verifying no sensitive files..."
if git status --short | grep -E "^[AM].*env$" | grep -v "env.example"; then
    echo "❌ Error: env file is staged! This contains credentials."
    echo "Run: git reset HEAD env"
    exit 1
fi
echo "✅ No sensitive files staged"
echo ""

# Show what will be committed
echo "📝 Files to be committed:"
echo "────────────────────────────────────────────────────────────────────────────"
git diff --cached --name-status 2>/dev/null || git status --short
echo ""

# Confirm
read -p "🤔 Ready to commit? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Commit cancelled"
    exit 1
fi

# Stage all files
echo "📦 Staging files..."
git add .
git reset HEAD env 2>/dev/null || true
git reset HEAD env.backup.local 2>/dev/null || true
git reset HEAD .DS_Store 2>/dev/null || true

# Show final status
echo ""
echo "✅ Files staged:"
git diff --cached --name-status
echo ""

# Commit
echo "💾 Creating commit..."
git commit -m "feat: Add MCP integration with comprehensive documentation

- Add MCP server integration for SAP connectivity
- Organize documentation into docs/ directory
- Add SAP integration Lambda function
- Create deployment guides and checklists
- Add architecture diagrams (3 PNG files)
- Secure sensitive credentials with env.example
- Add contribution guidelines
- Clean up project structure

Components Added:
- infrastructure/lambda/sap-integration.ts - SAP MCP client
- docs/guides/ - Deployment and setup guides
- docs/diagrams/ - Architecture documentation
- docs/scripts/ - Helper scripts
- CONTRIBUTING.md - Team contribution guide
- QUICK_SETUP.md - Quick start for team members

Security:
- All credentials moved to env file (gitignored)
- Created env.example template
- Updated .gitignore
- No sensitive data in repository"

echo ""
echo "✅ Commit created successfully!"
echo ""
echo "🚀 Next steps:"
echo "   1. Review commit: git show"
echo "   2. Push to remote: git push origin main"
echo ""
