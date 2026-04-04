"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { trpc } from "@/lib/trpc/client";

const NAV = [
  { href: "/tasks", label: "JOBS" },
  { href: "/client/new-task", label: "POST A JOB" },
  { href: "/profile", label: "PROFILE" },
];

export function Header() {
  const pathname = usePathname();
  const { data: session } = trpc.auth.me.useQuery();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link
          href={session ? "/dashboard" : "/"}
          className="font-mono font-bold text-yellow-400 tracking-tighter text-lg hover:text-yellow-300 transition-colors shrink-0"
        >
          RARH
        </Link>

        {/* Nav */}
        {session && (
          <nav className="flex items-center gap-1">
            {NAV.map(({ href, label }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-1.5 rounded text-xs font-mono font-semibold tracking-widest transition-colors ${
                    active
                      ? "bg-yellow-400 text-zinc-950"
                      : "text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right — verified badge or CTA */}
        {session ? (
          <Link href="/profile" className="flex items-center gap-2 shrink-0 group">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-xs text-zinc-400 group-hover:text-zinc-50 transition-colors hidden sm:block">
              {session.nullifier.slice(0, 10)}…
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
              VERIFIED
            </span>
          </Link>
        ) : (
          <Link
            href="/register"
            className="px-3 py-1.5 rounded text-xs font-mono font-bold bg-yellow-400 text-zinc-950 hover:bg-yellow-300 transition-colors"
          >
            PROVE HUMANITY →
          </Link>
        )}
      </div>
    </header>
  );
}
