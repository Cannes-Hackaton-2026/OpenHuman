# Story 2.3: Agent Task Creation API

Status: done

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

- [x] Task 1 — Update `create_task` tool in `src/server/mcp/registry.ts` (AC: #1, #2, #3, #4)
  - [x] 1.1 `agent_wallet: z.string().regex(EVM_ADDRESS_RE)` ajouté au schema du tool
  - [x] 1.2 `lookupAgentBookOwner(agent_wallet)` appelé — destructure `{ nullifier, status }`
  - [x] 1.3 Task insérée avec `client_agent_wallet`, `client_agent_owner_nullifier: nullifier`
  - [x] 1.4 UUID pré-généré (Option B) : `const id = randomUUID()` → `escrow_tx_id = mock-escrow-${id}`
  - [x] 1.5 Single DB insert avec tous les champs incluant `id` et `escrow_tx_id`
  - [x] 1.6 Retourne `{ task_id, escrow_tx_id, status, agentbook_status }`

- [x] Task 2 — Write tests in `src/tests/agent-task.test.ts` (AC: #1–#4)
  - [x] 2.1 Payload shape validé en mock mode : `client_agent_wallet` et `client_agent_owner_nullifier` corrects
  - [x] 2.2 AgentBook offline : `client_agent_owner_nullifier: null`, task toujours créée
  - [x] 2.3 Format `escrow_tx_id` : `mock-escrow-{uuid}` validé par regex
  - [x] 2.4 87 tests passent, 0 régressions (tests sans DB — cohérent avec le projet)

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

- Option B retenue pour le DB write : UUID pré-généré → single insert, pas de second aller-retour DB
- Tests sans DB (mock) — cohérent avec tous les autres tests du projet (postgres non démarré en CI)
- `agentbook_status` inclus dans la réponse pour les juges / Story 2.4
- 87 tests passent, 0 régressions
- Code review patch: authenticated AgentKit wallet is now propagated through MCP request context and enforced in `create_task`
- Targeted MCP/AgentKit tests pass with `SESSION_SECRET=test-secret`

### Review Findings

- [x] [Review][Patch] Authentified agent identity is not bound to `create_task`, so a caller can submit any `agent_wallet` and create tasks under another agent's wallet [`src/server/mcp/registry.ts:67`] — Fixed: authenticated wallet is now stored in request context and enforced by MCP task helpers

### File List

- `src/server/mcp/registry.ts` — Updated: `create_task` tool complet avec `agent_wallet`, AgentBook lookup, mock escrow
- `src/tests/agent-task.test.ts` — New: 7 tests (payload shape, escrow format, EVM validation, fail-soft)
