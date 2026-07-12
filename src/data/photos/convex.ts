import { getConvexClient } from "@/lib/convex-client";
import { api } from "../../../convex/_generated/api";
import { uploadImageToConvex } from "@/lib/upload-image";
import { track } from "../telemetry";
import type { PhotosAdapter } from "./types";

export const convexPhotos: PhotosAdapter = {
  async requestUploadUrl() {
    const client = getConvexClient();
    const uploadUrl = await client.mutation(api.profiles.generateUploadUrl, {});
    return { uploadUrl };
  },

  async confirmUpload(args) {
    const client = getConvexClient();
    if (!args.storageId) {
      throw new Error("storageId required for Convex confirmUpload");
    }
    return client.mutation(api.profiles.registerUpload, {
      storageId: args.storageId,
    } as never);
  },

  async addAdditional(args) {
    const client = getConvexClient();
    return client.mutation(api.profiles.addAdditionalPhoto, args as never);
  },

  async removeAdditional(id) {
    const client = getConvexClient();
    return client.mutation(api.profiles.removeAdditionalPhoto, {
      storageId: id,
    } as never);
  },

  async uploadFile(file) {
    try {
      const client = getConvexClient();
      const storageId = await uploadImageToConvex(file, () =>
        client.mutation(api.profiles.generateUploadUrl, {})
      );
      await client.mutation(api.profiles.registerUpload, { storageId } as never);
      return { storageId };
    } catch (e) {
      track("upload_failure");
      throw e;
    }
  },
};
