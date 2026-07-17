"use client";

import { useCallback, useEffect, useState } from "react";
import { useSafeMutation as useMutation } from "@/lib/use-safe-mutation";
import { api } from "../../../convex/_generated/api";
import { uploadImageToConvex } from "@/lib/upload-image";
import { isApiProvider } from "../provider";
import { getPhotosAdapter } from "./index";

/** Drop-in upload helper that preserves EXIF strip via upload-image / prepareImageForUpload. */
export function useUploadPhoto() {
  if (isApiProvider()) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useCallback(
      async (
        file: File,
        opts?: { slot?: "main" | "additional" | "private" }
      ) => getPhotosAdapter().uploadFile(file, opts),
      []
    );
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const generateUploadUrl = useMutation(api.profiles.generateUploadUrl);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const registerUpload = useMutation(api.profiles.registerUpload);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useCallback(
    async (
      file: File,
      _opts?: { slot?: "main" | "additional" | "private" }
    ) => {
      const storageId = await uploadImageToConvex(file, () =>
        generateUploadUrl({})
      );
      await registerUpload({ storageId } as never);
      return { storageId };
    },
    [generateUploadUrl, registerUpload]
  );
}

export function useAddAdditionalPhoto() {
  if (isApiProvider()) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useCallback(
      async (args: Record<string, unknown>) =>
        getPhotosAdapter().addAdditional(args),
      []
    );
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const mut = useMutation(api.profiles.addAdditionalPhoto);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useCallback(
    async (args: Record<string, unknown>) => mut(args as never),
    [mut]
  );
}

export function useRemoveAdditionalPhoto() {
  if (isApiProvider()) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useCallback(
      async (id: string) => getPhotosAdapter().removeAdditional(id),
      []
    );
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const mut = useMutation(api.profiles.removeAdditionalPhoto);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useCallback(
    async (id: string) => mut({ storageId: id } as never),
    [mut]
  );
}

export function useMyPhotos(enabled = true) {
  const [data, setData] = useState<unknown>(undefined);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!enabled || !isApiProvider()) {
      setData(enabled ? { photos: [] } : undefined);
      return;
    }
    let cancelled = false;
    void getPhotosAdapter()
      .listMine()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, tick]);
  const refresh = useCallback(() => setTick((n) => n + 1), []);
  return { data, refresh };
}
