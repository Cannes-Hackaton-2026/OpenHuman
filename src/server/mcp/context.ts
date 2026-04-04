import { AsyncLocalStorage } from "node:async_hooks";

interface AgentRequestContext {
  walletAddress: string;
}

const agentRequestContext = new AsyncLocalStorage<AgentRequestContext>();

export function runWithAgentRequestContext<T>(
  walletAddress: string,
  callback: () => T
): T {
  return agentRequestContext.run(
    { walletAddress: walletAddress.toLowerCase() },
    callback
  );
}

export function getAuthenticatedAgentWallet(): string {
  const ctx = agentRequestContext.getStore();

  if (!ctx) {
    throw new Error("Unauthorized: missing authenticated agent context");
  }

  return ctx.walletAddress;
}
