# Story 2.2: AgentBook Lookup & Human Link (Fail-Soft)

Status: ready-for-dev

## Story

As a system,
I want to verify an agent's registration in AgentBook and identify its human owner,
So that I can ensure bilateral cryptographic accountability even if the network is unstable.

## Acceptance Criteria

1. **Given** an authenticated agent request (header already validated by Story 2.1)
   **When** the system queries the AgentBook registry for the agent's wallet address
   **Then** if the agent is found, `humanOwnerNullifier` is set and `agentBookVerified: true`

2. **Given** AgentBook is unreachable or the agent is not registered
   **When** `lookupAgentBookOwner()` is called
   **Then** the system returns `null` (fail-soft — does NOT throw, does NOT block the request)
   **And** `agentBookVerified` stays `false`

3. **Given** mock mode (`NEXT_PUBLIC_MOCK_WORLDID=true`)
   **When** `lookupAgentBookOwner()` is called with any valid wallet
   **Then** it returns a deterministic mock nullifier `mock-owner-nullifier-${wallet.slice(2, 10)}`
   **And** `agentBookVerified: true`

4. **Given** the `get_identity` MCP tool is called by an agent
   **When** the agent provides its `wallet_address` parameter
   **Then** the tool returns `{ walletAddress, humanOwnerNullifier, agentBookVerified, agentbook_status }`
   **And** `agentbook_status` is `"verified"`, `"not-registered"`, or `"offline"`

## Tasks / Subtasks

