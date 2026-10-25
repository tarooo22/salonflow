import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const DB_ERROR_MESSAGE = "სერვერზე შეცდომა მოხდა. სცადეთ თავიდან.";

function isDbQueryError(error: unknown): boolean {
  // Walk the cause chain (bounded) looking for Drizzle's "Failed query: <sql> params: <values>" error.
  let current: unknown = error;
  for (let depth = 0; current instanceof Error && depth < 5; depth++) {
    if (current.name === "DrizzleQueryError" || current.message.startsWith("Failed query")) return true;
    current = current.cause;
  }
  return false;
}

/** Replaces Drizzle query errors (which embed SQL and bound params) with a generic Georgian message. */
export function formatTrpcError<S extends { message: string; data: Record<string, unknown> }>(shape: S, error: unknown): S {
  if (!isDbQueryError(error)) return shape;
  const data = { ...shape.data };
  if (process.env.NODE_ENV === "production") delete data.stack;
  return { ...shape, message: DB_ERROR_MESSAGE, data };
}

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error }) => formatTrpcError(shape, error),
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
