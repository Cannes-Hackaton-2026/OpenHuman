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
  // Mock mode: accept any well-formed header, return mock AgentBook identity
  if (process.env.NEXT_PUBLIC_MOCK_WORLDID === "true") {
    const parsed = agentKitHeaderSchema.safeParse(agentKitHeader);
    if (!parsed.success) {
      throw new AgentAuthError("Invalid AgentKit header format (mock mode)");
    }
    const match = AGENTKIT_HEADER_RE.exec(agentKitHeader)!;
    const walletAddress = match[1];
    const humanOwnerNullifier = await lookupAgentBookOwner(walletAddress);
    return {
      walletAddress,
      humanOwnerNullifier,
      agentBookVerified: humanOwnerNullifier !== null,
    };
  }

  // Production: validate header with Zod schema
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

  const humanOwnerNullifier = await lookupAgentBookOwner(walletAddress);

  return {
    walletAddress,
    humanOwnerNullifier,
    agentBookVerified: humanOwnerNullifier !== null,
  };
}

/**
 * Look up the human owner of an agent wallet in AgentBook.
 * Fail-soft: returns null if the SDK is unavailable or the agent is not registered.
 *
 * Mock mode returns a deterministic nullifier for demo purposes.
 */
export async function lookupAgentBookOwner(
  walletAddress: string
): Promise<string | null> {
  if (process.env.NEXT_PUBLIC_MOCK_WORLDID === "true") {
    // Deterministic mock: skip "0x" prefix, take 8 chars
    return `mock-owner-nullifier-${walletAddress.slice(2, 10)}`;
  }

  try {
    // Dynamic import — avoids build-time crash if SDK is incompatible with Next.js
    const { AgentBook } = await import("@worldcoin/agentkit");
    const agentBook = new AgentBook();
    return await agentBook.getHumanOwner(walletAddress);
  } catch {
    console.warn("[AgentKit] AgentBook lookup failed — proceeding with caution");
    return null;
  }
}
