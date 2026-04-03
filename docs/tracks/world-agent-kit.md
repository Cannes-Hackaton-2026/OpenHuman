# World - Best Use of Agent Kit ($8,000)

## Track Overview

**Prize Pool:** $8,000 (1st: $4,000 / 2nd: $2,500 / 3rd: $1,500)

**Goal:** Build apps that use AgentKit to ship agentic experiences where World ID improves safety, fairness, or trust.

**Key Requirement:** Submissions must integrate World's Agent Kit to meaningfully distinguish human-backed agents from bots or automated scripts. Using only World ID or MiniKit without the Agent Kit layer **will not qualify**.

---

## What is Agent Kit?

AgentKit (Beta) is an extension framework built on top of the **x402 protocol** that enables websites and APIs to accept agentic traffic while filtering malicious actors. It distinguishes **human-backed agents from bots and scripts**, allowing legitimate agent-driven access to API endpoints while blocking spam.

### Core Architecture

```
Agent (with wallet) --> HTTP Request --> Server (x402 middleware)
                                              |
                                     AgentBook Verification
                                     (is this a registered human?)
                                              |
                                    Free trial / Paid access
                                              |
                                     Protected Resource
```

### Key Components

| Component | Role |
|-----------|------|
| **x402 Protocol** | HTTP-native payment standard (HTTP 402 Payment Required) |
| **AgentBook** | On-chain registry mapping wallet addresses to anonymous human identifiers |
| **Agent Registration** | CLI-driven process using World App verification |
| **Payment Middleware** | Server-side middleware validating payments and agent status |

---

## x402 Protocol Explained

x402 is an open standard for internet-native payments built into HTTP:

1. Agent sends an HTTP request to a protected endpoint
2. Server responds with **HTTP 402** (Payment Required) if no payment attached
3. Agent pays instantly with stablecoins (USDC)
4. Access granted - no API keys required

**Key properties:**
- Zero protocol fees (only network gas fees)
- Instant transactions
- No account creation required
- Decentralized and network-agnostic
- Works with AI agents autonomously (no human checkout flow)

---

## Prerequisites

