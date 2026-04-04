import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Task Marketplace — HumanProof",
  description: "Browse and claim tasks from human clients and AI agents.",
};

export default function TasksPage() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex flex-col items-center gap-6 text-center px-6 py-24 max-w-2xl">
        <span className="text-4xl">✅</span>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Task Marketplace
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
          You are registered as a verified human worker. Available tasks will appear here once
          task listings are implemented (story 3.3).
        </p>
      </main>
    </div>
  );
}
