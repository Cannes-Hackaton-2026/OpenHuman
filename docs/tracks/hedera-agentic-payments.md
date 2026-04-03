# Hedera - AI & Agentic Payments ($6,000)

## Track Overview

**Prize Pool:** $6,000 (up to 2 teams receive $3,000 each)

**Goal:** Build AI agents that move value autonomously on Hedera. The agentic economy needs payment infrastructure that works at machine speed.

**Key Requirements:**
1. Build an AI agent or multi-agent system that executes **at least one payment, token transfer, or financial operation** on Hedera Testnet
2. Use one or more of: Hedera Agent Kit, OpenClaw ACP, x402, A2A protocol, or Hedera SDKs
3. Public GitHub repo with README covering setup, architecture, and payment flow
4. Demo video (max 5 minutes) showing autonomous payment actions

---

## Why Hedera for Agentic Payments?

| Feature | Hedera | Why It Matters for Agents |
|---------|--------|---------------------------|
| **Finality** | ~3 seconds | Agents can confirm transactions in near real-time |
| **Throughput** | 10,000+ TPS | Handles high-frequency micropayments |
| **Fees** | Sub-cent, USD-priced | Predictable costs for automated operations |
| **Native Token Service** | No smart contracts needed | Create/transfer tokens with simple SDK calls |
| **Consensus Service** | Built-in messaging | Verifiable audit trails for agent actions |
| **Security** | aBFT (highest grade) | Trustworthy settlement layer |
| **Scheduled Transactions** | Native support | Recurring payments without external cron |

---

## Hedera Agent Kit

The primary tool for this track. An open-source toolkit for building AI agents that interact with Hedera blockchain through natural language.

### Installation

```bash
mkdir hedera-agent-project
cd hedera-agent-project
npm init -y
npm install hedera-agent-kit @langchain/core langchain @langchain/langgraph @langchain/openai @hashgraph/sdk dotenv
```

Add `"type": "module"` to `package.json` for ES modules.

### Environment Setup

```bash
# .env
ACCOUNT_ID="0.0.xxxxx"        # Get from https://portal.hedera.com/dashboard
PRIVATE_KEY="0x..."            # ECDSA private key
OPENAI_API_KEY="sk-proj-..."   # Or use Ollama/Groq for free alternatives
```

**Get a free testnet account:** https://portal.hedera.com/dashboard

### AI Provider Options

| Provider | Cost | Setup |
|----------|------|-------|
| **Ollama** | Free (local) | No API key needed, runs locally |
| **Groq** | Free tier | API key from groq.com |
| **OpenAI** | Paid | `OPENAI_API_KEY` |
| **Claude** | Paid | `ANTHROPIC_API_KEY` |

### Basic Agent Implementation

```javascript
import { Client, PrivateKey } from "@hashgraph/sdk";
import { HederaLangchainToolkit, AgentMode } from "hedera-agent-kit";
import { createAgent } from "langchain";
import { MemorySaver } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  // Initialize Hedera client for testnet
  const client = Client.forTestnet().setOperator(
    process.env.ACCOUNT_ID,
    PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY)
  );

  // Create the toolkit
  const toolkit = new HederaLangchainToolkit({
    client,
    configuration: {
      tools: [],
      plugins: [],
      context: {
        mode: AgentMode.AUTONOMOUS, // Auto-execute transactions
      },
    },
  });

  // Get all available tools
  const tools = toolkit.getTools();

  // Initialize LLM
  const llm = new ChatOpenAI({
    model: "gpt-4o-mini",
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Create the agent
  const agent = createAgent({
    model: llm,
    tools,
    systemPrompt: `You are an AI agent with access to the Hedera blockchain.
    You can transfer HBAR, create tokens, manage topics, and more.
    Always confirm actions before executing them.`,
    checkpointer: new MemorySaver(),
  });

  // Execute a payment
  const response = await agent.invoke(
    { messages: [{ role: "user", content: "Transfer 5 HBAR to account 0.0.1234" }] },
    { configurable: { thread_id: "payment-1" } }
  );

  console.log(response.messages[response.messages.length - 1].content);
}

main().catch(console.error);
```

