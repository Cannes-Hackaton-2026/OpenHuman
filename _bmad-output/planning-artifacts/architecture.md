---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
workflowType: 'architecture'
lastStep: 8
status: 'complete'
completedAt: '2026-04-04'
inputDocuments: [
  "_bmad-output/planning-artifacts/prd.md",
  "_bmad-output/planning-artifacts/product-brief-HumanProof.md",
  "_bmad-output/planning-artifacts/product-brief-HumanProof-distillate.md",
  "_bmad-output/planning-artifacts/epics.md",
  "docs/tracks/hedera-agentic-payments.md",
  "docs/tracks/world-agent-kit.md",
  "docs/tracks/world-id-4.md"
]
project_name: 'HumanProof'
user_name: 'Florian'
---

# Architecture Decision Document

...

## Starter Template Evaluation

### Primary Technology Domain
**Full-stack Web3 Marketplace** nécessitant une interopérabilité humains-agents de haut niveau.

### Starter Options Considered
- **Next.js Standard (create-next-app) :** Sélectionné pour son contrôle total, indispensable pour l'implémentation d'un serveur MCP custom et l'intégration World ID.
- **T3 Stack :** Écarté pour éviter les abstractions d'auth pré-configurées incompatibles avec le modèle de nullifier World ID.

### Selected Starter: Next.js Custom Stack (Drizzle + tRPC + MCP + shadcn)

**Rationale for Selection:**
Cette stack maximise la vélocité de développement (Tailwind/shadcn/tRPC) tout en offrant une innovation de rupture avec le support natif du protocole MCP pour les agents IA. L'utilisation de Drizzle garantit une base de données légère et ultra-typée.

**Initialization Commands:**

