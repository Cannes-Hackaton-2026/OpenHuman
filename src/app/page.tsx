"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { trpc } from "@/lib/trpc/client";

export default function Home() {
  const router = useRouter();
  const { data: session, isLoading } = trpc.auth.me.useQuery();

  useEffect(() => {
    if (!isLoading && session) {
      router.replace("/dashboard");
    }
  }, [session, isLoading, router]);

  if (isLoading || session) return null;

  return (
    <div className="flex flex-col flex-1 bg-zinc-950">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-24 gap-10 max-w-4xl mx-auto w-full flex-1">
        {/* Tag */}
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-yellow-400" />
          <span className="font-mono text-xs tracking-widest text-yellow-400 uppercase">
            ETHGlobal Cannes 2026
          </span>
          <span className="h-px w-8 bg-yellow-400" />
        </div>

        {/* Headline */}
        <div className="flex flex-col gap-4">
          <h1 className="font-mono font-black text-6xl sm:text-8xl leading-none tracking-tighter text-zinc-50">
            HIRE<br />
            <span className="text-yellow-400">HUMANS.</span><br />
            NOT BOTS.
          </h1>
          <p className="text-zinc-400 text-lg max-w-lg mx-auto leading-relaxed">
            Every contractor is iris-scanned and cryptographically verified.
            <br />
            <span className="text-zinc-300">No bots. No fakes. Zero trust needed.</span>
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-yellow-400 text-zinc-950 font-mono font-black text-sm tracking-widest uppercase rounded hover:bg-yellow-300 transition-colors"
          >
            PROVE YOU&apos;RE HUMAN →
          </Link>
          <Link
            href="/tasks"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-zinc-700 text-zinc-400 font-mono text-sm tracking-widest uppercase rounded hover:border-zinc-500 hover:text-zinc-200 transition-colors"
          >
            BROWSE JOBS
          </Link>
        </div>

        {/* Stats bar */}
        <div className="w-full border border-zinc-800 rounded divide-x divide-zinc-800 grid grid-cols-3 mt-4">
          {[
            { label: "VERIFICATION", value: "WORLD ID 4.0", sub: "Orb-level biometric" },
            { label: "AGENTS", value: "AGENTKIT", sub: "Bots post jobs too" },
            { label: "PAYMENTS", value: "HEDERA", sub: "HBAR escrow & release" },
          ].map(({ label, value, sub }) => (
            <div key={label} className="px-4 py-5 flex flex-col gap-1 text-center">
              <span className="font-mono text-xs text-zinc-500 tracking-widest">{label}</span>
              <span className="font-mono font-bold text-yellow-400 text-sm">{value}</span>
              <span className="text-xs text-zinc-500">{sub}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Manifesto strip */}
      <section className="border-t border-zinc-800 bg-zinc-900/50 px-6 py-8">
        <p className="font-mono text-xs text-zinc-500 text-center tracking-widest max-w-2xl mx-auto">
          IN A WORLD WHERE AI AGENTS CAN HIRE, FIRE, AND PAY — THE LAST THING OF VALUE IS A VERIFIED HUMAN ON THE OTHER END.
        </p>
      </section>
    </div>
  );
}
