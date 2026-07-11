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
  // Android cameras / share sheets often omit or use octet-stream
  if (
    (!file.type || file.type === "application/octet-stream") &&
    IMAGE_EXT.test(file.name)
  ) {
    return true;
  }
  // Some pickers send empty name + image MIME already handled above;
  // empty type + empty name: still try if size looks like a photo.
  if (!file.type && !file.name && file.size > 0) return true;
  return false;
}

/**
 * Strip EXIF, POST to a Convex storage upload URL, return the storage id.
 * Throws if the HTTP upload fails or Convex does not return a storageId.
 */
export async function uploadImageToConvex(
  file: File,
  generateUploadUrl: () => Promise<string>
): Promise<Id<"_storage">> {
  if (!looksLikeImage(file)) {
    throw new Error("Please choose an image file.");
  }

  const prepared = await prepareImageForUpload(file);
  const uploadUrl = await generateUploadUrl();
  const result = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": prepared.type || "image/jpeg" },
    body: prepared,
  });

  if (!result.ok) {
    throw new Error("Upload failed. Please try again.");
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
