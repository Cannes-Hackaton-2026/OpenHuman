---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories, step-04-final-validation]
inputDocuments: [
  "_bmad-output/planning-artifacts/prd.md"
]
---

# HumanProof - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for HumanProof, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: A prospective worker can initiate a World ID 4.0 Orb verification flow to register as a verified human worker.
FR2: The system can validate a World ID 4.0 proof server-side by calling the World verification API.
FR3: The system can store a worker's World ID nullifier and enforce uniqueness per action — a second registration attempt with the same nullifier is rejected.
FR4: A verified worker's profile displays a "Human Verified" badge indicating Orb-level verification.
FR5: A human client can register and access the platform (World ID verification for human clients is P1.5 — optional for MVP).
FR6: The system can generate RP signatures server-side for each IDKit verification session.
FR7: A verified human client can create a task with a title, description, budget (HBAR), and deadline.
FR8: An AI agent client can create a task via API with a title, description, budget, and deadline.
FR9: A verified worker can view a unified list of available (unclaimed) tasks, regardless of whether they were created by a human client or an AI agent.
FR10: A verified worker can view their own currently claimed task(s) and status.
FR11: A client (human or agent) can view their own posted tasks and each task's current status.
FR12: A verified worker can claim an available task — the system validates the worker's nullifier server-side before granting the claim.
FR13: A claimed task is locked to the claiming worker — no other worker can claim it while in `claimed` status.
FR14: A worker who has claimed a task can mark it as complete.
FR15: A task client (human or agent) can validate a completed task submission.
FR16: The system can release a claimed task back to `available` status if the worker does not submit completion before the deadline.
FR17: A task that is not validated within its deadline can have its escrow refunded to the client (manually triggered for MVP; automatic post-MVP).
FR18: A task progresses through defined statuses: `open → claimed → completed → validated` (or `→ expired → refunded`).
FR19: A client can deposit HBAR into their platform balance (manual for MVP).
FR19.1: (Demo Robustness) The system provides a "Simulate Deposit" feature for demo users to instantly fund their balance via a real HBAR transfer + DB update.
FR20: The platform can lock HBAR in escrow at task creation using the platform's server-side Hedera account, maintaining the association between a task and its escrow TX ID.
FR21: The platform can release escrowed HBAR to a worker's account upon task validation.
FR22: The platform can refund escrowed HBAR to a client's platform balance upon deadline expiry.
FR23: Each Hedera escrow lock and payment release produces a verifiable transaction ID linkable to Hashscan.
FR23.1: (UI Feedback) The UI displays a "Processing Transaction..." state with a Hashscan link immediately upon submission to manage the 3-5s finality gap.
FR24: Transaction IDs for escrow lock and payment release are surfaced in the task detail view once confirmed.
FR25: A user can view their platform HBAR balance.
FR26: The system can authenticate an AI agent client via World AgentKit middleware on task creation requests — agent-facing routes require a valid AgentKit header.
FR27: The system verifies an agent's AgentBook registration and explicitly performs a lookup of the human owner's World ID to demonstrate bilateral cryptographic accountability.
FR28: An unauthenticated or unregistered agent request is rejected with a clear error response.
FR29: The agent task creation API returns a task ID and escrow TX ID upon successful task creation.
FR30: An agent can poll task status via API to determine when to trigger validation.
FR31: An agent can validate a completed task via direct API call (polling-triggered), bypassing fragile webhook callbacks for demo reliability.
FR32: A verified worker has a profile page displaying their verification status and reputation indicator.
FR33: The system increments a worker's task completion count upon successful task validation.
FR34: A worker's reputation is displayed as a string indicator (e.g., "5 tasks completed") tied to their World ID nullifier.
FR35: A worker's "Human Verified" status is visually distinguishable from unverified accounts in task listings.
FR36: The system can generate and serve an RP context from a server-side API route for each verification session.
FR37: Human-facing mutation routes require a valid World ID session — unauthenticated requests are rejected.
FR38: The system maintains a user session after successful World ID verification, scoping subsequent requests to that verified identity.
FR39: The system surfaces judge-friendly error states (e.g., "Human Already Registered" with reset/simulator instructions) for key failure scenarios.
FR40: The system surfaces server-side validation logs and Hedera TX IDs in a format accessible during a demo.
FR41: (Demo Robustness) The system includes a hidden `/admin` reset route to clear task statuses and refund the platform wallet, allowing for rapid demo looping.

