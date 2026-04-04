"use client";

import { Loader2 } from "lucide-react";
import { hashscanUrl } from "@/lib/core/hashscan";

interface HederaTxStatusProps {
  isPending: boolean;
  txId?: string;
  hashscanLink?: string;
  error?: string;
}

/**
 * Displays Hedera transaction processing state, success link, or error.
 *
 * @param isPending - Whether the transaction is currently processing
 * @param txId - The Hedera transaction ID (used to compute Hashscan link if hashscanLink not provided)
 * @param hashscanLink - Pre-computed Hashscan URL (falls back to computing from txId)
 * @param error - Error message to display if the transaction failed
 */
export function HederaTxStatus({ isPending, txId, hashscanLink, error }: HederaTxStatusProps) {
  if (isPending) {
    return (
      <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Processing on Hedera...</span>
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
    );
  }

  const resolvedTxId = txId || undefined;
  const link = hashscanLink ?? (resolvedTxId ? hashscanUrl(resolvedTxId) : undefined);

  if (link) {
    const truncatedId = resolvedTxId
      ? `${resolvedTxId.slice(0, 15)}...`
      : undefined;
    return (
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-blue-600 dark:text-blue-400 underline truncate block"
      >
        View on Hashscan{truncatedId ? ` · ${truncatedId}` : ""}
      </a>
    );
  }

  return null;
}
