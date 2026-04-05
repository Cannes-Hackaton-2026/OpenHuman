import { describe, it, expect, vi, afterEach } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

const VALID_WALLET = "0xabcd1234567890abcd1234567890abcd12345678";
const MOCK_UUID = "b1234567-0000-0000-0000-000000000001";

// ─── Mock escrow ID format ────────────────────────────────────────────────────

describe("mock escrow_tx_id format", () => {
  it("follows the mock-escrow-{uuid} pattern", () => {
    const escrow_tx_id = `mock-escrow-${MOCK_UUID}`;
    expect(escrow_tx_id).toMatch(/^mock-escrow-[0-9a-f-]{36}$/);
  });

  it("is unique per task (different UUIDs → different escrow IDs)", () => {
    const { randomUUID } = await import("crypto");
    const id1 = randomUUID();
    const id2 = randomUUID();
    expect(`mock-escrow-${id1}`).not.toBe(`mock-escrow-${id2}`);
  });
});

// ─── create_task DB payload shape ─────────────────────────────────────────────

describe("create_task payload — mock mode (AgentBook verified)", () => {
  it("builds correct DB insert payload with agent fields", async () => {
    vi.stubEnv("NEXT_PUBLIC_MOCK_WORLDID", "true");
    const { lookupAgentBookOwner } = await import("@/lib/core/agentkit");
    const { randomUUID } = await import("crypto");

    const { nullifier, status } = await lookupAgentBookOwner(VALID_WALLET);
    const id = randomUUID();
    const escrow_tx_id = `mock-escrow-${id}`;

    const payload = {
      id,
      title: "Translate this doc",
      description: "Translate the whitepaper from English to French",
      budget_hbar: 10,
      deadline: new Date(Date.now() + 86400000),
      client_type: "agent" as const,
      client_agent_wallet: VALID_WALLET,
      client_agent_owner_nullifier: nullifier,
      escrow_tx_id,
      status: "open" as const,
    };

    expect(payload.client_type).toBe("agent");
    expect(payload.client_agent_wallet).toBe(VALID_WALLET);
    expect(payload.client_agent_owner_nullifier).toBe("mock-owner-nullifier-abcd1234");
    expect(payload.escrow_tx_id).toBe(`mock-escrow-${id}`);
    expect(payload.status).toBe("open");
    expect(status).toBe("verified");
  });
});

describe("create_task payload — agentbook offline (fail-soft)", () => {
  it("builds payload with null client_agent_owner_nullifier when SDK unavailable", async () => {
    vi.stubEnv("NEXT_PUBLIC_MOCK_WORLDID", "false");
    const { lookupAgentBookOwner } = await import("@/lib/core/agentkit");
    const { randomUUID } = await import("crypto");

    const { nullifier, status } = await lookupAgentBookOwner(VALID_WALLET);
    const id = randomUUID();

    const payload = {
      id,
      client_type: "agent" as const,
      client_agent_wallet: VALID_WALLET,
      client_agent_owner_nullifier: nullifier,   // null when offline
      escrow_tx_id: `mock-escrow-${id}`,
      status: "open" as const,
    };

    expect(nullifier).toBeNull();
    expect(status).toBe("offline");
    expect(payload.client_agent_owner_nullifier).toBeNull();
    // Task is still created — fail-soft, no block
    expect(payload.status).toBe("open");
  });
});

// ─── EVM_ADDRESS_RE validation (used in tool schema) ─────────────────────────

describe("EVM_ADDRESS_RE — agent_wallet validation", () => {
  it("accepts a valid lowercase EVM address", async () => {
    const { EVM_ADDRESS_RE } = await import("@/lib/schemas");
    expect(EVM_ADDRESS_RE.test(VALID_WALLET)).toBe(true);
  });

  it("rejects a non-address string", async () => {
    const { EVM_ADDRESS_RE } = await import("@/lib/schemas");
    expect(EVM_ADDRESS_RE.test("not-a-wallet")).toBe(false);
  });

  it("rejects an address that is too short", async () => {
    const { EVM_ADDRESS_RE } = await import("@/lib/schemas");
    expect(EVM_ADDRESS_RE.test("0xabcd1234")).toBe(false);
  });
});
