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
  return {
    bytes,
    contentType,
    extension: contentType === "image/jpeg" ? "jpg" : contentType === "image/png" ? "png" : "webp",
  };
}

export function mediaUrl(mediaKey: string) {
  return `/manus-storage/${mediaKey.replace(/^\/+/, "")}`;
}
