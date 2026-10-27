import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
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

const VALIDATION_FALLBACK = "შეამოწმეთ შეყვანილი მონაცემები.";
const MKHEDRULI = /[ა-ჿ]/;

function findZodError(error: unknown): ZodError | null {
  let current: unknown = error;
  for (let depth = 0; current && depth < 5; depth++) {
    if (current instanceof ZodError) return current;
    current = current instanceof Error ? current.cause : null;
  }
  return null;
}

/** Georgian summary of a validation error: the first issue's own message when it is already Georgian, else a generic one per issue kind. */
export function zodErrorMessage(zodError: ZodError): string {
  const issue = zodError.issues[0] as { code?: string; message?: string; format?: string; origin?: string } | undefined;
  if (!issue) return VALIDATION_FALLBACK;
  if (issue.message && MKHEDRULI.test(issue.message)) return issue.message;
  if (issue.code === "too_big" && issue.origin === "string") return "ტექსტი ძალიან გრძელია.";
  if (issue.code === "invalid_format" && issue.format === "email") return "ელფოსტა არასწორია.";
  return VALIDATION_FALLBACK;
}

/** Replaces raw zod JSON and Drizzle query errors (which embed SQL and bound params) with Georgian messages. */
export function formatTrpcError<S extends { message: string; data: Record<string, unknown> }>(shape: S, error: unknown): S {
  const zodError = findZodError(error);
  if (zodError) return { ...shape, message: zodErrorMessage(zodError), data: { ...shape.data, zodError: zodError.flatten() } };
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
