# World - Best Use of World ID 4.0 ($8,000)

## Track Overview

**Prize Pool:** $8,000 (1st: $4,000 / 2nd: $2,500 / 3rd: $1,500)

**Goal:** Leverage World ID 4.0 to build products that break without proof of human.

**Key Requirements:**
- Uses World ID 4.0 as a **real constraint** (eligibility, uniqueness, fairness, reputation, rate limits)
- Proof validation is **required** and must occur in a **web backend or smart contract**

---

## What is World ID 4.0?

World ID is an anonymous proof-of-human credential for the age of AI. It lets people verify their humanity online **without sharing personal information**, using zero-knowledge proofs.

### What's New in 4.0

| Feature | 3.0 (Legacy) | 4.0 |
|---------|--------------|-----|
| Protocol version | `"3.0"` | `"4.0"` |
| Proof format | Single encoded string | Array of 5 proof elements |
| Nullifier | `nullifier_hash` | `nullifier` (RP-scoped) |
| Session support | No | Yes (`session_id`, `session_nullifier`) |
| Credential expiry | No | Yes (`expires_at_min`) |
| Issuer tracking | No | Yes (`issuer_schema_id`) |
| Verification endpoint | v2 API | `/api/v4/verify/{rp_id}` |
| RP signing | Not required | **Required** (server-side) |

### Verification Credentials

| Credential | Method | Use Case |
|------------|--------|----------|
| **Proof of Human** | Orb verification | Highest assurance. Sybil resistance, one-person-one-action |
| **Document** | NFC government document check | Proof of age, document-backed access |
| **Selfie Check** (Beta) | Selfie liveness detection | Low-friction sign-up, bot defense |

### Privacy Architecture

- **Zero-knowledge proofs**: Verify what's true without revealing personal data
- **Multi-party computation**: Sensitive checks distributed across independent nodes
- **Self-custodial**: Proof generation happens on the user's device
- **Unlinkable nullifiers**: Nullifiers are scoped per app + action, can't be correlated across apps

---

## Prerequisites

