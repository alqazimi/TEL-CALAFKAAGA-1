import type { Id } from "../../convex/_generated/dataModel";
import { prepareImageForUpload } from "@/lib/strip-image-exif";

const IMAGE_EXT =
  /\.(jpe?g|png|webp|gif|bmp|heic|heif|tiff?|avif)$/i;

/** Clear the input so choosing the same file again still fires `onChange`. */
export function resetFileInput(input: HTMLInputElement | null | undefined) {
  if (input) input.value = "";
}

function looksLikeImage(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  if (
    (!file.type || file.type === "application/octet-stream") &&
    IMAGE_EXT.test(file.name)
  ) {
    return true;
  }
  if (!file.type && file.size > 0 && IMAGE_EXT.test(file.name)) return true;
  return false;
}

function friendlyUploadError(error: unknown): string {
  if (!(error instanceof Error) || !error.message) {
    return "Upload failed. Please try again.";
  }
  const raw = error.message
    .replace(/^\[CONVEX[^\]]*\]\s*/i, "")
    .replace(/^Uncaught Error:\s*/i, "")
    .split("\n")[0]
    ?.trim();
  return raw || "Upload failed. Please try again.";
}

/**
 * Compress + strip EXIF, POST to Convex storage, return storage id.
 */
export async function uploadImageToConvex(
  file: File,
  generateUploadUrl: () => Promise<string>
): Promise<Id<"_storage">> {
  if (!looksLikeImage(file)) {
    throw new Error("Please choose an image file.");
  }

  let prepared: File;
  try {
    prepared = await prepareImageForUpload(file);
  } catch (error) {
    throw new Error(friendlyUploadError(error));
  }

  const uploadUrl = await generateUploadUrl();
  let result: Response;
  try {
    result = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": prepared.type || "image/jpeg" },
      body: prepared,
    });
  } catch {
    throw new Error("Upload failed. Check your connection and try again.");
  }

  if (!result.ok) {
    throw new Error("Upload failed. Please try a smaller JPG or PNG.");
  }

  let body: { storageId?: string } = {};
  try {
    body = await result.json();
  } catch {
    throw new Error("Upload failed. Please try again.");
  }

  if (!body.storageId) {
    throw new Error("Upload failed. Please try again.");
  }

  return body.storageId as Id<"_storage">;
}
