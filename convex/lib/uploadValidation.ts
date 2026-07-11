import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

/** Matches client compress output + raw small-file path in strip-image-exif.ts */
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

type StorageMeta = {
  _id: Id<"_storage">;
  contentType?: string;
  size: number;
};

/**
 * Validate uploaded blob MIME + size, then delete and reject if invalid.
 * Uses the `_storage` system table (not deprecated getMetadata).
 */
export async function assertValidImageUpload(
  ctx: MutationCtx,
  storageId: Id<"_storage">
): Promise<StorageMeta> {
  const meta = (await ctx.db.system.get(
    "_storage",
    storageId
  )) as StorageMeta | null;
  if (!meta) {
    throw new Error("Upload not found");
  }

  const contentType = (meta.contentType ?? "").toLowerCase().trim();
  if (!contentType || !ALLOWED_CONTENT_TYPES.has(contentType)) {
    await ctx.storage.delete(storageId);
    throw new Error("Only JPG, PNG, or WebP images are allowed");
  }

  if (meta.size <= 0 || meta.size > MAX_UPLOAD_BYTES) {
    await ctx.storage.delete(storageId);
    throw new Error("Image is too large. Please choose a photo under 2MB after compression.");
  }

  return meta;
}