1. **Developer Portal Account**: [developer.world.org](https://developer.world.org)
2. Create an application to get:
   - `app_id` - identifies your app
   - `rp_id` - relying party identifier
   - `signing_key` - **keep server-side only**
3. Configure **actions** in the portal (e.g., "verify-account", "claim-reward")

---

## Installation

### React
```bash
npm install @worldcoin/idkit
```

### Core (Vanilla JS / Node.js)
```bash
npm install @worldcoin/idkit-core
```

### Mobile
```swift
// Swift (SPM)
.package(url: "https://github.com/worldcoin/idkit-swift.git", from: "<version>")
```
```kotlin
// Kotlin (Gradle)
dependencies {
    implementation("com.worldcoin:idkit:<version>")
}
```

---

## Integration Guide

### Step 1: Generate RP Signature (Server-Side)

**CRITICAL: Never generate RP signatures on the client. Never expose your signing key.**

```typescript
// api/rp-context.ts (Next.js API route)
import { signRequest } from "@worldcoin/idkit-core/signing";

export async function POST(request: Request) {
  const { action } = await request.json();

  const { sig, nonce, createdAt, expiresAt } = signRequest({
    signingKeyHex: process.env.RP_SIGNING_KEY!,
    action,
  });

  return Response.json({
    rp_id: process.env.RP_ID,
    nonce,
    created_at: createdAt,
    expires_at: expiresAt,
    signature: sig,
  });
}
```

**Go alternative:**
```go
import "github.com/worldcoin/idkit-go"

sig, err := idkit.SignRequest(
    os.Getenv("RP_SIGNING_KEY"),
    idkit.WithAction(body.Action),
)
```

### Step 2: Frontend - IDKit Widget (React)

```tsx
import { IDKitRequestWidget } from "@worldcoin/idkit";
import { orbLegacy } from "@worldcoin/idkit/presets";
import { useState, useEffect } from "react";

function VerifyButton() {
  const [open, setOpen] = useState(false);
  const [rpContext, setRpContext] = useState(null);

  useEffect(() => {
    // Fetch RP context from your backend
    fetch("/api/rp-context", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "verify-account" }),
    })
      .then((res) => res.json())
      .then(setRpContext);
  }, []);

  if (!rpContext) return null;

  return (
    <>
      <button onClick={() => setOpen(true)}>Verify with World ID</button>
      <IDKitRequestWidget
        open={open}
        onOpenChange={setOpen}
        app_id="app_xxxxx"
        action="verify-account"
        rp_context={rpContext}
        allow_legacy_proofs={true}
        preset={orbLegacy({ signal: "optional-signal-value" })}
        handleVerify={async (result) => {
          const res = await fetch("/api/verify-proof", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              rp_id: rpContext.rp_id,
              idkitResponse: result,
            }),
          });
          if (!res.ok) throw new Error("Verification failed");
        }}
        onSuccess={(result) => {
          console.log("Verified!", result);
          // Update app state - user is verified
        }}
      />
    </>
  );
}
```

### Step 3: Frontend - Core SDK (Vanilla JS)

```typescript
import { IDKit } from "@worldcoin/idkit-core";

const request = await IDKit.request({
  app_id: "app_xxxxx",
  action: "verify-account",
  rp_context: {
    rp_id: "rp_xxxxx",
    nonce: rpSig.nonce,
    created_at: rpSig.created_at,
    expires_at: rpSig.expires_at,
    signature: rpSig.sig,
  },
  allow_legacy_proofs: true,
  environment: "production", // "staging" for simulator
  return_to: "myapp://verify-done", // mobile deep-link (optional)
}).preset(orbLegacy({ signal: "local-election-1" }));

// For QR code display
const connectUrl = request.connectorURI;

// Wait for user to complete verification
const response = await request.pollUntilCompletion();
```

### Step 4: Backend Proof Verification (REQUIRED)

**This is mandatory for the track.** Forward the IDKit response to World's verification API:

```typescript
// api/verify-proof.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { rp_id, idkitResponse } = await request.json();

  // Verify the proof with World's API
  const response = await fetch(
    `https://developer.world.org/api/v4/verify/${rp_id}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(idkitResponse),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    return NextResponse.json(
      { error: "Verification failed", details: error },
      { status: 400 },
    );
  }

  const verificationResult = await response.json();

  // IMPORTANT: Check and store the nullifier for uniqueness
  const nullifier = verificationResult.nullifier;
  // Store nullifier in your database to prevent double-verification

  return NextResponse.json({ success: true, verified: true });
}
```

---

## Response Formats

### World ID 4.0 Uniqueness Response
```json
{
  "protocol_version": "4.0",
  "nonce": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "action": "verify-account",
  "environment": "production",
  "responses": [{
    "identifier": "orb",
    "signal_hash": "0x0",
    "proof": ["0x1a2b...", "0x3c4d...", "0x5e6f...", "0x7a8b...", "0x9c0d..."],
    "nullifier": "0x04e5f6...rp_scoped_nullifier",
    "issuer_schema_id": 1,
    "expires_at_min": 1756166400
  }]
}
```

### World ID 4.0 Session Response
```json
{
  "protocol_version": "4.0",
  "nonce": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "session_id": "ses_abc123",
  "environment": "production",
  "responses": [{
    "identifier": "orb",
    "signal_hash": "0x0",
    "proof": ["0x1a2b...", "0x3c4d...", "0x5e6f...", "0x7a8b...", "0x9c0d..."],
    "session_nullifier": ["0x04e5f6...", "0x07a8b9..."],
    "issuer_schema_id": 1,
    "expires_at_min": 1756166400
  }]
}
```

---

## Nullifier Management

Nullifiers are the core of World ID's uniqueness guarantee. They are derived from:
- The user's World ID
- Your app ID
- The action string

**They are unlinkable across apps** - the same user generates different nullifiers for different apps.

### Database Schema

```sql
CREATE TABLE nullifiers (
  nullifier   NUMERIC(78, 0) NOT NULL,  -- Store as large decimal
  action      TEXT NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (nullifier, action)
);
```

### Checking Uniqueness

```typescript
async function isUniqueHuman(nullifier: string, action: string): Promise<boolean> {
  const existing = await db.query(
    "SELECT 1 FROM nullifiers WHERE nullifier = $1 AND action = $2",
    [nullifier, action]
  );
  return existing.rows.length === 0;
}

async function recordVerification(nullifier: string, action: string): Promise<void> {
  await db.query(
    "INSERT INTO nullifiers (nullifier, action) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [nullifier, action]
  );
}
```

---

## IDKit Props Reference

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `app_id` | string | Yes | Application ID from Developer Portal |
| `action` | string | Yes | Action identifier scoping the verification |
| `rp_context` | object | Yes | RP signature context (rp_id, nonce, timestamps, signature) |
| `allow_legacy_proofs` | boolean | No | Enable World ID 3.0 backward compatibility |
| `preset` | function | No | Verification preset (e.g., `orbLegacy()`) |
| `environment` | string | No | `"production"` or `"staging"` (simulator) |
| `signal` | string | No | Bind specific data into the proof (user ID, wallet) |
| `return_to` | string | No | Mobile deep-link callback URL |
| `handleVerify` | function | Yes | Async function to verify proof on backend |
| `onSuccess` | function | Yes | Called after successful verification |

---

## Using World ID as a Real Constraint

The track requires World ID to be a **real constraint**, not cosmetic. Here's how:

### 1. Eligibility Gating
```typescript
// Only verified humans can access the feature
app.post("/api/claim-reward", async (req, res) => {
  const { proof } = req.body;
  const verified = await verifyWorldIdProof(proof);
  if (!verified) return res.status(403).json({ error: "Human verification required" });
  // Process claim...
});
```

### 2. One-Person-One-Action (Uniqueness)
```typescript
// Each human can only vote once
app.post("/api/vote", async (req, res) => {
  const { proof, nullifier } = req.body;

  const alreadyVoted = await db.query(
    "SELECT 1 FROM nullifiers WHERE nullifier = $1 AND action = 'vote-2026'",
    [nullifier]
  );
  if (alreadyVoted.rows.length > 0) {
    return res.status(409).json({ error: "You have already voted" });
  }

  await verifyWorldIdProof(proof);
  await db.query("INSERT INTO nullifiers (nullifier, action) VALUES ($1, 'vote-2026')", [nullifier]);
  // Record vote...
});
```

### 3. Fair Rate Limiting
```typescript
// Verified humans get higher rate limits
const HUMAN_LIMIT = 100; // requests per hour
const BOT_LIMIT = 10;