```bash
# 1. Base Next.js avec Tailwind et ESLint
npx create-next-app@latest . --typescript --eslint --app --no-src-dir --tailwind --import-alias "@/*"

# 2. UI Components (shadcn/ui)
npx shadcn-ui@latest init

# 3. Backend & DB Tools
npm install drizzle-orm postgres @trpc/server @trpc/client @trpc/react-query @trpc/next @tanstack/react-query zod
npm install -D drizzle-kit

# 4. MCP SDK (Model Context Protocol)
npm install @modelcontextprotocol/sdk
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
TypeScript 5.x sur Node.js 20+. Type-safety de bout en bout via tRPC et Drizzle.

**Styling Solution:**
Tailwind CSS pour le styling rapide et utilitaire, couplé à shadcn/ui pour des composants UI de haute qualité (Radix UI).

**Build Tooling:**
Next.js App Router (Webpack/Turbopack). Optimisation automatique des assets et des Server Components.

**Testing Framework:**
Vitest + Playwright (recommandé pour le MVP).

**Code Organization:**
- `/app` : Routing et Server Components.
- `/server` : Schémas Drizzle, procédures tRPC et logique MCP.
- `/components` : Composants UI réutilisables (shadcn).
- `/lib` : SDKs World ID, AgentKit et Hedera.

**Development Experience:**
HMR (Hot Module Replacement) ultra-rapide, tRPC hooks pour les requêtes typées, et Drizzle Studio pour la visualisation DB.

**Note:** L'initialisation du projet et du serveur MCP SSE sera la première "Implementation Story".

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- **Authentication :** World ID 4.0 via IDKit + Middleware JWT custom (jose) stocké dans un cookie HTTP-only sécurisé.
- **Database Architecture :** PostgreSQL managé (Neon/Supabase) avec Drizzle ORM.
- **Agent Integration :** MCP Server (SSE) avec authentification via un Handshake sécurisé par AgentKit.

**Important Decisions (Shape Architecture):**
- **Migration Strategy :** Utilisation de `drizzle-kit push:pg` pour une itération de schéma ultra-rapide (Hackathon Mode).
- **Communication Pattern :** tRPC pour l'UI interne, MCP Tools/Resources pour les agents IA externes.
- **UI Architecture :** Tailwind CSS + shadcn/ui pour les composants, `sonner` pour les notifications transactionnelles Hedera.

**Deferred Decisions (Post-MVP):**
- **Dispute Resolution :** Logique de séquestre manuelle via `/admin` pour le hackathon.
- **Portable Reputation :** Implémenté comme une simple chaîne `tasks_completed` en DB pour l'instant.

### Data Architecture
- **Database :** PostgreSQL (Neon) v16+.
- **ORM :** Drizzle ORM (Type-safe, headless).
- **Validation :** Zod comme source unique de vérité pour les schémas tRPC, MCP et DB.
- **Migrations :** Stratégie de "Push" immédiat pour éviter les frictions de développement en 30h.

### Authentication & Security
- **Human Auth :** World ID IDKit (Staging). Validation server-side du nullifier + création d'un JWT sécurisé.
- **Agent Auth :** Signature AgentKit validée au handshake initial, session token temporaire pour le flux MCP SSE.
- **Secrets Management :** Environnement isolé via `.env`. Clés privées Hedera et AgentKit strictement côté serveur.

### API & Communication Patterns
- **Internal :** tRPC (procédures typées pour l'UI Next.js).
- **Agent Interface :** MCP Server implémenté via un `ToolRegistry` modulaire permettant une parallélisation du développement des outils (Identity, Tasks, Payments).
- **Transport :** SSE (Server-Sent Events) pour le flux bidirectionnel entre les agents Aria et le serveur.

### Frontend Architecture
- **State :** TanStack Query (intégré à tRPC).
- **UI Components :** shadcn/ui (Radix + Lucide).
- **Feedback :** Toasts interactifs (`sonner`) avec liens Hashscan cliquables pour les transactions Hedera.

### Infrastructure & Deployment
- **Hosting :** Vercel (Next.js Edge/Serverless functions).
- **Database :** Neon (PostgreSQL managé avec branchement).

### Decision Impact Analysis

**Implementation Sequence:**
1. Initialisation Next.js + Tailwind + shadcn.
2. Setup Drizzle + Neon (Schéma `users`, `tasks`, `nullifiers`).
3. Implémentation du Middleware JWT pour World ID.
4. Création du `ToolRegistry` MCP et du premier outil de découverte.
5. Intégration Hedera (Escrow/Payment) dans les procédures tRPC et les outils MCP.

**Cross-Component Dependencies:**
Le `ToolRegistry` MCP dépend de l'authentification AgentKit pour autoriser les appels d'outils, et les procédures tRPC partagent les mêmes schémas Zod que les outils MCP pour garantir la cohérence des données.

## Implementation Patterns & Consistency Rules

### Naming Patterns

**Database Naming (Drizzle):**
- Tables : `snake_case` et pluriel (ex: `human_users`, `task_records`).
- Colonnes : `snake_case` (ex: `user_nullifier`, `created_at`).

**API Naming (tRPC & MCP):**
- Procédures tRPC : `camelCase` (ex: `getUserProfile`).
- Outils MCP : `snake_case` (ex: `create_task`, `get_identity`).

**Code Naming (TS/React):**
- Composants UI : `PascalCase` (ex: `UserCard.tsx`).
- Fonctions & Variables : `camelCase` (ex: `isVerified`).
- Fichiers utilitaires : `kebab-case` (ex: `auth-middleware.ts`).

### Structure Patterns

**Project Organization (Feature-Driven):**
- `/app` : Routes Next.js uniquement.
- `/features/[feature-name]` : Logique, composants et hooks spécifiques à un domaine (ex: `/features/identity`).
- `/lib/core` : Centralisation des wrappers de SDKs tiers (Hedera, World ID, AgentKit).
- `/server` : Schémas Drizzle et routeurs tRPC.
- `/components/ui` : Composants atomiques shadcn/ui.

**Testing Placement:**
- Tests co-localisés avec le code source (`*.test.ts`) pour une visibilité immédiate.

### Styling & CSS Rules (Tailwind Strict)

**Règles obligatoires :**
- **Utilitaire-uniquement :** Interdiction d'utiliser du CSS pur, du CSS-in-JS ou des fichiers `.css` arbitraires.
- **Exceptions :** Seul le fichier `globals.css` (configuré par shadcn) est autorisé pour les variables de thème.
- **Réutilisation :** Les motifs visuels répétés doivent être extraits dans des composants React, jamais dans des classes CSS globales.

### Rendering Strategy Patterns

**Server vs Client Components :**
- **Priorité au Server Components :** Les pages, les layouts et le fetch de données initial doivent être des Server Components.
- **Usage du Client Components :** Limité à l'interactivité (formulaires, boutons avec `onClick`, toasts de notifications, hooks `useState/useEffect`).

### Format & Communication Patterns

**Error Handling :**
- Utilisation systématique de `TRPCError` côté serveur avec des messages formatés pour être compréhensibles par l'utilisateur (Human-First Error Messages).
- Wrapper centralisé pour formater les erreurs de protocoles tiers (ex: traduire une erreur Hedera technique en un message d'action utilisateur).

**Data Formats :**
- Schémas **Zod** stockés dans `/lib/validations` servant de source unique de vérité pour la DB, tRPC et MCP.
- Dates échangées en chaînes ISO8601, stockées en UTC.

### Enforcement Guidelines

**Tous les agents IA DOIVENT :**
- Vérifier l'existence d'un schéma Zod dans `/lib/validations` avant de créer une nouvelle structure de données.
- Utiliser les composants `ui` de shadcn pour toute nouvelle interface.
- Respecter strictement la séparation `/lib/core` pour les interactions Web3.

## Project Structure & Boundaries

### Complete Project Directory Structure

```text
humanproof/
├── README.md
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── drizzle.config.ts
├── .env.local
├── .env.example
├── .gitignore
├── app/                        # Routes Next.js uniquement (App Router)
│   ├── globals.css             # Thème global shadcn
│   ├── layout.tsx              # Root Layout avec tRPC Provider
│   ├── page.tsx                # Landing Page
│   ├── (auth)/                 # login, register
│   ├── tasks/                  # Marketplace Views
│   ├── profile/                # User Profile
│   ├── admin/                  # Judges Dashboard (Protected)
│   └── api/                    # API Routes (tRPC, MCP, Callbacks)
├── components/                 # UI Components
│   ├── ui/                     # Shadcn/ui atomics
│   └── layout/                 # Global layout parts
├── features/                   # Logique métier par domaine
│   ├── identity/               # World ID & JWT Logic
│   ├── agents/                 # Handshake & AgentBook services
│   ├── tasks/                  # State machine & Task UI
│   └── payments/               # Hedera implementation & Confetti
├── lib/                        # Coeur & Utilitaires
│   ├── core/                   # Wrappers SDK (Hedera, WorldID, AgentKit)
│   ├── schemas/                # Zod schemas (Source of Truth)
│   ├── db/                     # Drizzle Client
│   └── trpc/                   # tRPC Config
├── server/                     # Backend Logic
│   ├── db/
│   │   └── schema.ts           # Drizzle schema (snake_case)
│   ├── mcp/                    # MCP Server Tools & Logic
│   ├── routers/                # tRPC Routers
│   └── context.ts              # Shared Context (Auth info)
├── public/                     # Static assets
└── tests/                      # E2E & Unit tests
```

### Architectural Boundaries

**API Boundaries:**
- **tRPC (Internal):** Communication typée entre l'UI Next.js et le serveur. Pas de endpoints REST manuels.
- **MCP SSE (External Agents):** Point d'entrée unique pour les agents Aria via le protocole Model Context Protocol.
- **Webhook/Callbacks:** Restreints au dossier `app/api/auth/worldid/`.

**Component Boundaries:**
- Les composants dans `components/ui` sont agnostiques au domaine.
- La logique métier est strictement encapsulée dans `features/`.

### Requirements to Structure Mapping

**Epic 1: Identity & Human Verification**
- `/features/identity/`, `server/routers/auth.ts`, `lib/core/worldid.ts`

**Epic 2: Autonomous Agent Integration (MCP)**
- `/server/mcp/`, `/app/api/mcp/`, `lib/core/agentkit.ts`

**Epic 3: Task Marketplace & Lifecycle**
- `/features/tasks/`, `server/routers/task.ts`, `app/tasks/`

**Epic 4: Agentic Payments & Escrow**
- `/features/payments/`, `server/routers/payment.ts`, `lib/core/hedera.ts`

### Integration Points

**Internal Communication:**
Utilisation systématique de tRPC. Le `context.ts` extrait le nullifier du JWT pour toutes les procédures protégées.

**External Integrations:**
Wrappers isolés dans `lib/core/` pour faciliter le "Mock-First" et le remplacement par les vrais SDKs.

**Data Flow:**
Schéma Zod (`lib/schemas`) -> Drizzle Schema -> tRPC Procedures -> UI Forms & MCP Tools. Cohérence totale garantie.

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
L'écosystème TypeScript unifie Drizzle, tRPC et MCP. L'approche "API Proxy" dans Next.js centralise la sécurité des secrets.

**Pattern Consistency:**
Les conventions de nommage distinguent clairement les couches tout en partageant les schémas de validation Zod.

**Structure Alignment:**
L'arborescence par features supporte l'isolation nécessaire pour paralléliser le développement des protocoles.

### Requirements Coverage Validation ✅

**Epic/Feature Coverage:**
Chaque Epic a un dossier dédié dans `features/` ou `server/`.

**Functional Requirements Coverage:**
Le flux marketplace est entièrement supporté par les routeurs tRPC et les outils MCP.

**Non-Functional Requirements Coverage:**
La performance est adressée par les Server Components et l'Edge hosting. La sécurité est assurée par le Middleware JWT.

### Implementation Readiness Validation ✅

**Decision Completeness:**
Toutes les briques techniques (Auth, DB, API, UI) sont décidées et versionnées.

**Structure Completeness:**
L'arborescence est granulaire et spécifique à la stack choisie.

**Pattern Completeness:**
Les points de conflit potentiels (CSS, Naming, SDK placement) sont verrouillés.

### Gap Analysis Results
- **Mineur :** Logique de "retry" Hedera à affiner pendant le dev.
- **Post-MVP :** Réputation portable différée.

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**✅ Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**✅ Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**✅ Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION
**Confidence Level:** HIGH

**Key Strengths:**
Unification via Zod, innovation MCP SSE, et structure de features robuste.

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented.
- Use implementation patterns consistently across all components.
- Respect project structure and boundaries.
- Refer to this document for all architectural questions.

**First Implementation Priority:**
Initialisation Next.js + Tailwind + shadcn :
`npx create-next-app@latest . --typescript --eslint --app --no-src-dir --tailwind --import-alias "@/*"`