### Execution Modes

| Mode | Behavior | Use Case |
|------|----------|----------|
| `AgentMode.AUTONOMOUS` | Transactions execute automatically | Fully autonomous agents |
| `AgentMode.RETURN_BYTE` | Returns transaction bytes for external signing | Human-in-the-loop, multi-sig |

### Supported Operations

**Core Account Plugin:**
- Transfer HBAR between accounts

**Core HTS Plugin (Token Service):**
- Create fungible tokens
- Create NFTs
- Execute token airdrops

**Core Consensus Plugin (HCS):**
- Create topics
- Submit messages to topics

**Core Queries Plugin:**
- Account info and HBAR balance
- Token balance queries
- Topic message history

**Third-Party Plugins:**
- SaucerSwap (DEX operations)
- Bonzo (DeFi lending/borrowing)
- Pyth / Chainlink (price feeds)
- CoinCap (HBAR pricing)

---

## Hedera SDK Direct Usage

For more control, use the Hedera SDK directly.

### HBAR Transfer

```javascript
import { Client, PrivateKey, TransferTransaction, Hbar } from "@hashgraph/sdk";

const client = Client.forTestnet().setOperator(
  process.env.ACCOUNT_ID,
  PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY)
);

// Transfer 10 HBAR
const tx = new TransferTransaction()
  .addHbarTransfer(process.env.ACCOUNT_ID, new Hbar(-10)) // sender
  .addHbarTransfer("0.0.recipient", new Hbar(10))          // receiver
  .freezeWith(client);

const signedTx = await tx.sign(PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY));
const response = await signedTx.execute(client);
const receipt = await response.getReceipt(client);

console.log("Transfer status:", receipt.status.toString());
```

### Token Creation (HTS)

```javascript
import { TokenCreateTransaction, Hbar, PrivateKey } from "@hashgraph/sdk";

const adminKey = PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY);

const tx = await new TokenCreateTransaction()
  .setTokenName("Agent Payment Token")
  .setTokenSymbol("APT")
  .setTreasuryAccountId(process.env.ACCOUNT_ID)
  .setInitialSupply(1_000_000)
  .setDecimals(2)
  .setAdminKey(adminKey.publicKey)
  .setSupplyKey(adminKey.publicKey)
  .setMaxTransactionFee(new Hbar(30))
  .freezeWith(client);

const signedTx = await (await tx.sign(adminKey)).sign(adminKey);
const response = await signedTx.execute(client);
const receipt = await response.getReceipt(client);

console.log("Token ID:", receipt.tokenId.toString());
```

**Important:** Token keys (Admin, KYC, Wipe, Pause) **cannot be added after creation** if omitted, nor removed if set.

### Topic Creation (HCS) - For Audit Trails

```javascript
import { TopicCreateTransaction } from "@hashgraph/sdk";

const tx = new TopicCreateTransaction()
  .setTopicMemo("Agent Payment Audit Trail")
  .setSubmitKey(adminKey.publicKey); // Only authorized parties can submit

const response = await tx.execute(client);
const receipt = await response.getReceipt(client);
const topicId = receipt.topicId;

console.log("Topic ID:", topicId.toString());
```

### Submit Audit Message

```javascript
import { TopicMessageSubmitTransaction } from "@hashgraph/sdk";

const auditMessage = JSON.stringify({
  type: "payment",
  from: "0.0.sender",
  to: "0.0.receiver",
  amount: "10 HBAR",
  timestamp: new Date().toISOString(),
  agentId: "agent-001",
});

const tx = new TopicMessageSubmitTransaction()
  .setTopicId(topicId)
  .setMessage(auditMessage);

const response = await tx.execute(client);
const receipt = await response.getReceipt(client);

console.log("Message sequence:", receipt.topicSequenceNumber.toString());
```

---

## Advanced Integrations (Optional Enhancements)

### x402 Protocol

HTTP-native payment protocol where agents pay for API access:

```
Agent --> HTTP GET /api/data --> Server returns 402 Payment Required
Agent --> Pays with HBAR/tokens --> Server grants access
```

