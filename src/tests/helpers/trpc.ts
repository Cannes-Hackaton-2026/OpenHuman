/**
 * tRPC test caller factory.
 * Creates a server-side caller with an injected session (no HTTP needed).
 * Uses router.createCaller() — the standard tRPC v11 approach.
 */

import { taskRouter } from "@/server/routers/task";
import type { SessionPayload } from "@/lib/schemas";
import type { Context } from "@/server/context";

export function makeTaskCaller(session: SessionPayload | null = null) {
  return taskRouter.createCaller({
    session,
    req: {} as Context["req"],
  });
}

// Preset session factories for readability in tests
export const workerSession = (
  nullifier = "test-worker-nullifier"
): SessionPayload => ({
  nullifier,
  role: "worker",
  userId: `user-${nullifier}`,
});

export const clientSession = (
  nullifier = "test-client-nullifier"
): SessionPayload => ({
  nullifier,
  role: "client",
  userId: `user-${nullifier}`,
});
