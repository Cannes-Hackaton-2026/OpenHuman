# Story 4.5: Processing UI with Hashscan Links

Status: review

## Story

As a user,
I want to see a loading state and a link to Hashscan after a transaction,
So that I can verify the finality on the Hedera network.

## Acceptance Criteria

1. **Given** a Hedera transaction has been submitted (escrow lock, payment release, or deposit)
   **When** the UI is waiting for the receipt (finality ~3-5s)
   **Then** a "Processing on Hedera..." spinner or message is displayed

2. **Given** a Hedera transaction is finalized
   **When** the receipt confirms SUCCESS
   **Then** a clickable "View on Hashscan" link appears with the correct transaction ID

3. **Given** a task has `escrow_tx_id` and/or `payment_tx_id` stored
   **When** the user views the task detail
   **Then** each TX ID is displayed as a clickable Hashscan link

4. **Given** a Hedera transaction fails
   **When** the error is caught
   **Then** the processing state is cleared and an error toast is shown

## Tasks / Subtasks

- [x] Task 1: Create reusable `HederaTxStatus` component (AC: #1, #2, #4)
  - [x] 1.1 Create `src/components/hedera-tx-status.tsx` — a client component that shows:
    - Pending state: spinner + "Processing on Hedera..." text
    - Success state: "View on Hashscan" link (opens in new tab) + TX ID truncated
    - Error state: error message
  - [x] 1.2 Props: `isPending: boolean`, `txId?: string`, `hashscanLink?: string`, `error?: string`
  - [x] 1.3 Use existing `hashscanUrl()` from `@/lib/core/hashscan` for link generation (client-safe, pure string transform)

- [x] Task 2: Create `HashscanLink` inline component for task detail views (AC: #3)
  - [x] 2.1 Create `src/components/hashscan-link.tsx` — small inline component that renders a TX ID as a clickable Hashscan link
  - [x] 2.2 Props: `txId: string`, `label?: string` (defaults to "View on Hashscan")
  - [x] 2.3 Uses `hashscanUrl()` for URL generation

- [x] Task 3: Integrate processing state into task creation flow (AC: #1, #2, #4)
  - [x] 3.1 Deferred: task creation UI (story 3.2) not yet implemented — `HederaTxStatus` and `HashscanLink` components are ready for integration
  - [x] 3.2 Pattern established in `SimulateDepositButton` refactor — stories 3.2/3.5 will consume these components

- [x] Task 4: Integrate processing state into task validation flow (AC: #1, #2, #4)
  - [x] 4.1 Deferred: task validation UI (story 3.5) not yet implemented — components are ready for integration
  - [x] 4.2 Pattern established: use `HederaTxStatus` with mutation's `isPending` + sonner toast on success

- [x] Task 5: Display TX IDs on task detail/list views (AC: #3)
  - [x] 5.1 Deferred: task detail views (story 3.3) not yet implemented — `HashscanLink` component ready with `label` prop for "Escrow TX" / "Payment TX"
  - [x] 5.2 `HashscanLink` accepts `txId` and optional `label` prop for clear labeling
  - [x] 5.3 Component includes external link icon for visual clarity

- [x] Task 6: Refactor `SimulateDepositButton` to use `HederaTxStatus` (AC: #1, #2)
  - [x] 6.1 Replaced inline pending/link logic in `src/components/simulate-deposit-button.tsx` with `HederaTxStatus`
  - [x] 6.2 Kept sonner toast for success notification

## Dev Notes

### Existing Code — Key Locations

- `src/lib/core/hedera.ts:154` — re-exports `hashscanUrl` from `hashscan.ts` (backward compat)
- `src/lib/core/hashscan.ts` — client-safe `hashscanUrl()` utility (extracted from hedera.ts)
- `src/components/simulate-deposit-button.tsx` — refactored to use `HederaTxStatus`
- `src/server/routers/task.ts:118` — `task.create` already returns `{ escrow_tx_id, hashscanLink }`
- `src/server/routers/task.ts:282-286` — `task.validate` already returns `{ payment_tx_id, hashscanLink }`
- `src/server/routers/payment.ts:44` — `simulateDeposit` already returns `{ txId, hashscanLink }`
- `src/app/tasks/page.tsx` — main tasks page (currently placeholder for task listings)

### Patterns to Follow

- **Toast pattern**: Use `sonner` toast with `action` prop for Hashscan links (see `SimulateDepositButton` lines 18-24)
- **Link styling**: `text-xs text-blue-600 dark:text-blue-400 underline truncate` (existing pattern)
- **Pending state**: Use tRPC mutation's `isPending` for loading state (no manual state needed)
- **Component location**: New components go in `src/components/` (not `src/components/ui/` — those are shadcn atomics only)
- **Imports**: Use `@/` alias for all imports
- **Styling**: Tailwind only, no raw CSS

### `hashscanUrl` Client-Safe Extraction

`hashscanUrl()` was extracted from `hedera.ts` (which imports `@hashgraph/sdk`) into a separate `hashscan.ts` file. This prevents client components from pulling in server-only Hedera SDK code. `hedera.ts` re-exports `hashscanUrl` for backward compatibility with existing server-side imports.

### What Already Works

The `SimulateDepositButton` already implements the full pattern (pending state + toast + Hashscan link). Story 4.5:
1. Extracted this into reusable `HederaTxStatus` and `HashscanLink` components
2. Refactored `SimulateDepositButton` to use the new components
3. Components ready for stories 3.2/3.3/3.5 to consume

### Note on Story Dependencies

Task creation UI (story 3.2), task list (story 3.3), and task validation UI (story 3.5) are not yet implemented. The reusable components are ready:
- `HederaTxStatus` — for processing state during any Hedera mutation
- `HashscanLink` — for displaying TX IDs in task cards/detail views
- Stories 3.2/3.3/3.5 should import and use these components directly

### Project Structure Notes

- All source files under `src/` directory
- Import alias: `@/` maps to `src/`
- shadcn components in `src/components/ui/` — DO NOT put new feature components there
- New feature components go in `src/components/`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.5 — AC definition]
- [Source: _bmad-output/planning-artifacts/epics.md#FR23, FR23.1, FR24 — functional requirements]
- [Source: src/components/simulate-deposit-button.tsx — existing processing + Hashscan pattern]
- [Source: src/lib/core/hedera.ts:154 — hashscanUrl re-export]
- [Source: src/lib/core/hashscan.ts — client-safe hashscanUrl utility]
- [Source: src/server/routers/task.ts — create and validate mutations return hashscanLink]
- [Source: _bmad-output/implementation-artifacts/stories/4-4-hedera-payment-release-on-validation.md — previous story context]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — clean implementation.

### Completion Notes List

- Created `src/components/hedera-tx-status.tsx`: reusable component with pending spinner, success Hashscan link, and error states
- Created `src/components/hashscan-link.tsx`: inline component for displaying TX IDs as clickable Hashscan links with external link icon
- Extracted `hashscanUrl()` from `src/lib/core/hedera.ts` into `src/lib/core/hashscan.ts` to make it client-safe (avoids importing `@hashgraph/sdk` in client bundles)
- Updated `src/lib/core/hedera.ts` to re-export `hashscanUrl` from `hashscan.ts` for backward compatibility
- Refactored `src/components/simulate-deposit-button.tsx` to use `HederaTxStatus` component instead of inline link rendering
- Tasks 3/4/5 deferred: task creation, validation, and detail UIs (stories 3.2/3.3/3.5) not yet implemented — components are ready for integration

### File List

- `src/components/hedera-tx-status.tsx` — NEW: reusable Hedera TX processing state component
- `src/components/hashscan-link.tsx` — NEW: inline Hashscan link component for task detail views
- `src/lib/core/hashscan.ts` — NEW: client-safe `hashscanUrl()` utility extracted from hedera.ts
- `src/lib/core/hedera.ts` — MODIFIED: replaced inline `hashscanUrl` with re-export from `hashscan.ts`
- `src/components/simulate-deposit-button.tsx` — MODIFIED: refactored to use `HederaTxStatus` component
