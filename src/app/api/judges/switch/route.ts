import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users, nullifiers } from "@/server/db/schema";
import { createSession, SESSION_COOKIE_OPTIONS } from "@/lib/core/session";

const DEMO_AGENT_WALLET = "0x000000000000000000000000000000000a21a001";

const PERSONAS = {
  "kenji-worker": {
    nullifier: "judge-demo-kenji-worker",
    role: "worker" as const,
    redirect: "/tasks",
    hbar_balance: 0,
  },
  "sophie-client": {
    nullifier: "judge-demo-sophie-client",
    role: "client" as const,
    redirect: "/client/new-task",
    hbar_balance: 500,
  },
  "aria-agent": {
    wallet: DEMO_AGENT_WALLET,
  },
} as const;

type HumanPersona = "kenji-worker" | "sophie-client";
type PersonaKey = keyof typeof PERSONAS;

function isHumanPersona(key: PersonaKey): key is HumanPersona {
  return key === "kenji-worker" || key === "sophie-client";
}

/**
 * Upserts a demo persona user and nullifier, then creates a session.
 * Returns the JWT token and redirect URL.
 */
async function switchToHuman(personaKey: HumanPersona) {
  const persona = PERSONAS[personaKey];

  const [user] = await db.transaction(async (tx) => {
    const [u] = await tx
      .insert(users)
      .values({
        nullifier: persona.nullifier,
        role: persona.role,
        hbar_balance: persona.hbar_balance,
      })
      .onConflictDoUpdate({
        target: users.nullifier,
        set: { role: persona.role, hbar_balance: persona.hbar_balance },
      })
      .returning();

    await tx
      .insert(nullifiers)
      .values({ nullifier: persona.nullifier, action: "register" })
      .onConflictDoNothing();

    return [u];
  });

  const token = await createSession({
    nullifier: user.nullifier,
    role: user.role,
    userId: user.id,
  });

  return { token, redirect: persona.redirect, user };
}

/**
 * Triggers an agent task creation via the MCP endpoint.
 */
async function triggerAgent(req: NextRequest) {
  const agentWallet = PERSONAS["aria-agent"].wallet;
  const origin = req.nextUrl.origin;

  const mcpBody = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "create_task",
      arguments: {
        title: "Demo: Translate landing page to French",
        description:
          "Translate the HumanProof landing page copy into French for the ETHGlobal Cannes demo.",
        budget_hbar: 50,
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    },
  };

  const mcpResponse = await fetch(`${origin}/api/mcp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-agentkit-auth": `AgentKit ${agentWallet}`,
    },
    body: JSON.stringify(mcpBody),
  });

  const result = await mcpResponse.json();

  let taskId: string | null = null;
  let escrowTxId: string | null = null;
  try {
    const content = result?.result?.content?.[0]?.text;
    if (content) {
      const parsed = JSON.parse(content);
      taskId = parsed?.taskId ?? null;
      escrowTxId = parsed?.escrowTxId ?? null;
    }
  } catch {
    // MCP response not parseable, leave taskId/escrowTxId null
  }

  return { taskId, escrowTxId, agentWallet };
}

export async function POST(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key");
  if (adminKey !== process.env.ADMIN_RESET_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const persona = body.persona as PersonaKey | undefined;

  if (!persona || !(persona in PERSONAS)) {
    return NextResponse.json(
      { error: "Invalid persona. Use: kenji-worker, sophie-client, or aria-agent" },
      { status: 400 }
    );
  }

  if (isHumanPersona(persona)) {
    const { token, redirect, user } = await switchToHuman(persona);

    const response = NextResponse.json({
      success: true,
      persona,
      redirect,
      user: { id: user.id, nullifier: user.nullifier, role: user.role },
    });
    response.cookies.set("session", token, SESSION_COOKIE_OPTIONS);

    return response;
  }

  // aria-agent
  const { taskId, escrowTxId, agentWallet } = await triggerAgent(req);

  return NextResponse.json({
    success: true,
    persona: "aria-agent",
    agentWallet,
    taskId,
    escrowTxId,
  });
}