See [x402.org](https://www.x402.org/) for integration details.

### OpenClaw Agent Commerce Protocol (ACP)

Multi-agent payment negotiation and settlement. Agents discover services, negotiate terms, and settle payments.

See [OpenClaw ACP Docs](https://docs.openclaw.ai/tools/acp-agents) for integration.

### A2A (Agent-to-Agent) Protocol

Google's protocol for agent communication. Enables agents to discover and communicate payment requirements.

See [A2A Protocol](https://developers.google.com/agent-to-agent).

### ERC-8004: Trustless Agent Identity

On-chain agent identity standard. Gives agents verifiable identities on Hedera.

### HCS-14: Universal Agent IDs

Hedera-native standard for agent identification via Hedera Consensus Service.

See [HCS Standards](https://hashgraphonline.com/docs/standards/).

### Scheduled Transactions

Native recurring payments without external cron:

```javascript
import { ScheduleCreateTransaction, TransferTransaction, Hbar } from "@hashgraph/sdk";

// Create the transaction to schedule
const innerTx = new TransferTransaction()
  .addHbarTransfer(process.env.ACCOUNT_ID, new Hbar(-1))
  .addHbarTransfer("0.0.recipient", new Hbar(1));

// Schedule it
const scheduleTx = new ScheduleCreateTransaction()
  .setScheduledTransaction(innerTx)
  .setScheduleMemo("Weekly agent payment")
  .setAdminKey(adminKey.publicKey);

const response = await scheduleTx.execute(client);
const receipt = await response.getReceipt(client);

console.log("Schedule ID:", receipt.scheduleId.toString());
```

---

## Architecture Patterns

### Pattern 1: Single Agent with Payments

```
User --> AI Agent --> Hedera SDK --> Payment on Hedera Testnet
                 |
                 +--> HCS Topic (audit trail)
```

### Pattern 2: Multi-Agent Commerce

```
Agent A (buyer)  -->  Negotiation  <--  Agent B (seller)
      |                                       |
      +--> Payment (HBAR/Token) ------------>-+
      |                                       |
      +--> HCS Audit Trail                    |
```

### Pattern 3: Agent-to-Service Payments

```
AI Agent --> HTTP Request --> Service API
                |
         x402 Payment Flow
                |
         Hedera Settlement
```

### Pattern 4: Micropayment Streaming

```
AI Agent --> Periodic micro-transfers --> Service Provider
         (Scheduled Transactions)
                |
         HCS logging each payment
```

---

## Best Practices

### Agent Design

1. **Start simple** - one agent, one payment type, then expand
2. **Use AUTONOMOUS mode** for fully automated flows
3. **Use RETURN_BYTE mode** when human approval is needed for high-value transfers
4. **Log everything to HCS** - creates verifiable audit trail
5. **Handle errors gracefully** - network issues, insufficient balance, etc.

### Payment Flows

1. **Check balance before transfers** - avoid failed transactions
2. **Use token associations** - recipients must associate with custom tokens before receiving
3. **Implement idempotency** - agents might retry; prevent double payments
4. **Set reasonable fee limits** with `setMaxTransactionFee()`
5. **Use memo fields** for payment context/reference

### Security

1. **Never hardcode private keys** - use environment variables
2. **Use separate accounts for agents** - don't use your personal account
3. **Implement spending limits** in your agent logic
4. **Monitor agent activity** through HCS topics
5. **Use multi-sig for high-value operations** (RETURN_BYTE mode + human approval)

### Testnet

1. **Get free HBAR** from [portal.hedera.com](https://portal.hedera.com/dashboard) faucet
2. **Use Hashscan** ([hashscan.io](https://hashscan.io)) to verify transactions
3. **Mirror Node API** for querying transaction history
4. **Don't use mainnet** for hackathon - testnet is sufficient

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Forgetting `"type": "module"` in package.json | Add it for ES module imports |
| Using mainnet instead of testnet | Use `Client.forTestnet()` |
| Not associating tokens before transfer | Recipients must call `TokenAssociateTransaction` first |
| Hardcoding private keys | Use `.env` file and `dotenv` |
| Missing admin key on token creation | Set it at creation time; can't add later |
| Not handling async properly | Always `await` transaction execution and receipts |
| Ignoring transaction fees | Set `setMaxTransactionFee()` to avoid surprises |
| No audit trail | Log payments to HCS topic for verifiability |

---

## Project Ideas

1. **Agent-to-Agent Marketplace** - Agents buy/sell services (data analysis, content generation) with HBAR micropayments
2. **Pay-per-Query Knowledge Base** - AI agent charges micro-fees for answering questions, settles on Hedera
3. **Automated DeFi Agent** - Agent monitors prices and executes trades via SaucerSwap plugin
4. **Multi-Agent Task Auction** - Agents bid on tasks, winner gets paid upon completion
5. **Subscription Service Agent** - Uses scheduled transactions for recurring payments
6. **Agent Reputation System** - Track agent reliability via HCS, reward good agents with tokens

---

## Example: Complete Payment Agent

```javascript
import { Client, PrivateKey, TransferTransaction, Hbar, TopicCreateTransaction, TopicMessageSubmitTransaction } from "@hashgraph/sdk";
import dotenv from "dotenv";

dotenv.config();

class PaymentAgent {
  constructor() {
    this.client = Client.forTestnet().setOperator(
      process.env.ACCOUNT_ID,
      PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY)
    );
    this.auditTopicId = null;
  }

  async initialize() {
    // Create audit trail topic
    const topicTx = new TopicCreateTransaction()
      .setTopicMemo("Payment Agent Audit Trail");
    const topicResponse = await topicTx.execute(this.client);
    const topicReceipt = await topicResponse.getReceipt(this.client);
    this.auditTopicId = topicReceipt.topicId;
    console.log("Audit topic created:", this.auditTopicId.toString());
  }

  async pay(recipientId, amountHbar, reason) {
    // Execute payment
    const tx = new TransferTransaction()
      .addHbarTransfer(process.env.ACCOUNT_ID, new Hbar(-amountHbar))
      .addHbarTransfer(recipientId, new Hbar(amountHbar));

    const response = await tx.execute(this.client);
    const receipt = await response.getReceipt(this.client);

    // Log to audit trail
    await this.logAudit({
      type: "payment",
      to: recipientId,
      amount: `${amountHbar} HBAR`,
      reason,
      status: receipt.status.toString(),
      txId: response.transactionId.toString(),
      timestamp: new Date().toISOString(),
    });

    return receipt;
  }

  async logAudit(data) {
    if (!this.auditTopicId) return;

    const tx = new TopicMessageSubmitTransaction()
      .setTopicId(this.auditTopicId)
      .setMessage(JSON.stringify(data));

    await tx.execute(this.client);
  }
}

// Usage
const agent = new PaymentAgent();
await agent.initialize();
await agent.pay("0.0.recipient", 5, "Service payment for data analysis");
```

---

## Useful Links

| Resource | URL |
|----------|-----|
| Hedera Agent Kit (JS/TS) | https://github.com/hashgraph/hedera-agent-kit |
| Hedera Agent Kit (Python) | https://github.com/hashgraph/hedera-agent-kit-python |
| Getting Started | https://docs.hedera.com/hedera/getting-started |
| Hedera Token Service | https://docs.hedera.com/hedera/sdks-and-apis/sdks/token-service |
| Hedera Consensus Service | https://docs.hedera.com/hedera/sdks-and-apis/sdks/consensus-service |
| Testnet Portal | https://portal.hedera.com/dashboard |
| Hashscan Explorer | https://hashscan.io |
| Code Snippets | https://github.com/hedera-dev/hedera-code-snippets |
| OpenClaw ACP | https://docs.openclaw.ai/tools/acp-agents |
| x402 Protocol | https://www.x402.org/ |
| A2A Protocol | https://developers.google.com/agent-to-agent |
| ERC-8004 | https://eips.ethereum.org/EIPS/eip-8004 |
| HCS Standards | https://hashgraphonline.com/docs/standards/ |
| Hedera Discord | https://hedera.com/discord |
