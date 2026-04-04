import { randomUUID } from "crypto";
import { and, eq, isNull } from "drizzle-orm";
import { releasePayment } from "@/lib/core/hedera";
import { lookupAgentBookOwner } from "@/lib/core/agentkit";
import { db } from "@/lib/db";
import { tasks } from "@/server/db/schema";
import { getAuthenticatedAgentWallet } from "@/server/mcp/context";

interface AgentWalletInput {
  agent_wallet: string;
}

interface CreateAgentTaskInput extends AgentWalletInput {
  title: string;
  description: string;
  budget_hbar: number;
  deadline: string;
}

interface GetAgentTaskStatusInput extends AgentWalletInput {
  task_id: string;
}

interface ValidateAgentTaskInput extends AgentWalletInput {
  task_id: string;
}

function normalizeWallet(walletAddress: string): string {
  return walletAddress.toLowerCase();
}

function assertAuthenticatedAgentWallet(agentWallet: string): string {
  const authenticatedWallet = getAuthenticatedAgentWallet();

  if (normalizeWallet(agentWallet) !== normalizeWallet(authenticatedWallet)) {
    throw new Error(
      "Unauthorized: agent_wallet does not match authenticated agent"
    );
  }

  return normalizeWallet(authenticatedWallet);
}

export async function createAgentTask(input: CreateAgentTaskInput) {
  const authenticatedWallet = assertAuthenticatedAgentWallet(input.agent_wallet);
  const { nullifier, status } = await lookupAgentBookOwner(authenticatedWallet);

  const id = randomUUID();
  const escrow_tx_id = `mock-escrow-${id}`;

  const [task] = await db
    .insert(tasks)
    .values({
      id,
      title: input.title,
      description: input.description,
      budget_hbar: input.budget_hbar,
      deadline: new Date(input.deadline),
      client_type: "agent",
      client_agent_wallet: authenticatedWallet,
      client_agent_owner_nullifier: nullifier,
      escrow_tx_id,
      status: "open",
    })
    .returning();

  return {
    task_id: task.id,
    escrow_tx_id: task.escrow_tx_id,
    status: task.status,
    agentbook_status: status,
  };
}

export async function getAgentTaskStatus(input: GetAgentTaskStatusInput) {
  const authenticatedWallet = assertAuthenticatedAgentWallet(input.agent_wallet);

  const task = await db.query.tasks.findFirst({
    where: (t, { eq }) => eq(t.id, input.task_id),
  });

  if (!task) {
    throw new Error("Task not found");
  }

  if (normalizeWallet(task.client_agent_wallet ?? "") !== authenticatedWallet) {
    throw new Error("Unauthorized: agent does not own this task");
  }

  return {
    task_id: task.id,
    status: task.status,
    escrow_tx_id: task.escrow_tx_id,
    agentbook_status: task.client_agent_owner_nullifier ? "verified" : "offline",
  };
}

export async function validateAgentTask(input: ValidateAgentTaskInput) {
  const authenticatedWallet = assertAuthenticatedAgentWallet(input.agent_wallet);

  const task = await db.query.tasks.findFirst({
    where: (t, { eq }) => eq(t.id, input.task_id),
  });

  if (!task) {
    throw new Error("Task not found");
  }

  if (normalizeWallet(task.client_agent_wallet ?? "") !== authenticatedWallet) {
    throw new Error("Unauthorized: agent does not own this task");
  }

  if (task.status !== "completed") {
    throw new Error(
      `Cannot validate: task status is "${task.status}", expected "completed"`
    );
  }

  const processingPaymentId = `processing-payment-${task.id}-${randomUUID()}`;
  const [claimedTask] = await db
    .update(tasks)
    .set({ payment_tx_id: processingPaymentId, updated_at: new Date() })
    .where(
      and(
        eq(tasks.id, task.id),
        eq(tasks.status, "completed"),
        isNull(tasks.payment_tx_id)
      )
    )
    .returning();

  if (!claimedTask) {
    throw new Error("Task is already being validated or has already been paid");
  }

  try {
    const worker = task.worker_nullifier
      ? await db.query.users.findFirst({
          where: (u, { eq }) => eq(u.nullifier, task.worker_nullifier!),
        })
      : null;

    const payment_tx_id = worker?.hedera_account_id
      ? await releasePayment(worker.hedera_account_id, task.budget_hbar, task.id)
      : `mock-payment-${task.id}`;

    const [updated] = await db
      .update(tasks)
      .set({
        status: "validated",
        payment_tx_id,
        updated_at: new Date(),
      })
      .where(
        and(
          eq(tasks.id, task.id),
          eq(tasks.status, "completed"),
          eq(tasks.payment_tx_id, processingPaymentId)
        )
      )
      .returning();

    if (!updated) {
      throw new Error(
        "Validation state changed after payment release; manual reconciliation required"
      );
    }

    return {
      task_id: updated.id,
      status: updated.status,
      payment_tx_id: updated.payment_tx_id,
    };
  } catch (error) {
    await db
      .update(tasks)
      .set({ payment_tx_id: null, updated_at: new Date() })
      .where(
        and(eq(tasks.id, task.id), eq(tasks.payment_tx_id, processingPaymentId))
      );

    throw error;
  }
}
