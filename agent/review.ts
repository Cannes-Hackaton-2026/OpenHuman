/**
 * Claude-powered quality review for completed tasks.
 *
 * Given a task that a verified human marked as complete, Claude reasons
 * about whether the work meets the requirements and approves or rejects
 * payment release.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { Task } from "./mcp.ts";

export type ReviewDecision = {
  approved: boolean;
  reasoning: string;
  confidence: "high" | "medium" | "low";
};

const SYSTEM_PROMPT = `You are an autonomous payment-release agent for OpenHuman, a verified-human task marketplace.

Your role: Review completed tasks and decide whether to release escrow payment to the worker.

A human verified via World ID (ZK proof, no personal data) has claimed a task and marked it complete.
You cannot see the actual deliverable — you reason based on task nature, requirements, and context.

Decision criteria:
- Is this a realistic task a human can complete in the given timeframe?
- Does the budget align with the effort required?
- Are there red flags (impossible deadline, vague requirements, suspicious pattern)?
- Default to APPROVE for legitimate tasks — workers are verified humans who staked their reputation.

Respond in this exact format:
DECISION: APPROVE | REJECT
CONFIDENCE: high | medium | low
REASONING: <one sentence explaining your decision>`;

export async function reviewTask(task: Task): Promise<ReviewDecision> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set in .env.local");
  const client = new Anthropic({ apiKey });
  const deadline = new Date(task.deadline);
  const now = new Date();
  const daysLeft = Math.round((deadline.getTime() - now.getTime()) / 86_400_000);
  const isOverdue = daysLeft < 0;

  const userMessage = `Task completed — review for payment release:

Title: ${task.title}
Budget: ${task.budget_hbar} HBAR
Deadline: ${task.deadline} (${isOverdue ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days remaining`})
Worker: verified human ${task.worker_nullifier?.slice(0, 14) ?? "unknown"}…

Description:
${task.description}

Should I release the escrow payment?`;

  const message = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 256,
    messages: [{ role: "user", content: userMessage }],
    system: SYSTEM_PROMPT,
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";

  // Parse structured response
  const decisionMatch = text.match(/DECISION:\s*(APPROVE|REJECT)/i);
  const confidenceMatch = text.match(/CONFIDENCE:\s*(high|medium|low)/i);
  const reasoningMatch = text.match(/REASONING:\s*(.+)/i);

  const approved = decisionMatch?.[1]?.toUpperCase() === "APPROVE";
  const confidence = (confidenceMatch?.[1]?.toLowerCase() ?? "medium") as ReviewDecision["confidence"];
  const reasoning = reasoningMatch?.[1]?.trim() ?? text.trim();

  return { approved, reasoning, confidence };
}
