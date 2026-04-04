# Story 2.3: Agent Task Creation API

Status: ready-for-dev

## Story

As an AI agent,
I want to create a task via a secure API,
So that I can autonomously delegate work to verified humans.

## Acceptance Criteria

1. **Given** I am an authenticated agent (header validated by Story 2.1)
   **When** I call the `create_task` MCP tool with `agent_wallet`, `title`, `description`, `budget_hbar`, `deadline`
   **Then** a new task record is created in DB with `client_type: "agent"`, `status: "open"`, `client_agent_wallet` set, and `client_agent_owner_nullifier` populated from AgentBook (if available)

2. **Given** the task is created successfully
   **When** the tool responds
   **Then** the response includes `task_id`, `escrow_tx_id` (mocked: `"mock-escrow-{task_id}"`), and `status: "open"`

3. **Given** the AgentBook lookup fails or returns `status: "offline"`
   **When** the task is inserted
   **Then** `client_agent_owner_nullifier` is `null` and the task is still created (fail-soft — no block)

4. **Given** an invalid `agent_wallet` (not a valid EVM address)
   **When** the tool schema validates the input
   **Then** the MCP tool returns a validation error before any DB write

## Tasks / Subtasks

- [ ] Task 1 — Update `create_task` tool in `src/server/mcp/registry.ts` (AC: #1, #2, #3, #4)
  - [ ] 1.1 Add `agent_wallet: z.string().regex(EVM_ADDRESS_RE, "Invalid EVM address")` to tool schema — `EVM_ADDRESS_RE` is already imported from `@/lib/schemas`
  - [ ] 1.2 Call `lookupAgentBookOwner(agent_wallet)` — destructure `{ nullifier, status }` (already returns this shape from Story 2.2)
  - [ ] 1.3 Insert task with full agent fields:
    ```typescript
    client_type: "agent",
    client_agent_wallet: agent_wallet,
    client_agent_owner_nullifier: nullifier,   // null if offline — that's fine
    status: "open",
    ```
  - [ ] 1.4 Generate mock escrow: `const escrow_tx_id = \`mock-escrow-${task.id}\``
  - [ ] 1.5 Update the inserted task row with `escrow_tx_id` using a second DB call (or use `returning()` + separate update — see Dev Notes)
  - [ ] 1.6 Return `{ task_id: task.id, escrow_tx_id, status: task.status, agentbook_status: status }`

- [ ] Task 2 — Write tests in `src/tests/agent-task.test.ts` (AC: #1–#4)
  - [ ] 2.1 Mock mode: calling the `create_task` logic (extracted helper) with valid inputs creates a task row with `client_agent_wallet` and `client_agent_owner_nullifier` set
  - [ ] 2.2 AgentBook offline: task is created with `client_agent_owner_nullifier: null`
  - [ ] 2.3 `escrow_tx_id` format: matches `mock-escrow-{uuid}` pattern
  - [ ] 2.4 Run `pnpm test` — 80+ tests pass, no regressions

## Dev Notes

### What already exists — DO NOT recreate

- `src/server/mcp/registry.ts` — `create_task` stub at line ~57. **Only modify this tool handler** — do not touch other tools.
- `src/lib/core/agentkit.ts` — `lookupAgentBookOwner(wallet)` already returns `{ nullifier: string | null, status: "verified" | "not-registered" | "offline" }`. Import it.
- `src/lib/schemas/index.ts` — `EVM_ADDRESS_RE` already exported. Already imported in `registry.ts`.
- `src/server/db/schema.ts` — `client_agent_wallet`, `client_agent_owner_nullifier`, `escrow_tx_id` fields already exist on the `tasks` table.
- `src/lib/db/index.ts` — Drizzle `db` client, already imported in `registry.ts`.

### Escrow — mocked in this story, real in Story 4.3

Do NOT call `lockEscrow()` from `lib/core/hedera.ts` here. Story 2.3 spec says "mocked in initial phase". The real Hedera escrow lock is Story 4.3. Use:

```typescript
const escrow_tx_id = `mock-escrow-${task.id}`;
```

Story 4.3 will replace this with a real Hedera TX call.

### DB write pattern — insert + update vs single insert

Drizzle doesn't support RETURNING with a computed value from the same row's ID inline. Two clean options:

**Option A (recommended) — two DB calls:**
```typescript
const [task] = await db.insert(tasks).values({ ...fields }).returning();
const escrow_tx_id = `mock-escrow-${task.id}`;
await db.update(tasks).set({ escrow_tx_id }).where(eq(tasks.id, task.id));
```

**Option B — pre-generate UUID:**
```typescript
import { randomUUID } from "crypto";
const id = randomUUID();
const escrow_tx_id = `mock-escrow-${id}`;
const [task] = await db.insert(tasks).values({ id, escrow_tx_id, ...fields }).returning();
```

Check if the `tasks` schema uses `uuid().defaultRandom()` or requires explicit `id`. If the DB generates the id, use Option A. If you can pass an explicit `id`, Option B is cleaner.

### AgentBook status in response

Include `agentbook_status` in the response for the demo judges — it lets them see the bilateral accountability at task creation time:

```typescript
return {
  content: [{
    type: "text",
    text: JSON.stringify({
      task_id: task.id,
      escrow_tx_id,
      status: task.status,
      agentbook_status: status,  // "verified" | "not-registered" | "offline"
    }),
  }],
};
```

This is also what Story 2.4 (Visual Agent Identity Card) will display.

### Testing strategy — extract a helper

MCP tool handlers are hard to unit-test directly (they're registered on a `McpServer` instance). Extract the core logic into a testable helper:

```typescript
// In registry.ts or a separate file
export async function createAgentTask(input: {
  agent_wallet: string;
  title: string;
  description: string;
  budget_hbar: number;
  deadline: string;
}) { ... }
```

Then the MCP tool just calls this helper. Tests import and call the helper directly — no MCP server needed.

If extracting feels like over-engineering, test via DB state after calling the handler indirectly. Either approach is fine for the hackathon.

### Scope boundary

| Concern | Story 2.3 (this) | Other story |
|---------|-------------------|-------------|
| `create_task` fills `client_agent_wallet` | ✅ | — |
| `create_task` fills `client_agent_owner_nullifier` | ✅ | — |
| Mock `escrow_tx_id` | ✅ | — |
| Real Hedera `lockEscrow()` | ❌ | Story 4.3 |
| `get_task_status` polling | ❌ | Story 2.5 |
| `validate_task` with payment | ❌ | Story 2.5 |
| Visual identity card UI | ❌ | Story 2.4 |

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.3]
- [Source: src/server/mcp/registry.ts:55-80] — `create_task` stub to complete
- [Source: src/lib/core/agentkit.ts] — `lookupAgentBookOwner()` return shape (Story 2.2)
- [Source: src/server/db/schema.ts:48-51] — `client_agent_wallet`, `client_agent_owner_nullifier`, `escrow_tx_id`
- [Source: src/lib/schemas/index.ts] — `EVM_ADDRESS_RE` (already imported in registry.ts)
- [Source: _bmad-output/implementation-artifacts/stories/2-2-agentbook-lookup-and-human-link-fail-soft.md] — `lookupAgentBookOwner` return type change

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Completion Notes List

### File List
