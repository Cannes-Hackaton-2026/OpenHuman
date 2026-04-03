---
title: "Product Brief: HumanProof"
status: "complete"
created: "2026-04-03"
updated: "2026-04-03"
version: "0.3"
inputs: ["HumanProof White Paper v0.1", "ETHGlobal Cannes submission template", "founder interviews", "World AgentKit docs", "Hedera AI & Agentic Payments bounty", "World AgentKit bounty", "World ID 4.0 bounty"]
changes_from_v02: "Clarified AgentKit: using World AgentKit (not Coinbase). Added World AgentKit bounty + World ID 4.0 bounty. Hedera for payments only. Updated total bounty potential."
---

# Product Brief: HumanProof

## Executive Summary

RentAHuman.ai exploded in February 2026 — 600,000 signups and 4 million visits in days, proving that there is real, urgent demand for a marketplace where AI agents hire humans to complete tasks machines cannot do alone. But the platform is built on sand: no human verification, anonymous clients, no payment protection, and 32.7% of documented tasks categorized as fraudulent (credential fraud, identity impersonation, social manipulation).

HumanProof is the trusted version of that idea. Every worker is a unique, biometrically verified human via World ID 4.0. Every AI agent client is a World AgentKit-authenticated agent, cryptographically distinguishable from bots and linked to an accountable human owner. Every payment settles on Hedera — sub-second finality, sub-cent fees, agentic payment infrastructure that operates at machine speed.

Built as a web application, HumanProof is the first marketplace where the question "am I dealing with a real human or a bot?" has a cryptographic answer on both sides of every transaction. The market exists. Trust is the missing layer. HumanProof provides it.

---

## The Problem

RentAHuman.ai exposed a structural breakdown in human-AI collaboration at scale. The platform has no identity layer and no payment protection:

**For workers:** Anyone can create a profile — humans, bots, account farms. Of 600,000 announced signups, fewer than 100 profiles were verifiably real. Workers take all the payment risk with no escrow protection; they complete tasks with no guarantee of being paid.

**For clients:** Clients are fully anonymous. 32.7% of tasks documented as abusive — credential fraud, authentication circumvention, referral fraud, social media manipulation. An AI agent has no way to know if the "human" it hired is real. A platform has no way to enforce accountability.

**For AI agents specifically:** As autonomous agents proliferate, they need to hire humans for tasks requiring physical presence, authentic judgment, or real-world action. But without identity infrastructure, agents cannot distinguish verified humans from bots — and cannot prove they themselves are legitimate, accountable agents rather than automated scripts.

**The core failure:** When everyone can be fake and nobody is accountable, the marketplace degrades into a fraud surface. The more successful it gets, the worse the problem becomes.

---

## The Solution

HumanProof introduces a complete trust and payment layer built for the agentic era:

**1. Verified Workers (World ID 4.0)**
Every worker must hold a World ID 4.0 Orb-verified credential — biometric proof of unique humanness via zero-knowledge proofs. One human, one profile, mathematically enforced. Proof validation occurs server-side on the HumanProof backend. Bots cannot register. Account farms cannot operate. The "Human Verified" badge means something because it's cryptographically enforced, not self-declared.

**2. Identified Human Clients (World ID 4.0)**
Human clients verify via World ID 4.0 before posting tasks. Both sides of every human-to-human transaction are known and accountable.

**3. AI Agent Clients (World AgentKit)**
AI agents participate as first-class clients via World AgentKit — the protocol that meaningfully distinguishes human-backed agents from bots or automated scripts. Each agent is cryptographically linked to the World ID of its human owner. For the first time, both workers and clients know exactly who they are dealing with: the worker is a verified human, the client agent is backed by an identified, accountable person.

**4. Machine-Speed Payments (Hedera)**
Payments flow through Hedera's agentic payment infrastructure — Hedera Agent Kit, the x402 payment standard, and/or OpenClaw's Agent Commerce Protocol. Sub-second finality and sub-cent fees make autonomous agent-to-human payment flows practical at scale. When a task is posted, funds are held in escrow. On validated completion, payment releases instantly. No validation within the deadline triggers an automatic refund.

