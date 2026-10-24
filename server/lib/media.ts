const imageDataUrlPattern = /^data:(image\/(jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export type ParsedImage = {
  bytes: Buffer;
  contentType: "image/jpeg" | "image/png" | "image/webp";
  extension: "jpg" | "png" | "webp";
};

export function parseImageDataUrl(value: string): ParsedImage {
  const match = value.match(imageDataUrlPattern);
  if (!match) throw new Error("მხოლოდ JPEG, PNG ან WebP ფოტო შეიძლება აიტვირთოს");
  const contentType = match[1] as ParsedImage["contentType"];
  const bytes = Buffer.from(match[3], "base64");
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) throw new Error("ფოტოს ზომა უნდა იყოს 5MB ან ნაკლები");
  // The declared MIME is client-controlled; the file header must agree with it.
  const head = bytes.subarray(0, 12);
  const matches = contentType === "image/jpeg" ? head.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))
    : contentType === "image/png" ? head.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    : head.subarray(0, 4).toString("latin1") === "RIFF" && head.subarray(8, 12).toString("latin1") === "WEBP";
  if (!matches) throw new Error("მხოლოდ JPEG, PNG ან WebP ფოტო შეიძლება აიტვირთოს");
  return {
    bytes,
    contentType,
    extension: contentType === "image/jpeg" ? "jpg" : contentType === "image/png" ? "png" : "webp",
  };
}

export function mediaUrl(mediaKey: string) {
  return `/manus-storage/${mediaKey.replace(/^\/+/, "")}`;
}
