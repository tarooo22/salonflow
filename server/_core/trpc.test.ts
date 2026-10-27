import { TRPCError } from "@trpc/server";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { formatTrpcError } from "./trpc";

const shape = { message: "x", code: -32603, data: { code: "INTERNAL_SERVER_ERROR", httpStatus: 500, path: "p", stack: "trace" } };

describe("trpc error formatter", () => {
  it("hides Drizzle query text and params, even when nested in a cause", () => {
    const drizzle = new Error("Failed query: select * from clients where phone = ? params: +995555000111");
    const wrapped = new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause: drizzle });
    vi.stubEnv("NODE_ENV", "production");
    const formatted = formatTrpcError({ ...shape, message: drizzle.message }, wrapped);
    vi.unstubAllEnvs();
    expect(formatted.message).toBe("სერვერზე შეცდომა მოხდა. სცადეთ თავიდან.");
    expect(JSON.stringify(formatted)).not.toContain("+995");
    expect(formatted.data.stack).toBeUndefined();
    expect(formatted.data.code).toBe("INTERNAL_SERVER_ERROR");
  });

  describe("validation errors", () => {
    const wrap = (schema: z.ZodType, value: unknown) => {
      const parsed = schema.safeParse(value);
      if (parsed.success) throw new Error("expected failure");
      return new TRPCError({ code: "BAD_REQUEST", cause: parsed.error, message: parsed.error.message });
    };

    it("uses a Georgian generic message for invalid emails instead of raw JSON", () => {
      const error = wrap(z.object({ email: z.string().email() }), { email: "nope" });
      const formatted = formatTrpcError({ ...shape, message: error.message }, error);
      expect(formatted.message).toBe("ელფოსტა არასწორია.");
      expect(formatted.data.zodError).toBeDefined();
    });

    it("explains too-long text", () => {
      const error = wrap(z.object({ name: z.string().max(3) }), { name: "abcdef" });
      expect(formatTrpcError({ ...shape, message: error.message }, error).message).toBe("ტექსტი ძალიან გრძელია.");
    });

    it("keeps an issue message that is already Georgian", () => {
      const error = wrap(z.object({ name: z.string().min(2, "სახელი ძალიან მოკლეა.") }), { name: "a" });
      expect(formatTrpcError({ ...shape, message: error.message }, error).message).toBe("სახელი ძალიან მოკლეა.");
    });

    it("falls back to a generic Georgian message for other issues", () => {
      const error = wrap(z.object({ n: z.number() }), { n: "x" });
      expect(formatTrpcError({ ...shape, message: error.message }, error).message).toBe("შეამოწმეთ შეყვანილი მონაცემები.");
    });
  });

  it("leaves other errors untouched", () => {
    const other = new TRPCError({ code: "BAD_REQUEST", message: "არასწორი მონაცემი" });
    expect(formatTrpcError(shape, other)).toBe(shape);
  });
});
