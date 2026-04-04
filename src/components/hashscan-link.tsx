"use client";

import { ExternalLink } from "lucide-react";
import { hashscanUrl } from "@/lib/core/hashscan";

interface HashscanLinkProps {
  txId: string;
  label?: string;
}

/**
 * Renders a Hedera transaction ID as a clickable Hashscan link.
 *
 * @param txId - The Hedera transaction ID
 * @param label - Display label (defaults to "View on Hashscan")
 */
export function HashscanLink({ txId, label = "View on Hashscan" }: HashscanLinkProps) {
  return (
    <a
      href={hashscanUrl(txId)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 underline hover:text-blue-700 dark:hover:text-blue-300"
    >
      <span className="truncate max-w-[200px]">{label}</span>
      <ExternalLink className="h-3 w-3 flex-shrink-0" />
    </a>
  );
}
