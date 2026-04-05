/**
 * OpenHuman Agent
 *
 * An autonomous AI agent powered by Claude that:
 *   1. Posts tasks that require verified humans
 *   2. Monitors task status in real time
 *   3. Uses Claude to review completed work before releasing payment
 *
 * Usage:
 *   pnpm agent:run              — post tasks + watch loop
 *   pnpm agent:run --watch-only — only watch + review (no new tasks)
 *   pnpm agent:run --list       — list current tasks and exit
 *
 * Required env:
 *   ANTHROPIC_API_KEY  — Claude API key for quality review
 *   AGENT_SERVER_URL   — OpenHuman server (default: http://localhost:3000)
 *   AGENT_WALLET       — Agent wallet address (default: 0x000...CAFE)
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { createTask, listTasks, validateTask, WALLET, BASE_URL } from "./mcp.ts";
import { reviewTask } from "./review.ts";
import { TASK_CATALOG } from "./tasks.ts";
import type { Task } from "./mcp.ts";

// ── Config ────────────────────────────────────────────────────────────────────
const POLL_INTERVAL_MS = 15_000;
const MAX_TASKS_TO_POST = 2;

// ── Terminal colours ──────────────────────────────────────────────────────────
const c = {
  reset:  "\x1b[0m",
  dim:    "\x1b[2m",
  bold:   "\x1b[1m",
  blue:   "\x1b[34m",
  cyan:   "\x1b[36m",
  green:  "\x1b[32m",
  yellow: "\x1b[33m",
  red:    "\x1b[31m",
  grey:   "\x1b[90m",
  magenta:"\x1b[35m",
};

function ts() {
  return c.grey + new Date().toLocaleTimeString("en-GB") + c.reset;
}

function log(emoji: string, msg: string) {
  console.log(`${ts()}  ${emoji}  ${msg}`);
}

// ── Banner ────────────────────────────────────────────────────────────────────
function banner() {
  console.log();
  console.log(c.bold + c.blue + "  ╔═══════════════════════════════════════════╗" + c.reset);
  console.log(c.bold + c.blue + "  ║   OpenHuman Agent  ·  powered by Claude   ║" + c.reset);
  console.log(c.bold + c.blue + "  ╚═══════════════════════════════════════════╝" + c.reset);
  console.log();
  console.log(`  ${c.dim}Server ${c.reset}  ${BASE_URL}`);
  console.log(`  ${c.dim}Wallet ${c.reset}  ${c.cyan}${WALLET}${c.reset}`);
  console.log(`  ${c.dim}Model  ${c.reset}  ${c.magenta}claude-opus-4-6${c.reset}`);
  console.log(`  ${c.dim}Poll   ${c.reset}  every ${POLL_INTERVAL_MS / 1000}s`);
  console.log();

  if (!process.env.ANTHROPIC_API_KEY) {
    console.log(c.red + c.bold + "  ⚠  ANTHROPIC_API_KEY not set — quality review will fail" + c.reset);
    console.log();
  }
}

// ── Post tasks ────────────────────────────────────────────────────────────────
async function postInitialTasks(): Promise<void> {
  log("📋", c.bold + "Posting tasks to the bounty board…" + c.reset);
  console.log();

  const toPost = TASK_CATALOG.slice(0, MAX_TASKS_TO_POST);

  for (const def of toPost) {
    try {
      const result = await createTask(def);
      log(
        "✅",
        `${c.green}Posted${c.reset} ${c.bold}${def.title}${c.reset}\n` +
        `        ${c.dim}id: ${result.task_id.slice(0, 8)}…  escrow: ${result.escrow_tx_id.slice(0, 20)}…${c.reset}`
      );
    } catch (err) {
      log("❌", `${c.red}Failed to post "${def.title}": ${(err as Error).message}${c.reset}`);
    }
    await sleep(500);
  }
  console.log();
}

// ── Watch + review loop ───────────────────────────────────────────────────────
const reviewed = new Set<string>(); // avoid reviewing the same task twice

/** Snapshot all already-completed tasks on startup so we don't re-review them. */
async function snapshotExisting(): Promise<void> {
  try {
    const existing = await listTasks("completed");
    for (const t of existing) reviewed.add(t.id);
    if (existing.length > 0) {
      log("📸", `${c.dim}Skipping ${existing.length} already-completed task(s) from previous runs.${c.reset}`);
    }
  } catch {
    // Non-fatal — worst case we review old tasks once
  }
}

