import { TRPCError } from "@trpc/server";
import { getR2SignedUrl, putR2Object } from "./r2";

export const STORAGE_ERROR_MESSAGE = "ფოტოს ატვირთვა ახლა ვერ მოხერხდა. სცადეთ მოგვიანებით.";

/** Storage failures (missing R2 config, network, credentials) reach people as a Georgian message; the detail is logged here only. */
function storageUnavailable(operation: string, error: unknown): TRPCError {
  console.error(`[storage] ${operation} failed:`, error instanceof Error ? error.message : error);
  return new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: STORAGE_ERROR_MESSAGE });
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const key = appendHashSuffix(normalizeKey(relKey));
  try {
    await putR2Object(key, data, contentType);
  } catch (error) {
    throw storageUnavailable("put", error);
  }
  return { key, url: `/manus-storage/${key}` };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: `/manus-storage/${key}` };
}

export async function storageGetSignedUrl(relKey: string, expiresIn = 900): Promise<string> {
  try {
    return await getR2SignedUrl(normalizeKey(relKey), expiresIn);
  } catch (error) {
    throw storageUnavailable("sign", error);
  }
}
