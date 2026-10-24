import { describe, expect, it } from "vitest";
import { parseImageDataUrl } from "./media";

const b64 = (bytes: number[]) => Buffer.from(bytes).toString("base64");
const PNG = b64([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG = b64([0xff, 0xd8, 0xff, 0xe0]);
const WEBP = Buffer.concat([Buffer.from("RIFF"), Buffer.from([0, 0, 0, 0]), Buffer.from("WEBP")]).toString("base64");
const message = "მხოლოდ JPEG, PNG ან WebP ფოტო შეიძლება აიტვირთოს";

describe("media upload parser", () => {
  it("accepts supported image data URLs whose header matches the declared type", () => {
    const png = parseImageDataUrl(`data:image/png;base64,${PNG}`);
    expect(png.contentType).toBe("image/png");
    expect(png.extension).toBe("png");
    expect(parseImageDataUrl(`data:image/jpeg;base64,${JPEG}`).extension).toBe("jpg");
    expect(parseImageDataUrl(`data:image/webp;base64,${WEBP}`).extension).toBe("webp");
  });

  it("rejects unsupported formats, and bytes that do not match the declared type", () => {
    expect(() => parseImageDataUrl("data:image/svg+xml;base64,PHN2Zz4=")).toThrow(message);
    expect(() => parseImageDataUrl("data:image/png;base64,aGVsbG8=")).toThrow(message);
    expect(() => parseImageDataUrl(`data:image/png;base64,${JPEG}`)).toThrow(message);
    expect(() => parseImageDataUrl(`data:image/webp;base64,${PNG}`)).toThrow(message);
  });
});