async function watchAndReview(): Promise<void> {
  let tasks: Task[];
  try {
    tasks = await listTasks("completed");
  } catch (err) {
    log("⚠️ ", `${c.yellow}Server unreachable: ${(err as Error).message}${c.reset}`);
    return;
  }

  // Only handle tasks this agent posted
  const mine = tasks.filter(
    (t) => t.client_agent_wallet?.toLowerCase() === WALLET.toLowerCase()
  );

  if (mine.length === 0) {
    process.stdout.write(`\r${ts()}  👀  Watching… ${c.dim}(${tasks.length} completed total, 0 mine)${c.reset}   `);
    return;
  }

  process.stdout.write("\n");

  for (const task of mine) {
    if (reviewed.has(task.id)) continue;
    reviewed.add(task.id); // mark early to prevent concurrent re-entry

    log("🔔", `${c.yellow}Work submitted:${c.reset} ${c.bold}${task.title}${c.reset}`);
    log("   ", `${c.dim}Worker: ${task.worker_nullifier?.slice(0, 14) ?? "unknown"}…${c.reset}`);
    log("🧠", `${c.magenta}Asking Claude to review…${c.reset}`);

    try {
      const review = await reviewTask(task);

      const confidenceLabel =
        review.confidence === "high"   ? c.green + "high" :
        review.confidence === "medium" ? c.yellow + "medium" :
                                         c.red + "low";

      log(
        review.approved ? "✅" : "🚫",
        `${review.approved ? c.green + c.bold + "APPROVED" : c.red + c.bold + "REJECTED"}${c.reset}  ` +
        `${c.dim}confidence: ${confidenceLabel + c.reset + c.dim}${c.reset}`
      );
      log("💬", `${c.dim}${review.reasoning}${c.reset}`);

      if (review.approved) {
        const result = await validateTask(task.id);
        log(
          "💸",
          `${c.green}${c.bold}Payment released!${c.reset}  ` +
          `${c.cyan}${result.payment_tx_id?.slice(0, 24) ?? "tx-pending"}…${c.reset}`
        );
        if (result.hashscan_url) {
          log("🔗", `${c.dim}Hashscan: ${result.hashscan_url}${c.reset}`);
        }
      } else {
        log("⏸ ", `${c.yellow}Payment withheld. Manual review required.${c.reset}`);
      }

      console.log();
    } catch (err) {
      reviewed.delete(task.id); // allow retry on error
      log("❌", `${c.red}Review failed: ${(err as Error).message}${c.reset}`);
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

function statusIcon(s: Task["status"]): string {
  return { open: "🟢", claimed: "🟡", completed: "🔵", validated: "✅", expired: "⛔", refunded: "↩️" }[s] ?? "⬜";
}

async function listAndExit() {
  banner();
  log("📋", "Current tasks on the board:\n");
  const tasks = await listTasks();
  if (tasks.length === 0) {
    console.log("  (none)");
  } else {
    for (const t of tasks) {
      const mine = t.client_agent_wallet?.toLowerCase() === WALLET.toLowerCase();
      const tag  = mine ? c.cyan + " [mine]" + c.reset : "";
      console.log(
        `  ${c.bold}${statusIcon(t.status)} ${t.title}${c.reset}${tag}\n` +
        `     ${c.dim}${t.id.slice(0, 8)}…  ${t.budget_hbar}ℏ  ${t.status}${c.reset}\n`
      );
    }
  }
  process.exit(0);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--list")) {
    await listAndExit();
    return;
  }

  banner();

  // Snapshot already-completed tasks before posting new ones
  await snapshotExisting();

  if (!args.includes("--watch-only")) {
    await postInitialTasks();
  }

  log("👀", `Watching for completed tasks… ${c.dim}(Ctrl+C to stop)${c.reset}\n`);

  await watchAndReview();
  const interval = setInterval(watchAndReview, POLL_INTERVAL_MS);

  process.on("SIGINT", () => {
    clearInterval(interval);
    console.log("\n\n" + ts() + "  👋  Agent stopped.\n");
    process.exit(0);
  });
}

main().catch((err) => {
  console.error(c.red + "\nFatal: " + err.message + c.reset);
  process.exit(1);
});