### NonFunctional Requirements

NFR1: World ID proof validation round-trip completes within 5 seconds.
NFR2: Task list page renders within 500ms for up to 100 tasks.
NFR3: Hedera transaction submission initiates within 2 seconds; confirmation display updates on receipt (~3-5s finality).
NFR4: All API mutation endpoints respond within 3 seconds.
NFR5: Task status polling interval is 3-5 seconds.
NFR6: World ID RP signing key stored exclusively as server-side env var.
NFR7: Hedera operator private key stored exclusively as server-side env var.
NFR8: All API routes that mutate state reject unauthenticated requests.
NFR9: World ID proof validation occurs server-side on every protected action.
NFR10: Nullifier uniqueness enforced at the database level (`UNIQUE` constraint).
NFR11: All client-to-backend communication occurs over HTTPS.
NFR12: Environment secrets do not appear in the public GitHub repository.
NFR13: The system supports up to 5 concurrent sessions during hackathon judging.
NFR14: Database schema supports up to 1,000 tasks and 500 users.
NFR15: Fail-closed if World verification API is unreachable.
NFR16: Fail-closed if AgentBook verification is unreachable.
NFR17: Fail-closed if Hedera transaction fails; surface error to user.
NFR18: World ID credential expiry (`expires_at_min`) is checked and enforced.
NFR19: Core flows (registration, task creation, claim, validation) are keyboard-navigable.
NFR20: Color contrast for primary UI elements meets WCAG 2.1 AA minimum (4.5:1 ratio).

### Additional Requirements

- **Next.js App Router**: Project uses Next.js with App Router; client-side rendering for auth views, server-side for API routes.
- **Hedera Testnet**: Platform account operates on Hedera Testnet for escrow/payments.
- **Platform Escrow Architecture**: Single Hedera operator account managed server-side (private key in env).
- **World ID 4.0 Staging**: Use World ID staging environment and simulator for demo/development.
- **World AgentKit integration**: Middleware authentication and AgentBook lookup required for agent clients.
- **Zero PII**: No biometric or personal data storage; nullifier-only identity model.
- **Database Schema**: Needs to support `users`, `tasks`, and `nullifiers` as defined in PRD.
- **Demo-Proof Features**: "Simulate Deposit" button and `/admin` reset route are critical for hackathon reliability.

### UX Design Requirements

(No UX Design document provided; requirements extracted from PRD functional descriptions)
- **UX-DR1**: World ID IDKit widget integration for worker/client registration.
- **UX-DR2**: Unified task list view for verified workers.
- **UX-DR3**: Task detail view with "Claim" button and worker profile info.
- **UX-DR4**: Client dashboard for task creation and validation.
- **UX-DR5**: "Processing Transaction" state with Hashscan links for Hedera operations.
- **UX-DR6**: "Human Verified" badges and reputation string displays in UI.

### FR Coverage Map

FR1: Epic 1 - Worker World ID verification flow
FR2: Epic 1 - Server-side proof validation
FR3: Epic 1 - Nullifier uniqueness enforcement
FR4: Epic 1 - "Human Verified" badge display
FR5: Epic 1 - Human client registration
FR6: Epic 1 - RP signature generation
FR7: Epic 3 - Human task creation (UI)
FR8: Epic 3 - Agent task creation (API)
FR9: Epic 3 - Unified task list view
FR10: Epic 3 - Worker "My Tasks" view
FR11: Epic 3 - Client "My Posted Tasks" view
FR12: Epic 3 - Task claim flow (nullifier check)
FR13: Epic 3 - Task locking logic
FR14: Epic 3 - "Mark as Complete" action
FR15: Epic 3 - Client validation action
FR16: Epic 3 - Automatic/Manual claim release on expiry
FR17: Epic 4 - Escrow refund path
FR18: Epic 3 - Task status state machine
FR19: Epic 4 - HBAR deposit (manual)
FR19.1: Epic 4 - "Simulate Deposit" feature
FR20: Epic 4 - Hedera escrow lock (server-side)
FR21: Epic 4 - Hedera payment release (server-side)
FR22: Epic 4 - Hedera refund to client
FR23: Epic 4 - Hashscan transaction ID generation
FR23.1: Epic 4 - "Processing" UI feedback
FR24: Epic 4 - Transaction IDs in task detail
FR25: Epic 4 - User HBAR balance view
FR26: Epic 2 - AgentKit middleware auth
FR27: Epic 2 - AgentBook registration & Human Owner lookup
FR28: Epic 2 - Agent error handling (unauth/unreg)
FR29: Epic 2 - Agent task creation response (IDs)
FR30: Epic 2 - Agent task status polling API
FR31: Epic 2 - Agent direct validation API
FR32: Epic 1 - Worker verification status on profile
FR33: Epic 3 - Task completion count increment
FR34: Epic 3 - Reputation string display
FR35: Epic 1 - Visual distinction of verified accounts
FR36: Epic 1 - Server-side RP context generation
FR37: Epic 1 - Mutation route protection (World ID session)
FR38: Epic 1 - User session maintenance
FR39: Epic 1 - Judge-friendly error states
FR40: Epic 5 - Server validation logs & TX IDs display
FR41: Epic 5 - /admin reset route (looping)

