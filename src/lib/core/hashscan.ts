/**
 * Converts a Hedera transaction ID to a Hashscan explorer URL.
 * Client-safe: no server-only dependencies.
 *
 * @param txId - Hedera TX ID in format "0.0.X@seconds.nanos"
 * @returns Full Hashscan URL for the transaction
 */
export function hashscanUrl(txId: string): string {
  const [accountPart, timestampPart] = txId.split("@");
  if (!timestampPart) {
    return `https://hashscan.io/testnet/transaction/${txId}`;
  }
  const formatted = `${accountPart}-${timestampPart.replace(".", "-")}`;
  return `https://hashscan.io/testnet/transaction/${formatted}`;
}
