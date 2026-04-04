"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IDKitRequestWidget, orbLegacy } from "@worldcoin/idkit";
import type { IDKitResult, RpContext } from "@worldcoin/idkit";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";

const isMock = process.env.NEXT_PUBLIC_MOCK_WORLDID === "true";

export function RegisterWidget() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rpContext, setRpContext] = useState<RpContext | null>(null);

  const registerMutation = trpc.auth.register.useMutation();

  // Fetch RP context for staging/prod widget (not needed in mock mode)
  useEffect(() => {
    if (isMock) return;
    fetch("/api/rp-context", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "register" }),
    })
      .then((res) => res.json())
      .then((ctx: RpContext) => setRpContext(ctx))
      .catch(() => toast.error("Failed to load verification context. Please refresh."));
  }, []);

  // ─── Error helper ───────────────────────────────────────────────────────────
  function handleRegisterError(err: unknown) {
    if (err && typeof err === "object" && "message" in err) {
      const msg = (err as { message: string }).message;
      if (msg === "HUMAN_ALREADY_REGISTERED") {
        toast.error("This World ID is already registered. Use /api/admin/reset to clear for demo.");
        return;
      }
    }
    toast.error("Registration failed. Please try again.");
  }

  // ─── Mock mode ──────────────────────────────────────────────────────────────
  async function handleMockRegister() {
    try {
      await registerMutation.mutateAsync({
        rp_id: "mock-rp-id",
        idkit_response: { mock: true, action: "register", timestamp: Date.now() },
        role: "worker",
      });
      router.push("/tasks");
    } catch (err) {
      handleRegisterError(err);
    }
  }

  if (isMock) {
    return (
      <Button
        size="lg"
        onClick={handleMockRegister}
        disabled={registerMutation.isPending}
        className="w-full"
      >
        {registerMutation.isPending ? "Registering…" : "Register as Worker (Mock)"}
      </Button>
    );
  }

  // ─── Staging / production widget ────────────────────────────────────────────
  async function handleVerify(result: IDKitResult) {
    try {
      await registerMutation.mutateAsync({
        rp_id: rpContext!.rp_id,
        idkit_response: result,
        role: "worker",
      });
    } catch (err) {
      handleRegisterError(err);
      throw err; // Re-throw so IDKit shows an error state, not onSuccess
    }
  }

  function onSuccess() {
    router.push("/tasks");
  }

  return (
    <>
      <Button
        size="lg"
        onClick={() => setOpen(true)}
        disabled={!rpContext || registerMutation.isPending}
        className="w-full"
      >
        {rpContext ? "Register with World ID" : "Loading…"}
      </Button>

      {rpContext && (
        <IDKitRequestWidget
          open={open}
          onOpenChange={setOpen}
          app_id={(process.env.NEXT_PUBLIC_APP_ID ?? "") as `app_${string}`}
          action="register"
          rp_context={rpContext}
          allow_legacy_proofs={true}
          preset={orbLegacy()}
          handleVerify={handleVerify}
          onSuccess={onSuccess}
        />
      )}
    </>
  );
}