- [ ] Task 1 — Implement `lookupAgentBookOwner()` in `src/lib/core/agentkit.ts` (AC: #1, #2, #3)
  - [ ] 1.1 Mock mode: return `"mock-owner-nullifier-${walletAddress.slice(2, 10)}"` (deterministic, slice from index 2 to skip `0x`)
  - [ ] 1.2 Production: attempt `@worldcoin/agentkit` `AgentBook` SDK call — wrap in try/catch fail-soft
  - [ ] 1.3 If SDK unavailable (known incompatibility with Next.js 16), use direct HTTP fallback to the AgentBook API (see Dev Notes)
  - [ ] 1.4 On any error/timeout: `console.warn("[AgentKit] AgentBook lookup failed — proceeding with caution")` and return `null`
  - [ ] 1.5 Remove underscore prefix from parameter (`_walletAddress` → `walletAddress`) now that the function is real

- [ ] Task 2 — Update mock mode in `verifyAgentRequest()` (AC: #3)
  - [ ] 2.1 In mock mode path of `verifyAgentRequest()`, call the real `lookupAgentBookOwner()` (which now handles mock internally) instead of hardcoding `null`
  - [ ] 2.2 `agentBookVerified` should be `true` in mock mode after this change

- [ ] Task 3 — Implement `get_identity` MCP tool in `src/server/mcp/registry.ts` (AC: #4)
  - [ ] 3.1 Add `wallet_address: z.string().regex(...)` parameter to the tool schema (same regex as `agentKitHeaderSchema`: `0x[0-9a-fA-F]{40}`)
  - [ ] 3.2 Call `lookupAgentBookOwner(wallet_address)` and derive `agentbook_status`:
    - `humanOwnerNullifier !== null` → `"verified"`
    - `humanOwnerNullifier === null` (fail-soft) → `"offline"` or `"not-registered"` (use `"offline"` as conservative default)
  - [ ] 3.3 Return full identity object including `agentbook_status` for the visual demo card (Story 2.4)
  - [ ] 3.4 Import `lookupAgentBookOwner` from `@/lib/core/agentkit`

- [ ] Task 4 — Write/extend tests in `src/tests/agentkit.test.ts` (AC: #1–#3)
  - [ ] 4.1 Mock mode: `lookupAgentBookOwner()` returns deterministic nullifier (not null)
  - [ ] 4.2 Mock mode: `verifyAgentRequest()` returns `agentBookVerified: true`
  - [ ] 4.3 Production mode (SDK unavailable): `lookupAgentBookOwner()` returns `null` without throwing
  - [ ] 4.4 Simulate network failure: mock the fetch/SDK to reject → function still returns `null`
  - [ ] 4.5 `pnpm test` — all tests pass, no regressions

## Dev Notes

### What already exists — DO NOT recreate

- `src/lib/core/agentkit.ts` — **Your main file.** `lookupAgentBookOwner()` is the stub to replace. `verifyAgentRequest()` already calls it and sets `agentBookVerified: humanOwnerNullifier !== null` — this logic is correct, no change needed there.
- `src/server/mcp/registry.ts` — `get_identity` tool is registered but returns a stub string. **Only modify the `get_identity` tool handler** — do not touch other tools (`list_tasks`, `create_task`, etc.).
- `src/tests/agentkit.test.ts` — Extend this file. The 12 existing tests must keep passing.
- `src/lib/schemas/index.ts` — `agentKitHeaderSchema` regex is already there, reuse its capture group for wallet validation in the `get_identity` tool.

### AgentBook SDK fallback strategy

`@worldcoin/agentkit` was confirmed incompatible with Next.js 16 in Story 2.1. For `lookupAgentBookOwner()`, use this fail-soft pattern:

```typescript
export async function lookupAgentBookOwner(walletAddress: string): Promise<string | null> {
  if (process.env.NEXT_PUBLIC_MOCK_WORLDID === "true") {
    return `mock-owner-nullifier-${walletAddress.slice(2, 10)}`;
  }

  try {
    // Try real SDK — may fail in Next.js 16 environment
    const { AgentBook } = await import("@worldcoin/agentkit");
    const agentBook = new AgentBook();
    return await agentBook.getHumanOwner(walletAddress);
  } catch {
    // Fail-soft: SDK unavailable or agent not registered
    console.warn("[AgentKit] AgentBook lookup failed — proceeding with caution");
    return null;
  }
}
```

The dynamic `import()` avoids build-time errors if the package isn't installed. This is the correct pattern for optional SDK integration in Next.js.

### `get_identity` tool — parameter approach

The MCP route validates the header but doesn't inject the identity into the MCP tool context (no shared context available in `mcp-handler`). The clean solution: the agent passes its own wallet as a tool parameter. This is intentional — the tool is an explicit identity probe, not an implicit session lookup.

```typescript
server.tool(
  "get_identity",
  "Returns the AgentBook identity for a given agent wallet address",
  { wallet_address: z.string().regex(/^0x[0-9a-fA-F]{40}$/, "Invalid EVM address") },
  async ({ wallet_address }) => {
    const humanOwnerNullifier = await lookupAgentBookOwner(wallet_address);
    const agentbook_status = humanOwnerNullifier ? "verified" : "offline";
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          walletAddress: wallet_address,
          humanOwnerNullifier,
          agentBookVerified: humanOwnerNullifier !== null,
          agentbook_status,
        }),
      }],
    };
  }
);
```

### DB field `client_agent_owner_nullifier` — NOT this story's scope

`tasks.client_agent_owner_nullifier` (in `server/db/schema.ts`) is where the human owner gets persisted on task creation. That persistence happens in Story 2.3 (`create_task` tool). **Story 2.2 only populates the in-memory `AgentIdentity` — no DB writes.**

### Mock mode determinism

Use `walletAddress.slice(2, 10)` (skip `0x`, take 8 chars) for the mock nullifier suffix — same pattern as the original stub but with corrected indexing:
- `0xAbCd1234...` → `"mock-owner-nullifier-AbCd1234"`

This gives a readable, reproducible value for demo purposes.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.2]
- [Source: docs/tracks/world-agent-kit.md#Integration Guide] — `AgentBook` SDK usage
- [Source: src/lib/core/agentkit.ts] — `lookupAgentBookOwner()` stub to replace
- [Source: src/server/mcp/registry.ts:20-27] — `get_identity` TODO to implement
- [Source: src/server/db/schema.ts:49] — `client_agent_owner_nullifier` field (Story 2.3 concern)
- [Source: _bmad-output/implementation-artifacts/stories/2-1-agentkit-auth-middleware-and-registration.md] — Story 2.1 completion notes (SDK incompatibility confirmed)

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Completion Notes List

### File List
