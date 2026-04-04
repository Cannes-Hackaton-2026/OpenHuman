import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const randomUUID = vi.fn();
const getAuthenticatedAgentWallet = vi.fn();
const lookupAgentBookOwner = vi.fn();
const releasePayment = vi.fn();

const taskFindFirst = vi.fn();
const userFindFirst = vi.fn();
const insertValues = vi.fn();
const insertReturning = vi.fn();
const updateSet = vi.fn();
const updateWhere = vi.fn();

vi.mock("crypto", () => ({
  randomUUID,
}));

vi.mock("@/server/mcp/context", () => ({
  getAuthenticatedAgentWallet,
}));

vi.mock("@/lib/core/agentkit", () => ({
  lookupAgentBookOwner,
}));

vi.mock("@/lib/core/hedera", () => ({
  releasePayment,
}));

vi.mock("@/lib/db", () => ({
  db: {
    query: {
      tasks: { findFirst: taskFindFirst },
      users: { findFirst: userFindFirst },
    },
    insert: vi.fn(() => ({
      values: insertValues,
    })),
    update: vi.fn(() => ({
      set: updateSet,
    })),
  },
}));

beforeEach(() => {
  insertValues.mockReturnValue({ returning: insertReturning });
  updateSet.mockReturnValue({ where: updateWhere });

  getAuthenticatedAgentWallet.mockReturnValue(
    "0xabcd1234567890abcd1234567890abcd12345678"
  );
  randomUUID.mockReturnValue("00000000-0000-0000-0000-000000000001");
  lookupAgentBookOwner.mockResolvedValue({
    nullifier: "mock-owner-nullifier-abcd1234",
    status: "verified",
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("MCP agent task helpers", () => {
  it("rejects create_task when the supplied wallet does not match the authenticated agent", async () => {
    const { createAgentTask } = await import("@/server/mcp/task-tools");

    await expect(
      createAgentTask({
        agent_wallet: "0x9999999999999999999999999999999999999999",
        title: "Translate this doc",
        description: "Translate the whitepaper from English to French",
        budget_hbar: 10,
        deadline: "2026-04-06T12:00:00.000Z",
      })
    ).rejects.toThrow(
      "Unauthorized: agent_wallet does not match authenticated agent"
    );

    expect(lookupAgentBookOwner).not.toHaveBeenCalled();
    expect(insertReturning).not.toHaveBeenCalled();
  });

  it("persists the authenticated wallet instead of trusting caller casing or spoofed input", async () => {
    insertReturning.mockResolvedValue([
      {
        id: "task-1",
        escrow_tx_id: "mock-escrow-00000000-0000-0000-0000-000000000001",
        status: "open",
      },
    ]);

    const { createAgentTask } = await import("@/server/mcp/task-tools");

    const result = await createAgentTask({
      agent_wallet: "0xABCD1234567890ABCD1234567890ABCD12345678",
      title: "Translate this doc",
      description: "Translate the whitepaper from English to French",
      budget_hbar: 10,
      deadline: "2026-04-06T12:00:00.000Z",
    });

    expect(lookupAgentBookOwner).toHaveBeenCalledWith(
      "0xabcd1234567890abcd1234567890abcd12345678"
    );
    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        client_agent_wallet: "0xabcd1234567890abcd1234567890abcd12345678",
      })
    );
    expect(result).toEqual({
      task_id: "task-1",
      escrow_tx_id: "mock-escrow-00000000-0000-0000-0000-000000000001",
      status: "open",
      agentbook_status: "verified",
    });
  });

  it("rejects get_task_status when the supplied wallet does not match the authenticated agent", async () => {
    const { getAgentTaskStatus } = await import("@/server/mcp/task-tools");

    await expect(
      getAgentTaskStatus({
        task_id: "task-1",
        agent_wallet: "0x9999999999999999999999999999999999999999",
      })
    ).rejects.toThrow(
      "Unauthorized: agent_wallet does not match authenticated agent"
    );

    expect(taskFindFirst).not.toHaveBeenCalled();
  });

  it("blocks validate_task before payment when another validation already claimed the task", async () => {
    taskFindFirst.mockResolvedValue({
      id: "task-1",
      status: "completed",
      budget_hbar: 15,
      client_agent_wallet: "0xabcd1234567890abcd1234567890abcd12345678",
      worker_nullifier: "worker-1",
      payment_tx_id: null,
    });
    updateWhere.mockReturnValueOnce({
      returning: vi.fn().mockResolvedValue([]),
    });

    const { validateAgentTask } = await import("@/server/mcp/task-tools");

    await expect(
      validateAgentTask({
        task_id: "task-1",
        agent_wallet: "0xabcd1234567890abcd1234567890abcd12345678",
      })
    ).rejects.toThrow(
      "Task is already being validated or has already been paid"
    );

    expect(releasePayment).not.toHaveBeenCalled();
    expect(userFindFirst).not.toHaveBeenCalled();
  });

  it("claims validation first and then finalizes with a mock payment when the worker has no Hedera account", async () => {
    taskFindFirst.mockResolvedValue({
      id: "task-1",
      status: "completed",
      budget_hbar: 15,
      client_agent_wallet: "0xabcd1234567890abcd1234567890abcd12345678",
      worker_nullifier: "worker-1",
      payment_tx_id: null,
    });
    userFindFirst.mockResolvedValue({ hedera_account_id: null });
    updateWhere
      .mockReturnValueOnce({
        returning: vi.fn().mockResolvedValue([
          { id: "task-1", payment_tx_id: "processing-payment-task-1-00000000-0000-0000-0000-000000000001" },
        ]),
      })
      .mockReturnValueOnce({
        returning: vi.fn().mockResolvedValue([
          { id: "task-1", status: "validated", payment_tx_id: "mock-payment-task-1" },
        ]),
      });

    const { validateAgentTask } = await import("@/server/mcp/task-tools");

    const result = await validateAgentTask({
      task_id: "task-1",
      agent_wallet: "0xabcd1234567890abcd1234567890abcd12345678",
    });

    expect(releasePayment).not.toHaveBeenCalled();
    expect(updateSet).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        payment_tx_id:
          "processing-payment-task-1-00000000-0000-0000-0000-000000000001",
      })
    );
    expect(updateSet).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        status: "validated",
        payment_tx_id: "mock-payment-task-1",
      })
    );
    expect(result).toEqual({
      task_id: "task-1",
      status: "validated",
      payment_tx_id: "mock-payment-task-1",
    });
  });

  it("clears the processing marker if the Hedera payment attempt fails", async () => {
    taskFindFirst.mockResolvedValue({
      id: "task-1",
      status: "completed",
      budget_hbar: 15,
      client_agent_wallet: "0xabcd1234567890abcd1234567890abcd12345678",
      worker_nullifier: "worker-1",
      payment_tx_id: null,
    });
    userFindFirst.mockResolvedValue({ hedera_account_id: "0.0.12345" });
    releasePayment.mockRejectedValue(new Error("Hedera unavailable"));
    updateWhere
      .mockReturnValueOnce({
        returning: vi.fn().mockResolvedValue([
          { id: "task-1", payment_tx_id: "processing-payment-task-1-00000000-0000-0000-0000-000000000001" },
        ]),
      })
      .mockReturnValueOnce({});

    const { validateAgentTask } = await import("@/server/mcp/task-tools");

    await expect(
      validateAgentTask({
        task_id: "task-1",
        agent_wallet: "0xabcd1234567890abcd1234567890abcd12345678",
      })
    ).rejects.toThrow("Hedera unavailable");

    expect(updateSet).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ payment_tx_id: null })
    );
  });
});
