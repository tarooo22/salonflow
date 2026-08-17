const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const supportedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export function validateImageFile(file: File) {
  if (!supportedTypes.has(file.type)) throw new Error("აირჩიეთ JPEG, PNG ან WebP ფოტო.");
  if (!file.size || file.size > MAX_IMAGE_BYTES) throw new Error("ფოტოს ზომა უნდა იყოს 5MB ან ნაკლები.");
}

export function fileToImageDataUrl(file: File): Promise<string> {
  validateImageFile(file);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("ფაილის წაკითხვა ვერ მოხერხდა."));
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("ფაილის წაკითხვა ვერ მოხერხდა."));
    reader.readAsDataURL(file);
  });
}
