import { describe, expect, it } from "vitest";
import { parseImageDataUrl } from "./media";

describe("media upload parser", () => {
  it("accepts supported image data URLs and records a safe content type", () => {
    const image = parseImageDataUrl("data:image/png;base64,aGVsbG8=");
    expect(image.contentType).toBe("image/png");
    expect(image.extension).toBe("png");
    expect(image.bytes.toString()).toBe("hello");
  });

  it("rejects unsupported or unsafe image formats", () => {
    expect(() => parseImageDataUrl("data:image/svg+xml;base64,PHN2Zz4=")).toThrow("მხოლოდ JPEG, PNG ან WebP ფოტო შეიძლება აიტვირთოს");
  });
});
