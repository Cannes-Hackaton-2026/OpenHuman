"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import { HederaTxStatus } from "@/components/hedera-tx-status";

const DEPOSIT_AMOUNT = 50;

export function SimulateDepositButton() {
  const [lastTx, setLastTx] = useState<{ txId: string; hashscanLink: string } | null>(null);
  const utils = trpc.useUtils();

  const deposit = trpc.payment.simulateDeposit.useMutation({
    onSuccess: (data) => {
      setLastTx({ txId: data.txId, hashscanLink: data.hashscanLink });
      utils.payment.getBalance.invalidate();
      toast.success(`Deposited ${DEPOSIT_AMOUNT} HBAR`, {
        description: `New balance: ${data.newBalance} HBAR`,
        action: {
          label: "View on Hashscan",
          onClick: () => window.open(data.hashscanLink, "_blank"),
        },
      });
    },
    onError: (error) => {
      toast.error("Deposit failed", { description: error.message });
    },
  });

  return (
    <div className="flex flex-col gap-3">
      <Button
        onClick={() => deposit.mutate({ amount_hbar: DEPOSIT_AMOUNT })}
        disabled={deposit.isPending}
        variant="default"
        className="w-full"
      >
        {deposit.isPending ? "Processing..." : `Simulate ${DEPOSIT_AMOUNT} HBAR Deposit`}
      </Button>

      <HederaTxStatus
        isPending={deposit.isPending}
        txId={lastTx?.txId}
        hashscanLink={lastTx?.hashscanLink}
        error={deposit.error?.message}
      />
    </div>
  );
}