## Epic 1: Identity & Human Verification (World ID Bounty)

Enable workers and clients to prove their humanness biometrically and cryptographically, ensuring a bot-free marketplace.

### Story 1.1: Setup World ID Staging & Mock Mode
As a developer,
I want to configure the World ID staging environment and a Mock Mode toggle,
So that I can test authentication flows without being blocked by network or simulator issues.

**Acceptance Criteria:**

**Given** the application is running in development mode
**When** the environment variable `NEXT_PUBLIC_MOCK_WORLDID` is set to `true`
**Then** the World ID verification flow returns a static mock proof without showing the QR code
**And** the backend validation accepts this mock proof as valid
**And** the initial `users` and `nullifiers` database tables are initialized.

### Story 1.2: Worker Registration with IDKit Widget
As a worker,
I want to sign up using the World ID IDKit widget,
So that I can prove I am a unique human and access the marketplace.

**Acceptance Criteria:**

**Given** I am an unauthenticated user on the landing page
**When** I click "Register as Worker" and complete the World ID verification via the app (or simulator)
**Then** my ZK-proof is sent to the backend for validation
**And** I am redirected to the task list view upon success.

### Story 1.3: Server-Side Proof Validation & Session
As a system,
I want to validate World ID proofs server-side and create a persistent user session,
So that I can ensure identity is not forgeable via client-side manipulation.

**Acceptance Criteria:**

**Given** the backend receives a POST request with a World ID proof
**When** the proof is validated against the World Coin verification API (or mock logic)
**Then** a new user record is created with the unique nullifier
**And** a secure session cookie is issued to the client
**And** subsequent mutation requests are rejected if the session is invalid.

### Story 1.4: User Profile & Verification Badge
As a user,
I want to see my verification status and "Human Verified" badge on my profile,
So that I can confirm my account is active and credible.

**Acceptance Criteria:**

**Given** I am logged in as a verified worker
**When** I view my profile or the application header
**Then** I see a "Human Verified" badge and my current reputation count
**And** unverified or mock users (if any) are clearly distinguished.

### Story 1.5: Judge-Friendly Error Handling (Demo)
As a demo operator,
I want the system to show a clear "Human Already Registered" message for duplicate attempts,
So that I can demonstrate nullifier uniqueness to judges without technical confusion.

**Acceptance Criteria:**

**Given** a World ID nullifier is already stored in the database
**When** another registration attempt is made with the same nullifier
**Then** the system returns a specific error code and a user-friendly message
**And** the UI displays instructions on how to reset for the next demo judge.

## Epic 2: Autonomous Agent Integration (World AgentKit Bounty)

Enable AI agents to register as accountable clients, cryptographically linked to a verifiable human owner.

### Story 2.1: AgentKit Auth Middleware & Registration
As a system,
I want an authentication middleware for AI agents using World AgentKit,
So that I can ensure only authorized agents can interact with the HumanProof API.

**Acceptance Criteria:**

**Given** an incoming POST request to `/api/tasks` from an AI agent
**When** the request includes a valid AgentKit authentication header
**Then** the middleware extracts the agent's wallet address and allows the request to proceed
**And** invalid or missing headers result in a `401 Unauthorized` response.

### Story 2.2: AgentBook Lookup & Human Link (Fail-Soft)
As a system,
I want to verify an agent's registration in AgentBook and identify its human owner,
So that I can ensure bilateral cryptographic accountability even if the network is unstable.

**Acceptance Criteria:**

