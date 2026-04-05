/**
 * World AgentKit middleware — Story 2.1 + 2.2.
 * Validates the x-agentkit-auth header and resolves the agent's human owner
 * via AgentBook (fail-soft).
 *
 * Header format: "AgentKit 0x<40 hex chars>"
 */

import { agentKitHeaderSchema, AGENTKIT_HEADER_RE } from "@/lib/schemas";

export interface AgentIdentity {
  walletAddress: string;
  humanOwnerNullifier: string | null;
  agentBookVerified: boolean;
}

export class AgentAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AgentAuthError";
  }
}

/**
 * Verify an incoming agent request via the x-agentkit-auth header.
 * Returns the agent identity or throws AgentAuthError if unauthorized.
 */
export async function verifyAgentRequest(
  agentKitHeader: string
): Promise<AgentIdentity> {
  const parsed = agentKitHeaderSchema.safeParse(agentKitHeader);
  if (!parsed.success) {
    throw new AgentAuthError(
      agentKitHeader
        ? "Invalid AgentKit header format — expected: AgentKit 0x<40 hex chars>"
        : "Missing AgentKit authorization header"
    );
  }

  const match = AGENTKIT_HEADER_RE.exec(agentKitHeader)!;
  const walletAddress = match[1];

  const { nullifier, status } = await lookupAgentBookOwner(walletAddress);

  return {
    walletAddress,
    humanOwnerNullifier: nullifier,
    agentBookVerified: status === "verified",
  };
}

/**
 * Look up the human owner of an agent wallet in AgentBook.
 * Fail-soft: returns status "offline" if the SDK is unavailable or network fails.
 *
 * Mock mode returns a deterministic nullifier for demo purposes.
 */
export async function lookupAgentBookOwner(
  walletAddress: string
): Promise<{ nullifier: string | null; status: "verified" | "not-registered" | "offline" }> {
  const normalizedWallet = walletAddress.toLowerCase();

  if (process.env.NEXT_PUBLIC_MOCK_WORLDID === "true") {
    // Deterministic mock: skip "0x" prefix, take 8 chars
    return {
      nullifier: `mock-owner-nullifier-${normalizedWallet.slice(2, 10)}`,
      status: "verified",
    };
  }

  try {
    // Dynamic import — avoids build-time crash if SDK is incompatible with Next.js
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { AgentBook } = await import("@worldcoin/agentkit") as any;
    const agentBook = new AgentBook();
    const res = await agentBook.getHumanOwner(normalizedWallet);
    
    return {
      nullifier: res || null,
      status: res ? "verified" : "not-registered",
    };
  } catch (error) {
    console.warn("[AgentKit] AgentBook lookup failed — proceeding with caution:", error);
    return {
      nullifier: null,
      status: "offline",
    };
  }
}
