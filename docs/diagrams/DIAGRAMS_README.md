# Architecture Diagrams

## Generated Diagrams

All diagrams are located in: `generated-diagrams/`

### 1. Complete MCP Integration Architecture
**File**: `voice-to-sap-mcp-architecture.png`

Shows the complete Voice-to-SAP system with MCP integration:
- Input layer (S3, EventBridge)
- Event processing (Step Functions)
- AI processing (Transcribe, Bedrock)
- Business logic (Lambda functions)
- **MCP Layer (NEW)** - Highlighted in orange
  - Cognito Authentication
  - AgentCore Runtime
  - MCP Server Container
- SAP S/4HANA target system

**MCP components are highlighted with orange arrows**

### 2. Simplified Flow
**File**: `voice-to-sap-simple.png`

A simplified view showing the high-level flow:
- Voice → Transcribe → AI → Logic → Auth → MCP → SAP

Perfect for presentations and quick understanding.

### 3. Original Architecture (Before MCP)
**File**: `voice-to-sap-architecture.png`

The original system architecture before MCP integration.

---

## Interactive Diagrams

For interactive, editable diagrams, see:
**File**: `ARCHITECTURE_DIAGRAM.md`

Contains Mermaid diagrams that can be:
- Viewed in GitHub/GitLab
- Edited in VS Code (with Mermaid extension)
- Rendered at https://mermaid.live/

Includes:
- Main architecture diagram
- Sequence diagram (step-by-step flow)
- Component layers
- Data flow example
- Authentication flow
- Deployment architecture

---

## Regenerating Diagrams

To regenerate the diagrams:

```bash
cd /Users/davigad/dev/SAP-Notification-Demo
python3 generate_architecture_diagram.py
```

---

## MCP Server Debug Summary

### Issue Found
The diagram MCP server was experiencing "Transport closed" errors because:
1. The process was stale (running since Monday)
2. Communication protocol had disconnected

### Solution
1. Killed the stale MCP server process
2. Created standalone Python script to generate diagrams
3. Successfully generated all architecture diagrams

### MCP Server Status
- **Status**: Needs restart by IDE/client
- **Process**: Was killed and needs to be restarted
- **Workaround**: Use `generate_architecture_diagram.py` script

To restart the MCP server, restart your IDE or the MCP client that manages it.

---

## Viewing Diagrams

### Option 1: Open in Finder
```bash
open generated-diagrams/
```

### Option 2: Open specific diagram
```bash
open generated-diagrams/voice-to-sap-mcp-architecture.png
```

### Option 3: View in VS Code
```bash
code generated-diagrams/voice-to-sap-mcp-architecture.png
```

---

**Created**: December 6, 2025  
**Last Updated**: December 6, 2025 22:09
