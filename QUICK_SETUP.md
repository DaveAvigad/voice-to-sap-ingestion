# Quick Setup Guide for Team Members

## 🚀 Getting Started (5 Minutes)

### 1. Clone Repository
```bash
git clone <repository-url>
cd SAP-Notification-Demo
```

### 2. Setup Environment
```bash
# Copy template
cp env.example env

# Edit with your credentials
nano env  # or use your preferred editor
```

**Required in `env` file:**
- `AWS_ACCOUNT_ID` - Your AWS account
- `SAP_BASE_URL` - SAP system URL
- `USERNAME` and `PASSWORD` - SAP credentials

### 3. Install Dependencies
```bash
cd infrastructure
npm install
```

### 4. Deploy (After MCP Setup)
```bash
npx cdk bootstrap  # First time only
npx cdk deploy
```

## 📚 Documentation

- **Main Guide**: `docs/guides/MCP_DEPLOYMENT_GUIDE.md`
- **Architecture**: `docs/diagrams/`
- **Contributing**: `CONTRIBUTING.md`

## 🔑 Key Files

| File | Purpose |
|------|---------|
| `env` | Your credentials (DO NOT COMMIT) |
| `env.example` | Template (safe to commit) |
| `README.md` | Full documentation |
| `docs/guides/` | Step-by-step guides |

## ⚠️ Important

- **Never commit** the `env` file
- **Always use** `env.example` as template
- **Check** `.gitignore` before committing

## 🆘 Need Help?

1. Check `docs/guides/MCP_DEPLOYMENT_GUIDE.md`
2. Review `CONTRIBUTING.md`
3. Ask team lead
4. Create GitHub issue

## 🎯 Next Steps

1. Request AWS account allowlisting (see `docs/guides/ALLOWLIST_REQUEST.md`)
2. Deploy MCP server (see deployment guide)
3. Test the system
4. Start developing!

---

**Questions?** See full documentation in `README.md`
