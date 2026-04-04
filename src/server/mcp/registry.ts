/**
 * MCP Tool Registry — entry point for agent clients (Epic 2).
 *
 * Register all MCP tools on a McpServer instance.
 * Called by app/api/[transport]/route.ts via mcp-handler.
 *
 * Auth: AgentKit signature validated upstream in the route handler (Story 2.1)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { tasks, users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { lookupAgentBookOwner } from "@/lib/core/agentkit";
import { releasePayment } from "@/lib/core/hedera";
import { EVM_ADDRESS_RE } from "@/lib/schemas";

export function registerTools(server: McpServer): void {
  // ─── Identity Tool ──────────────────────────────────────────────────────────
  server.tool(
    "get_identity",
    "Returns the AgentBook identity for a given agent wallet address",
    { wallet_address: z.string().regex(EVM_ADDRESS_RE, "Invalid EVM address") },
    async ({ wallet_address }) => {
      const { nullifier, status } = await lookupAgentBookOwner(wallet_address);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            walletAddress: wallet_address,
            humanOwnerNullifier: nullifier,
            agentBookVerified: status === "verified",
            agentBookStatus: status,
          }),
        }],
      };
    }
  );

  // ─── Task Tools ──────────────────────────────────────────────────────────────
  server.tool(
    "list_tasks",
    "Returns all open tasks available for workers",
    {},
    async () => {
      const openTasks = await db.query.tasks.findMany({
        where: (t, { eq }) => eq(t.status, "open"),
      });
      return {
        content: [{ type: "text", text: JSON.stringify(openTasks) }],
      };
    }
  );

  server.tool(
    "create_task",
    "Create a new task as an agent client",
    {
      agent_wallet: z.string().regex(EVM_ADDRESS_RE, "Invalid EVM address"),
      title: z.string().min(5).max(100),
      description: z.string().min(10).max(1000),
      budget_hbar: z.number().int().positive(),
      deadline: z.string().datetime(),
    },
    async ({ agent_wallet, title, description, budget_hbar, deadline }) => {
      const { nullifier, status } = await lookupAgentBookOwner(agent_wallet);

      const id = randomUUID();
      const escrow_tx_id = `mock-escrow-${id}`;

      const [task] = await db
        .insert(tasks)
        .values({
          id,
          title,
          description,
          budget_hbar,
          deadline: new Date(deadline),
          client_type: "agent",
          client_agent_wallet: agent_wallet,
          client_agent_owner_nullifier: nullifier,
          escrow_tx_id,
          status: "open",
        })
        .returning();

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            task_id: task.id,
            escrow_tx_id: task.escrow_tx_id,
            status: task.status,
            agentbook_status: status,
          }),
        }],
      };
    }
  );

  server.tool(
    "get_task_status",
    "Poll the status of a task owned by this agent",
    {
      task_id: z.string(),
      agent_wallet: z.string().regex(EVM_ADDRESS_RE, "Invalid EVM address"),
    },
    async ({ task_id, agent_wallet }) => {
      const task = await db.query.tasks.findFirst({
        where: (t, { eq }) => eq(t.id, task_id),
      });

      if (!task) {
        return { content: [{ type: "text", text: JSON.stringify({ error: "Task not found" }) }] };
      }

      if (task.client_agent_wallet?.toLowerCase() !== agent_wallet.toLowerCase()) {
        return { content: [{ type: "text", text: JSON.stringify({ error: "Unauthorized: agent does not own this task" }) }] };
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            task_id: task.id,
            status: task.status,
            escrow_tx_id: task.escrow_tx_id,
            agentbook_status: task.client_agent_owner_nullifier ? "verified" : "offline",
          }),
        }],
      };
    }
  );

  server.tool(
    "validate_task",
    "Validate a completed task to trigger payment release",
    {
      task_id: z.string(),
      agent_wallet: z.string().regex(EVM_ADDRESS_RE, "Invalid EVM address"),
    },
    async ({ task_id, agent_wallet }) => {
      const task = await db.query.tasks.findFirst({
        where: (t, { eq }) => eq(t.id, task_id),
      });

      if (!task) {
        return { content: [{ type: "text", text: JSON.stringify({ error: "Task not found" }) }] };
      }

      if (task.client_agent_wallet?.toLowerCase() !== agent_wallet.toLowerCase()) {
        return { content: [{ type: "text", text: JSON.stringify({ error: "Unauthorized: agent does not own this task" }) }] };
      }

      if (task.status !== "completed") {
        return { content: [{ type: "text", text: JSON.stringify({ error: `Cannot validate: task status is "${task.status}", expected "completed"` }) }] };
      }

      // Look up worker to get Hedera account — fail-soft if missing
      let payment_tx_id: string;
      const worker = task.worker_nullifier
        ? await db.query.users.findFirst({ where: (u, { eq }) => eq(u.nullifier, task.worker_nullifier!) })
        : null;

      if (worker?.hedera_account_id) {
        payment_tx_id = await releasePayment(worker.hedera_account_id, task.budget_hbar, task.id);
      } else {
        payment_tx_id = `mock-payment-${task.id}`;
      }

      const [updated] = await db
        .update(tasks)
        .set({ status: "validated", payment_tx_id, updated_at: new Date() })
        .where(eq(tasks.id, task_id))
        .returning();

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            task_id: updated.id,
            status: updated.status,
            payment_tx_id: updated.payment_tx_id,
          }),
        }],
      };
    }
  );
}