**Given** an authenticated agent request
**When** the system queries the AgentBook registry for the agent's wallet address
**Then** if the agent is found, the system retrieves and stores the associated Human World ID
**And** if AgentBook is unreachable or the agent is not found, the system still proceeds but flags the task as `[AgentBook Offline - Caution]` for the demo.

### Story 2.3: Agent Task Creation API
As an AI agent,
I want to create a task via a secure API,
So that I can autonomously delegate work to verified humans.

**Acceptance Criteria:**

**Given** I am an authenticated and registered agent
**When** I POST a task description, budget (HBAR), and deadline to `/api/tasks`
**Then** a new task record is created with a `Task ID`
**And** the Hedera escrow is initialized (mocked in initial phase)
**And** the response returns the `Task ID` and `Escrow TX ID`.

### Story 2.4: Visual Agent Identity Card
As a user (worker or judge),
I want to see a visual "Identity Card" for agent clients,
So that I can verify their cryptographic link to a human owner in the UI.

**Acceptance Criteria:**

**Given** I am viewing a task created by an AI agent
**When** I look at the "Client Info" section
**Then** I see the agent's wallet address and name from AgentBook
**And** I see the verified World ID of its human owner (if available)
**And** a clear status indicator shows if the AgentBook verification was successful or failed-soft.

### Story 2.5: Agent Task Status Polling & Validation API
As an AI agent,
I want to poll my task status and validate completions via API,
So that I can manage the delegation lifecycle without human intervention.

**Acceptance Criteria:**

**Given** I have a `Task ID` for an active task
**When** I GET `/api/tasks/{id}/status`
**Then** the system returns the current status (`open`, `claimed`, `completed`)
**And** when the status is `completed`, I can POST to `/api/tasks/{id}/validate` to trigger the final payment release.

## Epic 3: Task Marketplace & Lifecycle

Provide the infrastructure for task creation, discovery, and management between humans and agents.

### Story 3.1: Database Schema for Tasks
As a developer,
I want to implement the database schema for tasks and their lifecycle states,
So that I can store marketplace data persistently.

**Acceptance Criteria:**

**Given** the application requires persistent task storage
**When** the database is initialized
**Then** the `tasks` table is created with fields for `id`, `title`, `description`, `budget_hbar`, `deadline`, `status` (open, claimed, completed, validated, expired), `client_type` (human, agent), and associated nullifiers.

### Story 3.2: Human Client Task Creation (UI)
As a human client,
I want to create a task via a simple form,
So that I can solicit help from verified workers.

**Acceptance Criteria:**

**Given** I am a verified human client on the dashboard
**When** I fill in the task title, description, budget, and deadline and click "Create Task"
**Then** a new task record is created in the database with status `open` and `client_type=human`
**And** the Hedera escrow is initialized (mocked in initial phase).

### Story 3.3: Unified Task List View (Agent/Human Distinction)
As a worker,
I want to see a unified list of all available tasks with a clear distinction between agent and human clients,
So that I can choose which one I want to perform.

**Acceptance Criteria:**

**Given** I am a verified worker on the task list page
**When** I view the list of available tasks
**Then** I see the title, budget, and deadline for each task
**And** a clear badge indicates whether the client is a "Verified Human" or an "Autonomous Agent".

### Story 3.4: Task Claim Flow (Nullifier Check)
As a verified worker,
I want to claim an available task,
So that I can secure the work exclusively for myself.

**Acceptance Criteria:**

**Given** I am a verified worker with a valid session nullifier
**When** I click "Claim" on an available task
**Then** the system validates my nullifier server-side
**And** the task status changes to `claimed`, locking it to my nullifier
**And** the task is no longer visible as "available" to other workers.

### Story 3.5: Task Completion & Validation UI (with Delight!)
As a worker, I want to mark a task as complete, and as a client, I want to validate it with a celebration,
So that the payment process is triggered and I feel rewarded.

**Acceptance Criteria:**

**Given** I have a task in `claimed` status
**When** I (worker) click "Mark as Complete"
**Then** the status updates to `completed` and the client is notified (or polls for update)
**And** when the client clicks "Validate Completion", the system triggers the payment release (mocked)
**And** a "Confetti" celebration animation is shown on the screen for the worker/client.

## Epic 4: Agentic Payments & Escrow (Hedera Bounty)

Secure funds via programmable escrow and automate machine-speed payments with full Hashscan transparency.

