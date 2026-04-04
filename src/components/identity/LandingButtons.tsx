"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LandingButtons() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
      <Link
        href="/register"
        className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}
      >
        Register as Worker
      </Link>
      <Link
        href="/tasks"
        className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto")}
      >
        Browse Tasks
      </Link>
    </div>
  );
}
