# HumanProof — Plan d'exécution hackathon

> ETHGlobal Cannes 2026 · ~24h · 4 devs · 3 bounties ciblées

---

## Équipe & Ownership

| Dev | Rôle | Epics owned |
|-----|------|-------------|
| **Florian** | Orchestration, scaffolding, API core | Epic 3 (marketplace) + coordination |
| **Sacha** | Backend World ID + Hedera | Epic 1 (identity) + Epic 4 (payments) |
| **Pierre** | Agent demo CLI | Epic 2 (AgentKit) |
| **Noa** | UI / CSS uniquement | Epic 5 (demo ops) + UI polish sur 1.4, 3.3, 4.5 |

---

## Stack technique

- **Framework:** Next.js App Router (TypeScript)
- **UI:** Tailwind + shadcn/ui
- **DB:** Drizzle ORM + PostgreSQL
- **API:** tRPC
- **Identity:** World ID 4.0 (`@worldcoin/idkit`)
- **Agents:** World AgentKit (`@worldcoin/agentkit`)
- **Payments:** Hedera Testnet (`@hashgraph/sdk` + `hedera-agent-kit`)

---

## Checkpoints

| Heure | Objectif |
|-------|----------|
| **H0** | Projet initialisé, env vars en place, DB migrée, tout le monde a cloné |
| **H8** | Chaque P0 story testable indépendamment (mock mode actif) |
| **H16** | Flow end-to-end complet en staging (worker → task → agent → hedera → payment) |
| **H20** | Demo loop fonctionnelle : reset → 3 juges en 5 min chacun |
| **H24** | Cut & polish, README, video demo |

---

## Dépendances critiques (ordre de démarrage)

```
Story 1.1 (mock mode + DB)  ←── TOUT LE MONDE EN DÉPEND — Sacha/Florian en premier
Story 3.1 (DB schema tasks) ←── Epic 2, 3, 4 en dépendent — Florian démarre en parallèle
Story 2.1 (AgentKit middleware) ←── Indépendant — Pierre peut démarrer seul
Story 4.1 (Hedera config) ←── Indépendant du reste — Sacha en parallèle de 1.x
Noa démarre sur 1.4 dès que Sacha pousse story 1.3
```

---

## Plan par dev

### Florian — Epic 3 : Task Marketplace
**Ordre :** 3.1 → 3.2 → 3.3 → 3.4 → 3.5

| Story | Description | Dépend de |
|-------|-------------|-----------|
| 3.1 | DB schema tasks | 1.1 |
| 3.2 | Task creation UI (human client) | 3.1 |
| 3.3 | Task list view (agent/human badge) | 3.1 |
| 3.4 | Task claim flow (nullifier check) | 1.3, 3.1 |
| 3.5 | Mark Complete + Validate + confetti | 3.4 |

---

### Sacha — Epic 1 + Epic 4 : Identity & Payments
**Ordre :** 1.1 → 4.1 → 1.2 → 1.3 → 4.2 → 4.3 → 1.4 → 4.4 → 4.5 → 1.5

| Story | Description | Priorité |
|-------|-------------|----------|
| 1.1 | World ID staging + mock mode + DB init | **CRITIQUE — H0** |
| 4.1 | Hedera testnet account + server-side key | P0 |
| 1.2 | Worker registration IDKit widget | P0 |
| 1.3 | Server-side proof validation + session | P0 |
| 4.2 | Simulate Deposit flow | P0 demo |
| 4.3 | Hedera escrow lock on task creation | P0 |
| 1.4 | User profile + verified badge | P1 |
| 4.4 | Hedera payment release on validation | P0 |
| 4.5 | Processing UI + Hashscan links | P1 |
| 1.5 | Judge-friendly error handling | P1 demo |

---

### Pierre — Epic 2 : Agent Integration
**Ordre :** 2.1 → 2.3 → 2.5 → 2.2 → 2.4

| Story | Description | Notes |
|-------|-------------|-------|
| 2.1 | AgentKit auth middleware | Peut démarrer H0 |
| 2.3 | Agent task creation API | Dépend de 3.1 + 2.1 |
| 2.5 | Agent polling + validation API | Dépend de 3.4 |
| 2.2 | AgentBook lookup + human owner link | Fail-soft si unreachable |
| 2.4 | Visual agent identity card (UI) | Coordination avec Noa |

> **Note Pierre :** Story 2.2 (AgentBook) est en fail-soft — si AgentBook est unreachable, le système continue avec un flag `[AgentBook Offline - Caution]`. Ne bloque pas le reste.

---

### Noa — Epic 5 + UI polish
**Ordre :** attendre H8 → 5.2 → 5.1 → 5.3 → polish

| Story | Description | Dépend de |
|-------|-------------|-----------|
| 5.2 | Judges dashboard (session switching) | 1.3 |
| 5.1 | Visual audit trail (World ID / AgentKit / Hedera) | 1.3, 2.2, 4.3 |
| 5.3 | /admin reset route | 1.3 |
| UI polish | Badge "Human Verified" (1.4), task list badges (3.3), Hashscan links (4.5) | Coordination Sacha/Florian |

> **Note Noa :** Tu démarres dès que Sacha pousse story 1.3. En attendant, prépare la charte graphique et les composants shadcn de base.

---

## Workflow individuel (chaque dev)

### Prérequis : installer Claude Code

