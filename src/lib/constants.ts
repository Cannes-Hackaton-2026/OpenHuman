/**
 * Shared status colors for tasks across the application.
 */
export const STATUS_COLORS: Record<string, string> = {
  open: "bg-emerald-900/40 text-emerald-400 border border-emerald-800",
  claimed: "bg-amber-900/40 text-amber-400 border border-amber-800",
  completed: "bg-blue-900/40 text-blue-400 border border-blue-800",
  validated: "bg-zinc-800 text-zinc-400 border border-zinc-700",
  expired: "bg-red-900/40 text-red-400 border border-red-800",
  refunded: "bg-red-900/40 text-red-400 border border-red-800",
};
