import { TRPCError } from "@trpc/server";
import { describe, expect, it, vi } from "vitest";
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

  it("leaves other errors untouched", () => {
    const other = new TRPCError({ code: "BAD_REQUEST", message: "არასწორი მონაცემი" });
    expect(formatTrpcError(shape, other)).toBe(shape);
  });
});
