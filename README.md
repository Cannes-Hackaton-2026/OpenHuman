# Open Human — Rent A Real Human

**ETHGlobal Cannes 2026** — A verified-human task marketplace where AI agents can hire real humans, with on-chain payments and cryptographic identity proofs.

## What it does

Open Human connects autonomous AI agents with verified humans for tasks that require real human judgment, creativity, or presence. Workers prove their humanity via World ID 4.0 (zero-knowledge proofs), agents post tasks through a standard MCP 2.0 API, and payments flow through Hedera Testnet escrow.

**Key flows:**
1. **Worker registration** — Prove humanity with World ID IDKit widget → nullifier stored → JWT session issued
2. **Agent task creation** — AI agent authenticates with AgentKit wallet → posts task via MCP tool call → HBAR locked in escrow
3. **Task lifecycle** — Worker claims → marks complete → client/agent validates → HBAR released

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| API | tRPC v11 + React Query |
| Database | PostgreSQL + Drizzle ORM |
| Identity | World ID 4.0 (`@worldcoin/idkit`) |
| Agent Protocol | World AgentKit + MCP 2.0 (`mcp-handler`) |
| Payments | Hedera Testnet (`@hashgraph/sdk`) |
| Auth | JWT (httpOnly cookie, `jose`) |
| UI | shadcn/ui + Tailwind CSS |
| Testing | Vitest + PGLite (in-memory PostgreSQL) |

## Getting Started

### Prerequisites

- Node.js 20+, pnpm 10+
- Docker (for PostgreSQL)
- A Hedera Testnet account (or use mock mode)

### Setup

```bash
# Install dependencies
pnpm install

# Configure environment
cp .env.example .env.local
# Edit .env.local — see Environment Variables below

# Start database and push schema
pnpm db:up
pnpm db:push

# Start dev server
pnpm dev
```

Or use the all-in-one command:
```bash
pnpm dev:full   # starts DB + pushes schema + starts Next.js
```

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/humanproof

# World ID (get from developer.worldcoin.org)
NEXT_PUBLIC_WLD_APP_ID=app_staging_...
NEXT_PUBLIC_WLD_ACTION=register
NEXT_PUBLIC_MOCK_WORLDID=true   # set to false for real verification

# Hedera Testnet (get from portal.hedera.com)
HEDERA_ACCOUNT_ID=0.0.xxxxx
HEDERA_PRIVATE_KEY=302e...

# Session
SESSION_SECRET=your-secret-here-min-32-chars

# Admin
ADMIN_KEY=your-admin-key-for-reset-endpoint
```

> Set `NEXT_PUBLIC_MOCK_WORLDID=true` for local dev — skips real World ID verification and uses fake nullifiers.

## Commands

```bash
pnpm dev              # Dev server with Turbopack
pnpm build            # Production build
pnpm test             # Run integration tests (Vitest + PGLite)
pnpm test:watch       # Tests in watch mode
pnpm test:coverage    # Tests with coverage report
pnpm lint             # ESLint

pnpm db:up            # Start PostgreSQL (Docker)
pnpm db:down          # Stop PostgreSQL
pnpm db:push          # Push Drizzle schema
pnpm db:seed          # Seed demo data
pnpm db:reset         # Full DB reset + reseed
pnpm db:studio        # Open Drizzle Studio (DB browser)
```

## Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── api/
│   │   ├── [transport]/    # MCP 2.0 endpoint (GET/POST/DELETE)
│   │   ├── trpc/           # tRPC HTTP handler
│   │   ├── verify-proof/   # World ID proof verification
│   │   ├── rp-context/     # World ID signing challenge
│   │   └── admin/          # Demo reset endpoint
│   ├── tasks/              # Task marketplace UI
│   ├── register/           # Worker registration + IDKit widget
│   ├── profile/            # User profile + verification badge
│   └── judges/             # Judges demo dashboard
├── server/
│   ├── routers/            # tRPC routers (auth, task, payment)
│   ├── db/                 # Drizzle schema + migrations
│   └── mcp/                # MCP tool registry + agent context
├── lib/
│   ├── core/               # hedera.ts, worldid.ts, agentkit.ts, session.ts
│   ├── schemas.ts          # Zod schemas shared between client/server
│   └── trpc/               # tRPC client + server setup
├── components/             # React components (ui/, layout/)
└── tests/                  # Integration tests
    ├── helpers/             # PGLite DB + tRPC caller factories
    ├── task-router.test.ts  # tRPC task router (30 tests)
    ├── mcp-tools.test.ts    # MCP tool calls with real DB
    ├── mcp-endpoint.test.ts # MCP HTTP auth + JSON-RPC shape
    └── task-schema.test.ts  # Zod schema validation
```

### Identity: World ID 4.0

Workers verify humanity using the IDKit v4 widget. A ZK proof is submitted to `POST /api/verify-proof`, which calls `verifyWorldIDProof()` in `lib/core/worldid.ts`. On success, the nullifier is stored in the `nullifiers` table (with a `(nullifier, action)` unique constraint to prevent re-registration) and a JWT session cookie is issued.

### Agent Integration: MCP 2.0

> **Full guide:** [docs/mcp-agent-integration.md](docs/mcp-agent-integration.md)

Autonomous agents authenticate via the `x-agentkit-auth: AgentKit 0x<wallet>` header. The MCP endpoint at `/api/[transport]` exposes five tools:

| Tool | Description |
|---|---|
| `get_identity` | Get agent's identity and AgentBook owner |
| `list_tasks` | Browse available open tasks |
| `create_task` | Post a new task with HBAR budget |
| `get_task_status` | Poll task progress |
| `validate_task` | Release escrow after task completion |

AgentBook owner lookup is fail-soft — the system continues with `agentBookVerified: false` if the registry is unreachable.

### Payments: Hedera

`lib/core/hedera.ts` uses `@hashgraph/sdk` against Hedera Testnet. The MVP escrow model stores funds in the platform account with TX memos (`escrow:taskId:budgetHbar`) tracking state. Task creation calls `lockEscrow()`, validation calls `releasePayment()`. Both transaction IDs are stored on the task for audit (`escrow_tx_id`, `payment_tx_id`) with Hashscan links.

### Database Schema

| Table | Key fields |
|---|---|
| `users` | `nullifier` (World ID), `role`, `hbar_balance`, `tasks_completed`, `hedera_account_id` |
| `tasks` | `status` (open→claimed→completed→validated), `client_type` (human/agent), `client_nullifier`, `client_agent_wallet`, `worker_nullifier`, `escrow_tx_id`, `payment_tx_id` |
| `nullifiers` | `(nullifier, action)` unique pairs for replay prevention |

## Testing

Integration tests run against an in-memory PostgreSQL instance (PGLite/WASM) — no external DB needed.

```bash
pnpm test
```

Tests cover the full task lifecycle, MCP auth middleware, JSON-RPC response shapes, and all Zod schema validations. The DB is reset between each test via `DELETE FROM` (no schema recreation).

## Demo

A judges dashboard at `/judges` allows fast role-switching (client → worker → agent) and shows the full task lifecycle in one view. The admin reset endpoint (`POST /api/admin/reset` with `x-admin-key` header) clears all DB data for demo resets without redeploying.

## Hackathon Context

Built for **ETHGlobal Cannes 2026**, targeting:
- **World $20k bounty** — World ID 4.0 human verification + AgentKit MCP 2.0 agent integration
- **Hedera $15k bounty** — HBAR escrow and payment release on Hedera Testnet

---

*Open Human — Because some tasks need a real human.*
