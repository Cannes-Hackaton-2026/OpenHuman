# Story 2.1: AgentKit Auth Middleware & Registration

Status: ready-for-dev

## Story

As a system,
I want an authentication middleware for AI agents using World AgentKit,
So that I can ensure only authorized agents can interact with the HumanProof API.

## Acceptance Criteria

1. **Given** an incoming POST request to the MCP endpoint (`/api/[transport]`) from an AI agent
   **When** the request includes a valid `x-agentkit-auth` header containing a well-formed EVM wallet address
   **Then** the middleware extracts the agent's wallet address and allows the request to proceed

2. **Given** an incoming request with a missing or malformed `x-agentkit-auth` header
   **When** the middleware validates the header
   **Then** the request is rejected with HTTP `401 Unauthorized` and a JSON-RPC error body

3. **Given** `NEXT_PUBLIC_MOCK_WORLDID=true`
   **When** any well-formed header is received (format: `AgentKit 0x<wallet>`)
   **Then** the middleware accepts it without calling the real AgentKit SDK

4. **Given** the middleware successfully authenticates an agent
   **When** the identity is resolved
   **Then** `agentBookVerified` is `false` by default (AgentBook lookup is Story 2.2, not this story)

## Tasks / Subtasks

- [ ] Task 1 — Install `@worldcoin/agentkit` and verify compatibility (AC: #1)
  - [ ] 1.1 Run `pnpm add @worldcoin/agentkit` and confirm it installs without breaking the build
  - [ ] 1.2 If the package is incompatible with Next.js 16 + Node 20, document the failure and proceed with robust header-only validation (see Dev Notes)
  - [ ] 1.3 Update `.env.example` with any new AgentKit env vars (e.g. `AGENTKIT_APP_ID`)

- [ ] Task 2 — Harden `verifyAgentRequest()` in `src/lib/core/agentkit.ts` (AC: #1, #2, #3)
  - [ ] 2.1 Add Zod schema for the `x-agentkit-auth` header: format `AgentKit 0x<40 hex chars>` — validate with regex `/^AgentKit 0x[0-9a-fA-F]{40}$/`
  - [ ] 2.2 If header is missing or fails Zod validation, throw a typed `AgentAuthError` (so the route handler returns 401 cleanly)
  - [ ] 2.3 Extract `walletAddress` from the header using the validated schema (no more raw `.split()` / `.replace()` string manipulation)
  - [ ] 2.4 In mock mode (`NEXT_PUBLIC_MOCK_WORLDID=true`), skip real SDK calls — return mock `AgentIdentity` with a deterministic wallet from the header
  - [ ] 2.5 **Do NOT implement AgentBook lookup here** — keep `lookupAgentBookOwner()` returning `null` (Story 2.2 owns this)

- [ ] Task 3 — Export a typed `AgentAuthError` class (AC: #2)
  - [ ] 3.1 Create `class AgentAuthError extends Error {}` in `agentkit.ts`
  - [ ] 3.2 Verify `src/app/api/[transport]/route.ts` `withAgentAuth()` already catches generic errors and returns 401 — confirm it works with the typed error

- [ ] Task 4 — Add Zod schema to `src/lib/schemas/index.ts` (AC: #1)
  - [ ] 4.1 Export `agentKitHeaderSchema = z.string().regex(...)` from the central schema file so it can be reused in tests

- [ ] Task 5 — Write tests in `src/tests/agentkit.test.ts` (AC: #1–#4)
  - [ ] 5.1 Test: valid header → returns `AgentIdentity` with correct `walletAddress`, `humanOwnerNullifier: null`, `agentBookVerified: false`
  - [ ] 5.2 Test: missing header → throws `AgentAuthError`
  - [ ] 5.3 Test: malformed header (missing `0x`, wrong length, extra spaces) → throws `AgentAuthError`
  - [ ] 5.4 Test: mock mode (`NEXT_PUBLIC_MOCK_WORLDID=true`) with valid header → resolves without SDK call
  - [ ] 5.5 Run `pnpm test` and confirm no regressions in existing test suites (worldid, session, schemas, mock-flow)

## Dev Notes

### What already exists — DO NOT recreate

**Read these files before writing a single line of code:**

- `src/lib/core/agentkit.ts` — **The file you will modify.** Contains `verifyAgentRequest()` and `lookupAgentBookOwner()` stubs. The interface `AgentIdentity` is already defined and correct.
- `src/app/api/[transport]/route.ts` — **Already complete and correct.** The `withAgentAuth()` wrapper already reads `x-agentkit-auth`, calls `verifyAgentRequest()`, and returns a 401 JSON-RPC error on throw. **Do not touch this file.**
- `src/server/mcp/registry.ts` — MCP tool registry. Already wired. **Do not touch this file** (Story 2.3/2.5 scope).
- `src/lib/schemas/index.ts` — Central Zod schema file. Add `agentKitHeaderSchema` here.
- `src/tests/worldid.test.ts`, `src/tests/session.test.ts`, `src/tests/mock-flow.test.ts` — Existing test files. Must keep passing.

### Scope boundary — Story 2.1 vs 2.2

| Concern | Story 2.1 (this) | Story 2.2 (next) |
|---------|-------------------|-------------------|
| Parse & validate `x-agentkit-auth` header | ✅ | - |
| Extract `walletAddress` from header | ✅ | - |
| `lookupAgentBookOwner()` real implementation | ❌ leave `null` | ✅ |
| `agentBookVerified: true` | ❌ always `false` | ✅ |
| AgentBook SDK (`new AgentBook()`) | ❌ | ✅ |

### AgentKit SDK — Fallback Strategy

`@worldcoin/agentkit` is Beta and targets Hono middleware. If `pnpm add @worldcoin/agentkit` fails or causes build errors with Next.js 16:

**Do not block** — implement the validation without the SDK:
```typescript
// Robust header validation without SDK
const AGENTKIT_HEADER_REGEX = /^AgentKit (0x[0-9a-fA-F]{40})$/;

export async function verifyAgentRequest(agentKitHeader: string): Promise<AgentIdentity> {
  const match = AGENTKIT_HEADER_REGEX.exec(agentKitHeader);
  if (!match) throw new AgentAuthError("Invalid or missing AgentKit header");
  const walletAddress = match[1];
  return { walletAddress, humanOwnerNullifier: null, agentBookVerified: false };
}
```

This is acceptable for the hackathon demo. The critical path for the track judge is:
1. The header validation rejects bad actors (401)
2. The wallet is extracted deterministically
3. Story 2.2 adds the AgentBook layer on top

### Architecture compliance

- **File location:** `src/lib/core/agentkit.ts` — SDK wrappers live in `lib/core/`, not in `server/` or `features/`
- **Schema location:** `src/lib/schemas/index.ts` — central Zod source of truth
- **Test location:** `src/tests/agentkit.test.ts` — co-located test pattern
- **Naming:** `verifyAgentRequest()` — camelCase, matches existing function name (do not rename)
- **Error type:** Typed `AgentAuthError extends Error` — allows `instanceof` check if needed later
- **Mock mode:** `process.env.NEXT_PUBLIC_MOCK_WORLDID === "true"` — same toggle used in `worldid.ts`
- **No tRPC here:** AgentKit auth is REST middleware on the MCP route, not a tRPC procedure

### Environment variables to add to `.env.example`

```env
# World AgentKit (Story 2.1+)
# Register your agent wallet: npx @worldcoin/agentkit-cli register <wallet>
AGENTKIT_APP_ID=        # from developer.world.org (optional for Beta)
```

### Header format (canonical)

```
x-agentkit-auth: AgentKit 0xAbCd1234...40hexchars
```

Agents register their wallet via `npx @worldcoin/agentkit-cli register <wallet>` then include this header on every API call. For the demo, the agent "Aria" uses a hardcoded wallet from the seed data.

### References

- [Source: docs/tracks/world-agent-kit.md#What is Agent Kit?] — AgentKit architecture and x402 protocol
- [Source: docs/tracks/world-agent-kit.md#Installation] — `npm install @worldcoin/agentkit`
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.1] — Acceptance criteria
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security] — "Agent Auth: AgentKit signature validated at handshake"
- [Source: _bmad-output/planning-artifacts/architecture.md#Epic 2 mapping] — `/server/mcp/`, `/app/api/mcp/`, `lib/core/agentkit.ts`
- [Source: src/app/api/[transport]/route.ts] — `withAgentAuth()` already wired, do not modify

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Completion Notes List

### File List