app.use(async (req, res, next) => {
  const isVerifiedHuman = await checkWorldIdStatus(req);
  const limit = isVerifiedHuman ? HUMAN_LIMIT : BOT_LIMIT;
  // Apply rate limit...
});
```

### 4. Sybil-Resistant Airdrops
```typescript
// Each human can claim only once
app.post("/api/airdrop/claim", async (req, res) => {
  const { proof, nullifier, walletAddress } = req.body;

  const hasClaimed = await isNullifierUsed(nullifier, "airdrop-q1-2026");
  if (hasClaimed) return res.status(409).json({ error: "Already claimed" });

  await verifyWorldIdProof(proof);
  await recordNullifier(nullifier, "airdrop-q1-2026");
  await sendTokens(walletAddress, AIRDROP_AMOUNT);

  res.json({ success: true });
});
```

---

## Best Practices

### Security

1. **Never expose `signing_key`** on the client
2. **Always verify proofs server-side** via the `/api/v4/verify/{rp_id}` endpoint
3. **Store and check nullifiers** to enforce uniqueness
4. **Use action strings wisely** - different actions = different nullifiers = independent uniqueness
5. **Validate `expires_at_min`** for time-sensitive operations

### UX

1. **Explain why verification is needed** before showing the widget
2. **Handle errors gracefully** - World App might not be installed
3. **Support staging environment** during development (use World App simulator)
4. **Cache verification status** in sessions to avoid re-verification on every request
5. **Use `signal` parameter** to bind verification to specific context (wallet address, user ID)

### Architecture

1. **Separate verification from business logic** - verify first, then process
2. **Use middleware patterns** for routes that require verification
3. **Design actions semantically** - `"vote-proposal-42"` not `"action-1"`
4. **Plan for credential expiry** (`expires_at_min` field in 4.0)
5. **Support multiple credential types** when appropriate (Orb + Document)

### What Judges Want to See

1. **World ID as a real constraint** - the product must **break** without it
2. **Backend proof validation** - not just frontend checks
3. **Meaningful use of uniqueness** - not just a login gate
4. **Clean UX flow** - verification feels natural, not bolted on
5. **Working demo** with real or simulator proofs

---

## Common Mistakes

| Mistake | Impact | Fix |
|---------|--------|-----|
| Verifying proofs only client-side | Anyone can bypass | Always verify server-side via API |
| Not storing nullifiers | Users can verify multiple times | Store in DB with unique constraint |
| Exposing signing key in frontend | Key compromise | Keep in env vars, generate signatures server-side |
| Using same action for everything | No uniqueness per feature | Use specific action strings per use case |
| Not handling legacy proofs | Some users on older World App | Set `allow_legacy_proofs: true` |
| Forgetting staging environment | Can't test without real Orb | Use `environment: "staging"` with simulator |

---

## Testing

### Staging / Simulator

Set `environment: "staging"` in IDKit to use the World App simulator for testing without a real Orb verification:

```tsx
<IDKitRequestWidget
  // ... other props
  environment="staging" // Use simulator
/>
```

### Production

Switch to `environment: "production"` (or omit, as it's the default) for real World App verification.

---

## Project Ideas for This Track

1. **Sybil-Resistant Voting Platform** - One-person-one-vote governance with nullifier-based uniqueness
2. **Fair NFT Mint** - Each human can only mint once, preventing bot minting
3. **Human-Only Social Feed** - Content platform where only verified humans can post
4. **Fair Lottery / Raffle** - Each human gets exactly one entry
5. **Reputation System** - Build non-transferable reputation tied to unique human identity
6. **Anti-Bot Marketplace** - Only verified humans can list or bid on items

---

## Useful Links

| Resource | URL |
|----------|-----|
| World ID Docs | https://docs.world.org/world-id/overview |
| IDKit Reference | https://docs.world.org/world-id/idkit |
| Developer Portal | https://developer.world.org |
| Verification API | `https://developer.world.org/api/v4/verify/{rp_id}` |
| World Docs (full) | https://docs.world.org/ |
| npm (React) | `@worldcoin/idkit` |
| npm (Core) | `@worldcoin/idkit-core` |