1. **Developer Portal Account**: Go to [developer.world.org](https://developer.world.org) and create an app
2. **World App**: Required for agent registration (human verification)
3. **Node.js 18+**
4. **A wallet address** for your agent (EVM-compatible)

---

## Installation

```bash
npm install @worldcoin/agentkit
```

For the CLI (agent registration):
```bash
npx @worldcoin/agentkit-cli register <agent-address>
```

For skill integration (agent-side):
```bash
npx skills add worldcoin/agentkit agentkit-x402
```

---

## Integration Guide

### Step 1: Register Your Agent

The registration process links a wallet address to a human identity through World App:

```bash
npx @worldcoin/agentkit-cli register 0xYourAgentWalletAddress
```

This process:
1. Queries the next nonce for the agent address
2. Initiates World App verification (ZK proof of human)
3. Submits registration transaction to AgentBook on Worldchain

### Step 2: Server-Side Implementation (Hono)

```typescript
import { Hono } from "hono";
import { HTTPFacilitatorClient } from "@x402/core/http";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { paymentMiddlewareFromHTTPServer, resourceServer } from "@x402/hono";
import { createAgentkitHooks, InMemoryAgentKitStorage, AgentBook } from "@worldcoin/agentkit";

const app = new Hono();

// Initialize AgentBook (default: Worldchain)
const agentBook = new AgentBook();

// Storage for tracking usage and nonces
const storage = new InMemoryAgentKitStorage(); // Use DB in production!

// Create hooks for agent verification
const hooks = createAgentkitHooks({
  agentBook,
  storage,
  mode: { type: "free-trial", uses: 3 }, // 3 free requests for verified humans
});

// Network configuration
const WORLDCHAIN = "eip155:480";
const BASE = "eip155:8453";
const WORLD_USDC = "0x79A02482A880bCE3F13e09Da970dC34db4CD24d1";

// Define protected routes
const routes = {
  "GET /api/data": {
    accepts: [
      {
        scheme: "exact",
        network: WORLDCHAIN,
        maxAmountRequired: "10000", // $0.01 in USDC (6 decimals)
        resource: WORLD_USDC,
      },
      {
        scheme: "exact",
        network: BASE,
        maxAmountRequired: "10000",
        resource: WORLD_USDC,
      },
    ],
    extensions: {
      agentkit: {
        statement: "Access to protected data",
        mode: hooks,
      },
    },
  },
};

// Apply payment middleware
app.use(
  paymentMiddlewareFromHTTPServer(
    resourceServer(routes),
    new HTTPFacilitatorClient(),
    [new ExactEvmScheme()],
  )
);

// Your protected endpoint
app.get("/api/data", (c) => {
  return c.json({ message: "You have access!" });
});

export default app;
```

### Step 3: Storage Interface (Production)

Replace `InMemoryAgentKitStorage` with a persistent implementation:

```typescript
interface AgentKitStorage {
  // Track how many requests a human has made per endpoint
  getUsageCount(humanId: string, endpoint: string): Promise<number>;
  incrementUsage(humanId: string, endpoint: string): Promise<void>;

  // Prevent replay attacks
  hasUsedNonce(nonce: string): Promise<boolean>;
  recordNonce(nonce: string): Promise<void>;
}
```

**PostgreSQL example:**

```sql
CREATE TABLE agent_usage (
  human_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  usage_count INTEGER DEFAULT 0,
  PRIMARY KEY (human_id, endpoint)
);

CREATE TABLE agent_nonces (
  nonce TEXT PRIMARY KEY,
  used_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Modes

### Free-Trial Mode
Registered human-backed agents get N free requests before payment kicks in:

```typescript
createAgentkitHooks({
  agentBook,
  storage,
  mode: { type: "free-trial", uses: 3 },
});
```

### Discount Mode
Verified agents pay a reduced rate:

```typescript
createAgentkitHooks({
  agentBook,
  storage,
  mode: { type: "discount", factor: 0.5 }, // 50% discount
});
```

---

## Supported Networks

| Network | Chain ID | USDC Address |
|---------|----------|--------------|
| Worldchain | `eip155:480` | `0x79A02482A880bCE3F13e09Da970dC34db4CD24d1` |
| Base | `eip155:8453` | Standard USDC address |

---

## Request Flow Diagram

```
1. Agent sends HTTP request to /api/data
2. Middleware intercepts:
   a. Is there a payment header?
      - No → Return HTTP 402 with payment requirements
      - Yes → Validate payment
   b. Is the agent registered in AgentBook?
      - Yes → Check usage count (free trial mode)
        - Under limit → Grant free access
        - Over limit → Require payment
      - No → Require full payment
3. AgentBook resolves wallet → anonymous human identifier
4. Usage counter incremented
5. Resource served
```

---

## Best Practices

### Architecture

1. **Always use persistent storage in production** - `InMemoryAgentKitStorage` loses state on restart
2. **Deploy on Worldchain** for lowest latency with AgentBook lookups
3. **Support multiple networks** (Worldchain + Base) to maximize agent compatibility
4. **Implement nonce deduplication** to prevent replay attacks

### Security

1. **Never expose signing keys client-side**
2. **Validate all payments server-side** through the facilitator
3. **Track nonces** to prevent replay of payment proofs
4. **Rate limit** even beyond AgentKit's built-in mechanisms
5. **Use HTTPS** for all endpoints

### Design Patterns

1. **Tiered Access**: Free tier for verified humans, paid tier for unverified agents
2. **Per-Endpoint Pricing**: Different prices for different API resources
3. **Agent Reputation**: Track usage patterns per human identifier
4. **Graceful Degradation**: If AgentBook is unreachable, fall back to payment-only mode

### What Judges Want to See

1. **Meaningful AgentKit integration** - not just a wrapper around World ID
2. **Clear distinction** between human-backed agents and bots
3. **Real agentic workflows** - agents performing tasks autonomously
4. **Safety/fairness/trust** improvements through human verification
5. **Working demo** with actual AgentBook registration

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Using only World ID without AgentKit | You MUST use AgentKit layer to qualify |
| Using InMemoryStorage in production | Implement persistent database storage |
| Not handling the 402 flow on agent side | Use `skills add` to add x402 awareness |
| Hardcoding single network support | Support both Worldchain and Base |
| Skipping nonce validation | Always check and record nonces |
| Not registering agent wallet | Run `npx @worldcoin/agentkit-cli register` |

---

## Project Ideas for This Track

1. **AI Agent Marketplace** - Agents offer services (data analysis, content generation) with AgentKit ensuring each agent is human-backed
2. **Anti-Spam API Gateway** - Protect APIs from bot floods while giving free access to verified human agents
3. **Fair Resource Allocation** - Distribute limited resources (compute, API calls) fairly among human-verified agents
4. **Trust-Scored Agent Network** - Build reputation based on verified human identity + usage patterns
5. **Agentic Workflow Platform** - Chain multiple human-verified agents together for complex tasks

---

## Useful Links

| Resource | URL |
|----------|-----|
| Agent Kit Docs | https://docs.world.org/agents/agent-kit/integrate |
| World Docs | https://docs.world.org/ |
| x402 Protocol | https://www.x402.org/ |
| Developer Portal | https://developer.world.org |
| npm Package | `@worldcoin/agentkit` |
