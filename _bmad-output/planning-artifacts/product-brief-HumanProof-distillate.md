---
title: "Product Brief Distillate: HumanProof"
type: llm-distillate
source: "product-brief-HumanProof.md"
created: "2026-04-03"
updated: "2026-04-03"
version: "0.3"
purpose: "Token-efficient context for downstream PRD creation"
---

# HumanProof — Detail Pack (v0.3)

## Core Positioning

- Strictly "RentAHuman.ai with trust" — not competing with Fiverr, Upwork, Scale AI
- The competitive frame is always RentAHuman.ai
- Grand public consumer web platform (not a B2B protocol, not a Mini App)

## Team & Constraints

- 4-person team: Florian (product/generalist), Sacha (AI-oriented, light fullstack), Pierre (blockchain-oriented, non-technical), Noa (very weak dev)
- All 4 have Claude Code — primary dev acceleration
- 30-hour build window (ETHGlobal Cannes 2026)
- Weak on pure engineering execution — keep implementation scope tight

## Technical Stack (v0.3 — Confirmed)

- **Frontend:** Next.js (React) — web app
- **Worker + human client verification:** World ID 4.0 (Orb-verified), proof validation server-side on HumanProof backend (NOT on-chain — per World ID 4.0 bounty requirement: "web backend or smart contract")
- **AI agent clients:** World AgentKit (docs.world.org/agents/agent-kit/integrate) — agents linked to World ID owner, distinguishes human-backed agents from bots; this is World's own AgentKit, NOT Coinbase's
- **Payments / escrow:** Hedera — Hedera Agent Kit + x402 payment standard + OpenClaw Agent Commerce Protocol (any combination); native token ops, sub-second finality, sub-cent fees
- **NO MiniKit / World App / Mini App** — web app only
- **NO Coinbase AgentKit** — using World's AgentKit only
- **NO Solidity smart contracts** — Hedera native preferred
- **NO Circle USDC** — not targeting Circle bounty; payment currency is HBAR or Hedera-native

## Bounties Targeted (v0.3)

| Bounty | Amount | Key Requirement |
|--------|--------|-----------------|
| World — Best use of AgentKit | $4k / $2.5k / $1.5k | Must use World AgentKit to distinguish human-backed agents from bots. World ID or MiniKit alone does NOT qualify. |
| World — Best use of World ID 4.0 | $4k / $2.5k / $1.5k | World ID 4.0 as real constraint. Proof validation in web backend or smart contract. |
| Hedera — AI & Agentic Payments | $3k (1 of 2 teams) | Real payment flows between agents or agents and services on Hedera |

- **Best case total:** $4k + $4k + $3k = **$11k**
- **Minimum total:** $1.5k + $1.5k + $3k = **$6k**
- Critical: AgentKit bounty requires BOTH World AgentKit integration AND meaningful differentiation from bots — not just adding it cosmetically

## MVP Scope (Confirmed In)

- Worker onboarding: World ID 4.0 Orb-verified registration, profile creation (skills, rate, availability, location)
- Task creation: human client (World ID verified) posts task + budget + deadline → Hedera escrow
- Task creation: AI agent (World AgentKit) posts task + funds escrow autonomously on Hedera
- Task claim: verified worker claims task (World ID nullifier checked server-side)
- Completion: worker submits proof of completion
- Validation: client (human or agent) validates → payment auto-released via Hedera
- Reputation: basic score per successful task, tied to World ID

## Dispute Resolution (Explicitly Deferred)

- v1: time-based auto-resolution only — no validation within deadline = funds return to client automatically
- No arbitration in v1 — known gap, stated openly
- v2: on-chain arbitration design TBD
- Do NOT propose arbitration as v1 requirement in PRD

## Rejected Ideas (Do Not Re-Propose)

- **RLHF / AI evaluation tasks** as positioning angle
- **Token / platform incentives** — v1 out of scope
- **Advanced reputation features** — basic only
- **Mobile-native app**
- **Smart contract escrow (Solidity)** — Hedera native preferred
- **Coinbase AgentKit** — replaced by World AgentKit
- **Circle USDC / Circle bounty** — not targeted
- **World Mini App / MiniKit** — web app only

## Business Model

- Not a priority for hackathon — no commission rate decided
- PRD must not include monetization requirements for v1

## Open Questions for PRD

- **World ID 4.0 integration:** Exact web SDK flow for proof verification in Next.js backend — needs tech spike against World ID 4.0 docs
- **World AgentKit:** What does the agent identity flow look like? How does an agent authenticate itself as World AgentKit-backed when posting a task? Needs doc review
- **Hedera escrow mechanism:** Scheduled transactions? HTS token locking? Multi-sig? Needs architecture decision
- **Proof of completion:** How does a worker prove a task is done? (Photo, text, external link, attestation?) — not defined
- **Agent auto-validation:** How does an AgentKit agent validate completion? Fixed criteria schema at task creation, or agent-defined logic?
- **World ID nullifier check server-side:** Does this require a backend World ID API call or is it a ZK proof verified locally?
- **Worker "available" status:** Real-time or self-declared?
- **Spam prevention:** Min/max task budget? Rate limits on task creation?

## Supporting Data Points

- RentAHuman.ai: launched February 2026, 600k signups, 4M visits, ~83 real profiles visible
- 32.7% of RentAHuman.ai tasks fraudulent — source: arxiv.org/html/2602.19514v1
- World AgentKit docs: docs.world.org/agents/agent-kit/integrate
- World ID 4.0 docs: docs.world.org/world-id/overview
- Hedera: sub-second finality, predictable sub-cent fees, native token ops