Claude Code est l'outil IA qu'on utilise pour développer. Il lit le code, écrit du code, exécute des commandes, et suit les specs.

```bash
# Installer Claude Code (une seule fois)
pnpm install -g @anthropic-ai/claude-code

# Lancer dans le dossier du projet
cd humanproof
claude
```

Une fois lancé, tu es dans un terminal interactif. Tu tapes des commandes `/` pour déclencher des workflows.

---

### Boucle de dev pour chaque story

**Étape 1 — Créer une branche Git**

```bash
git checkout main
git pull
git checkout -b story/X-Y-nom-court
# Exemple : git checkout -b story/1-1-world-id-mock-mode
```

**Étape 2 — Préparer la story avec Claude Code**

Dans Claude Code, tape :
```
/bmad-create-story
```
Quand Claude te demande quelle story, réponds :
```
create story X.Y
```
Claude va lire les specs et générer un fichier de story détaillé dans `_bmad-output/implementation-artifacts/stories/`. Ce fichier contient exactement ce qu'il faut implémenter — lis-le avant de coder.

**Étape 3 — Implémenter avec Claude Code**

Dans Claude Code, tape :
```
/bmad-dev-story
```
Quand Claude te demande, réponds :
```
dev story _bmad-output/implementation-artifacts/stories/X-Y-nom-story.md
```
Claude va lire la story, poser des questions si nécessaire, puis coder l'implémentation. Tu valides chaque action importante.

**Étape 4 — Mettre à jour le sprint-status.yaml**

Ouvre `_bmad-output/implementation-artifacts/sprint-status.yaml` et change le statut de ta story :
```yaml
1-1-setup-world-id-staging-and-mock-mode: in-progress   # pendant que tu codes
# puis quand c'est prêt pour review :
1-1-setup-world-id-staging-and-mock-mode: review
```

**Étape 5 — Committer et ouvrir une PR**

Dans Claude Code, tape :
```
/commit
```
Claude génère un message de commit propre automatiquement. Ensuite, push ta branche et ouvre une PR sur GitHub :
```bash
git push -u origin story/X-Y-nom-court
```
Sur GitHub → "Compare & pull request" → assigne **Florian** comme reviewer.

**Étape 6 — Après la review**

Une fois la PR approuvée par Florian, merge dans `main` et supprime la branche.
```bash
git checkout main && git pull
```
Mets à jour le sprint-status.yaml : `review → done`

---

### Résumé des commandes Claude Code utiles

| Commande | Ce que ça fait |
|----------|----------------|
| `/bmad-create-story` | Génère le fichier de specs détaillé pour une story |
| `/bmad-dev-story` | Implémente une story à partir de son fichier de specs |
| `/commit` | Crée un commit propre avec un message automatique |
| `/bmad-sprint-status` | Affiche l'état du sprint (qui fait quoi, où en est-on) |

---

### Conventions de nommage des branches

```
story/[epic]-[story]-[nom-court]

Exemples :
  story/1-1-world-id-mock-mode
  story/2-1-agentkit-middleware
  story/3-1-db-schema-tasks
  story/4-3-hedera-escrow
  story/5-3-admin-reset
```

---

## Variables d'environnement requises (`.env.local`)

```bash
# World ID
RP_SIGNING_KEY=           # depuis developer.world.org
RP_ID=                    # depuis developer.world.org
NEXT_PUBLIC_APP_ID=       # depuis developer.world.org
NEXT_PUBLIC_MOCK_WORLDID= # "true" en dev, "false" en prod/demo

# Hedera
HEDERA_ACCOUNT_ID=        # depuis portal.hedera.com
HEDERA_PRIVATE_KEY=       # ECDSA private key

# World AgentKit
AGENTKIT_APP_ID=          # depuis developer.world.org

# DB
DATABASE_URL=             # PostgreSQL connection string

# Demo
ADMIN_RESET_KEY=          # clé secrète pour /api/admin/reset
```

---

## Artefacts de référence

| Document | Chemin |
|----------|--------|
| PRD complet | `_bmad-output/planning-artifacts/prd.md` |
| Architecture | `_bmad-output/planning-artifacts/architecture.md` |
| Epics & stories | `_bmad-output/planning-artifacts/epics.md` |
| UX design | `_bmad-output/planning-artifacts/ux-design.md` |
| Sprint status | `_bmad-output/implementation-artifacts/sprint-status.yaml` |
| Docs World ID 4.0 | `docs/tracks/world-id-4.md` |
| Docs AgentKit | `docs/tracks/world-agent-kit.md` |
| Docs Hedera | `docs/tracks/hedera-agentic-payments.md` |

---

## Règles de base

1. **Une story = une branche = une PR.** Pas de commits fourre-tout sur `main`.
2. **Florian review toutes les PRs.** Assign-le systématiquement. Pas de merge sans review.
3. **Mock mode d'abord.** `NEXT_PUBLIC_MOCK_WORLDID=true` jusqu'à H16. On bascule en staging ensemble.
4. **Hedera Testnet uniquement.** Jamais mainnet.
5. **Jamais de clé privée dans le code.** Tout dans `.env.local`, jamais commité (il est dans `.gitignore`).
6. **Sprint-status.yaml = tableau de bord partagé.** Chacun met à jour son statut dans sa PR.
7. **Si tu es bloqué >30min**, tu le dis en channel et on re-priorise. Pas de héros solitaires à 3h du mat.
