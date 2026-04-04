import { router } from "@/lib/trpc/server";
import { authRouter } from "./auth";
import { taskRouter } from "./task";

export const appRouter = router({
  auth: authRouter,
  task: taskRouter,
});

export type AppRouter = typeof appRouter;