**5. Portable, Permanent Reputation**
Every completed task contributes to an on-chain reputation score tied to the worker's World ID — not to a platform account. Unlike Fiverr or Upwork, this reputation cannot be revoked, reset, or taken away. Workers own it. It follows them. Because it's cryptographically linked to a unique human identity, it cannot be gamed.

---

## What Makes This Different

**The moat is cryptographic, not operational.** RentAHuman.ai cannot add a "verification step" — its entire user base would need to be re-verified and its payment system rebuilt from scratch. HumanProof is built trust-first by design.

**World AgentKit makes agents accountable.** No existing marketplace distinguishes human-backed agents from automated scripts at the protocol level. With World AgentKit, every agent client on HumanProof has an identified human owner. This is not a UI feature — it's a cryptographic guarantee.

**World ID 4.0 means proof of human is real.** Proof validation happens server-side on every action that requires it — registration, task posting, task claiming. The system breaks without it, by design.

**Hedera makes agent-to-human payments practical.** Traditional payment rails are too slow and expensive for machine-speed agentic commerce. Hedera's native token operations provide the infrastructure the agentic economy actually needs.

**Bilateral accountability is novel.** Workers know their client is a real, accountable agent. Agents know their worker is a verified human. No existing platform provides this symmetry.

---

## Who This Serves

**Workers — verified humans seeking task income**
Freelancers, gig workers, and individuals with real-world capabilities. Their core need: the job is real, the client is accountable, the payment is guaranteed. The aha moment is the first completed task that pays out automatically — no fake clients, no payment uncertainty, no bad surprises.

**Human Clients — people who need human tasks done**
Individuals and operators who need physical presence, authentic human judgment, or trust-sensitive work AI cannot replicate. They need verified humans, not bots or account farms.

**AI Agent Clients — autonomous agents acting on behalf of their owners**
Agents that need to delegate tasks requiring physical presence, human cognition, or real-world action. Via World AgentKit, they participate as accountable clients. Via Hedera, they pay autonomously at machine speed. Their owners are cryptographically identifiable and responsible for what they commission.

---

## Network Effects

HumanProof is a two-sided marketplace between verified humans and accountable AI agents. As agent proliferation accelerates, the value of accessing verified humans increases — more agents drive demand for workers, more workers attract more agents and human clients.

Reputation scores are permanent and non-resettable: reliable workers build history that attracts better clients, bad actors cannot reset their record, and workers carry their reputation forever. It belongs to them, not to the platform.

---

## Success Criteria

**Hackathon (30h MVP):**
- End-to-end flows: worker registration (World ID 4.0), task creation with Hedera escrow, task claim, completion, payment release
- AI agent client flow via World AgentKit demonstrated
- World ID 4.0 proof validation running server-side
- Live web app

**Post-hackathon (if this continues):**
- Worker activation rate: % of registered workers who complete at least one task
- Task completion rate: % of funded tasks reaching validated completion
- Fraud rate: target <1% vs. RentAHuman.ai's 32.7%
- Agent adoption: number of distinct AgentKit agents using the platform

---

## Scope

**In for MVP:**
- Worker onboarding with World ID 4.0 Orb verification (server-side proof validation)
- Task creation with Hedera escrow (human client, World ID verified)
- AI agent task creation and payment via World AgentKit + Hedera
- Task claim, completion submission, payment release
- Basic reputation score tied to World ID

**Dispute resolution in v1:** Time-based auto-resolution — if client does not validate within deadline, funds return automatically. No arbitration in v1. Full dispute resolution is a v2 design problem.

**Out for MVP:**
- Dispute arbitration mechanism
- Token / platform incentives
- Advanced reputation features
- Mobile-native app

---

## Vision

HumanProof starts as the trusted alternative to RentAHuman.ai — the platform that actually works, where fake accounts and bad surprises are structurally impossible. In 2-3 years, it becomes the canonical trust layer for human-AI collaboration: the marketplace where verified humans and accountable agents transact at scale.

The long-term bet: as AI agents automate more digital and cognitive work, the tasks that remain irreducibly human — physical presence, authentic judgment, cultural nuance, trust-sensitive interaction — become more valuable, not less. HumanProof, built on World ID 4.0 and Hedera's agentic payment rails, owns that market.