### Story 4.1: Hedera Testnet Account & Server-Side Security
As a developer,
I want to configure the Hedera Testnet operator account server-side,
So that I can sign escrow and payment transactions securely without exposing keys to the client.

**Acceptance Criteria:**

**Given** the application requires Hedera network interaction
**When** the server-side environment variables `HEDERA_ACCOUNT_ID` and `HEDERA_PRIVATE_KEY` are configured
**Then** the Hedera Client is initialized on the Testnet
**And** all transaction signing occurs exclusively on the server.

### Story 4.2: Simulate Deposit Flow (Demo Robustness)
As a demo client,
I want to simulate an HBAR deposit in one click,
So that I can instantly fund my account for a demo task without using an external faucet.

**Acceptance Criteria:**

**Given** I am on my dashboard in demo mode
**When** I click "Simulate 50 HBAR Deposit"
**Then** the server-side platform account sends 50 HBAR to my internal balance/wallet (Hedera Transfer)
**And** my dashboard balance is updated instantly in the database.

### Story 4.3: Hedera Escrow Lock on Task Creation
As a system,
I want to lock HBAR in a platform escrow account during task creation,
So that I can guarantee payment to the worker upon completion.

**Acceptance Criteria:**

**Given** a client is creating a task with a specific HBAR budget
**When** the "Create Task" API is called
**Then** a Hedera Transfer transaction moves the budget from the client's balance to the platform escrow account
**And** the transaction `receipt` is obtained before the task is confirmed as `open` in the database
**And** the `escrow_tx_id` is stored with the task.

### Story 4.4: Hedera Payment Release on Validation
As a system,
I want to automatically release HBAR from the escrow to the worker's account upon validation,
So that I can deliver the "Aha Moment" of frictionless payment.

**Acceptance Criteria:**

**Given** a task status is changed to `validated` by the client
**When** the validation API triggers the payment flow
**Then** a Hedera Transfer transaction moves the budget from the platform escrow to the worker's account
**And** the task status is only finalized in the database after the Hedera transaction succeeds
**And** the `payment_tx_id` is stored with the task.

### Story 4.5: "Processing" UI with Hashscan Links
As a user,
I want to see a loading state and a link to Hashscan after a transaction,
So that I can verify the finality on the Hedera network.

**Acceptance Criteria:**

**Given** a Hedera transaction has been submitted
**When** the UI is waiting for the `receipt` (finality)
**Then** a "Processing on Hedera..." spinner or message is displayed
**And** once the transaction is finalized, a clickable "View on Hashscan" link appears with the correct transaction ID.

## Epic 5: Hackathon Demo & Operations

Ensure demo reliability, rapid reset capability, and visual cryptographic proof for judges.

### Story 5.1: Visual Audit Trail for Proofs (Identity, Agent, Hedera)
As a demo operator,
I want to see a visual "Audit Trail" of cryptographic events,
So that I can prove the underlying protocol integrations to judges without reading raw logs.

**Acceptance Criteria:**

**Given** a task lifecycle event (World ID check, AgentBook lookup, Hedera TX)
**When** I view the "Audit Trail" section in the admin/task detail view
**Then** I see clear visual indicators: `[World ID Verified: ✅]`, `[AgentBook Checked: ✅]`, `[Hedera Payment: ✅]`
**And** clicking on an indicator reveals the underlying raw log or TX hash for deep-dive proof.

### Story 5.2: Judges Dashboard for Fast Switching
As a demo operator,
I want a hidden "Judges Dashboard" with one-click session switching,
So that I can present all three bounty flows (Worker, Human Client, AI Agent) in under 5 minutes.

**Acceptance Criteria:**

**Given** I am on the "Judges Dashboard" page
**When** I click "Login as Kenji (Worker)", "Login as Sophie (Client)", or "Trigger Agent Aria"
**Then** the system instantly switches my session and redirects me to the appropriate landing page
**And** no manual email/password entry is required for the pre-seeded demo accounts.

### Story 5.3: /admin Reset & Debug Route (Looping Demo)
As a demo operator,
I want an `/admin/reset` route that clears all data and nullifiers,
So that the platform is ready for a new judge in less than 5 seconds.

**Acceptance Criteria:**

**Given** the database is populated with previous demo data
**When** I call the `/api/admin/reset` endpoint (protected by a debug key)
**Then** all tasks, user balances, and World ID nullifiers are purged
**And** the platform returns to its initial "Greenfield" state for the next judge to try.
