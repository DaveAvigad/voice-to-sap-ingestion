# Voice-to-SAP MCP Integration Architecture

## Architecture Diagram

```mermaid
graph LR
    A[Voice Call Recording] --> B[S3 Bucket<br/>Voice Files]
    B --> C[EventBridge<br/>Rule]
    C --> D[Step Functions<br/>State Machine]
    
    D --> E[AWS Transcribe<br/>Voice to Text]
    E --> F[Amazon Bedrock<br/>Sentiment Analysis]
    F --> G[Lambda<br/>Severity Assignment]
    G --> H[Amazon Bedrock<br/>Summary Generation]
    H --> I[Lambda<br/>SAP Integration]
    
    I --> J[Cognito<br/>Authentication]
    J --> K[AgentCore Runtime<br/>Bedrock]
    K --> L[MCP Server<br/>Container]
    L --> M[SAP S/4HANA<br/>System]
    
    I --> N[S3 Bucket<br/>Results]
    
    style I fill:#ff9900,stroke:#232f3e,stroke-width:3px
    style J fill:#ff9900,stroke:#232f3e,stroke-width:3px
    style K fill:#ff9900,stroke:#232f3e,stroke-width:3px
    style L fill:#ff9900,stroke:#232f3e,stroke-width:3px
    style M fill:#0066cc,stroke:#232f3e,stroke-width:3px
```

## Detailed Flow Diagram

```mermaid
sequenceDiagram
    participant Voice as Voice Call
    participant S3 as S3 Input
    participant EB as EventBridge
    participant SF as Step Functions
    participant Trans as Transcribe
    participant BR1 as Bedrock (Sentiment)
    participant L1 as Lambda (Severity)
    participant BR2 as Bedrock (Summary)
    participant L2 as Lambda (SAP)
    participant Cog as Cognito
    participant AC as AgentCore
    participant MCP as MCP Server
    participant SAP as SAP System
    
    Voice->>S3: Upload Recording
    S3->>EB: S3 Event
    EB->>SF: Trigger Execution
    SF->>Trans: Start Transcription
    Trans-->>SF: Return Text
    SF->>BR1: Analyze Sentiment
    BR1-->>SF: Sentiment + Intensity
    SF->>L1: Assign Severity
    L1-->>SF: Severity Level
    SF->>BR2: Generate Summary
    BR2-->>SF: Summary Text
    SF->>L2: Create SAP Incident
    L2->>Cog: Request Token
    Cog-->>L2: Access Token
    L2->>AC: Invoke MCP (with token)
    AC->>MCP: Execute Tool
    MCP->>SAP: Create Incident (OData)
    SAP-->>MCP: Incident Created
    MCP-->>AC: Success Response
    AC-->>L2: Result
    L2-->>SF: Complete
```

## Component Layers

```mermaid
graph TB
    subgraph "Input Layer"
        A[Voice Recording]
        B[S3 Bucket]
    end
    
    subgraph "Event Processing Layer"
        C[EventBridge]
        D[Step Functions]
    end
    
    subgraph "AI Processing Layer"
        E[AWS Transcribe]
        F[Bedrock Sentiment]
        G[Bedrock Summary]
    end
    
    subgraph "Business Logic Layer"
        H[Lambda Severity]
        I[Lambda SAP Integration]
    end
    
    subgraph "MCP Integration Layer (NEW)"
        J[Cognito Auth]
        K[AgentCore Runtime]
        L[MCP Server]
    end
    
    subgraph "Target System"
        M[SAP S/4HANA]
    end
    
    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> H
    H --> G
    G --> I
    I --> J
    J --> K
    K --> L
    L --> M
    
    style I fill:#ff9900
    style J fill:#ff9900
    style K fill:#ff9900
    style L fill:#ff9900
    style M fill:#0066cc
```

## Data Flow Example

```mermaid
graph TD
    A[Voice File: road-emergency-call.mp3] --> B[Transcription]
    B --> C["Text: I need help, my car broke down..."]
    C --> D[Sentiment Analysis]
    D --> E["Sentiment: URGENT<br/>Intensity: 8"]
    E --> F[Severity Assignment]
    F --> G["Severity: HIGH"]
    G --> H[Summary Generation]
    H --> I["Summary: Emergency roadside<br/>assistance needed on Highway 101"]
    I --> J[SAP Integration]
    J --> K[MCP Server]
    K --> L["SAP Incident Created<br/>INC-2025-001234"]
    
    style J fill:#ff9900
    style K fill:#ff9900
    style L fill:#0066cc
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant L as Lambda (SAP Integration)
    participant C as Cognito Token Endpoint
    participant A as AgentCore Runtime
    participant M as MCP Server
    participant S as SAP System
    
    Note over L,S: Inbound Authentication (Lambda → MCP)
    L->>C: POST /oauth2/token<br/>(client_credentials)
    C-->>L: Access Token (JWT)
    L->>A: POST /invocations<br/>Authorization: Bearer {token}
    A->>A: Validate Token
    
    Note over L,S: Outbound Authentication (MCP → SAP)
    A->>M: Invoke MCP Tool
    M->>S: OData API Call<br/>Authorization: Basic {credentials}
    S-->>M: Response
    M-->>A: Result
    A-->>L: Success
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "AWS Account: 392191936983"
        subgraph "Region: us-east-1"
            S3[S3 Buckets]
            EB[EventBridge]
            SF[Step Functions]
            L1[Lambda Functions]
            
            subgraph "Bedrock Services"
                BR[Bedrock Models]
                AC[AgentCore Runtime]
            end
            
            subgraph "Security"
                COG[Cognito User Pool]
                IAM[IAM Roles]
            end
        end
    end
    
    subgraph "External"
        SAP[SAP S/4HANA<br/>dielom-sb2.demos.sap.aws.dev]
    end
    
    S3 --> EB
    EB --> SF
    SF --> L1
    L1 --> BR
    L1 --> COG
    COG --> AC
    AC --> SAP
    IAM -.-> L1
    IAM -.-> AC
```

---

## How to View These Diagrams

### Option 1: GitHub/GitLab
If you push this to GitHub or GitLab, the Mermaid diagrams will render automatically.

### Option 2: VS Code
Install the "Markdown Preview Mermaid Support" extension and preview this file.

### Option 3: Online Viewer
Copy the Mermaid code and paste it into: https://mermaid.live/

### Option 4: Export as Image
Use the Mermaid CLI:
```bash
npm install -g @mermaid-js/mermaid-cli
mmdc -i ARCHITECTURE_DIAGRAM.md -o architecture.png
```

---

## Legend

- 🟧 Orange boxes = New MCP components
- 🔵 Blue boxes = SAP System
- ⚫ Black boxes = Existing AWS components

---

**Created**: December 6, 2025  
**Status**: Ready for Deployment
