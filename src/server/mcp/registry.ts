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
import { db } from "@/lib/db";
import { lookupAgentBookOwner } from "@/lib/core/agentkit";
import { EVM_ADDRESS_RE } from "@/lib/schemas";
import {
  createAgentTask,
  getAgentTaskStatus,
  validateAgentTask,
} from "@/server/mcp/task-tools";

function jsonToolResult(payload: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(payload) }],
  };
}

function toolErrorResult(error: unknown) {
  return jsonToolResult({
    error: error instanceof Error ? error.message : "Unknown error",
  });
}

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
    async (input) => {
      try {
        return jsonToolResult(await createAgentTask(input));
      } catch (error) {
        return toolErrorResult(error);
      }
    }
  );

  server.tool(
    "get_task_status",
    "Poll the status of a task owned by this agent",
    {
      task_id: z.string(),
      agent_wallet: z.string().regex(EVM_ADDRESS_RE, "Invalid EVM address"),
    },
    async (input) => {
      try {
        return jsonToolResult(await getAgentTaskStatus(input));
      } catch (error) {
        return toolErrorResult(error);
      }
    }
  );

  server.tool(
    "validate_task",
    "Validate a completed task to trigger payment release",
    {
      task_id: z.string(),
      agent_wallet: z.string().regex(EVM_ADDRESS_RE, "Invalid EVM address"),
    },
    async (input) => {
      try {
        return jsonToolResult(await validateAgentTask(input));
      } catch (error) {
        return toolErrorResult(error);
      }
    }
  );
}
