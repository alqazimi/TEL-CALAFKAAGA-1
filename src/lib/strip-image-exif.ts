const MAX_EDGE = 3072;
const JPEG_QUALITY = 0.92;
/** Allow large phone photos; we re-encode down before upload. */
const MAX_INPUT_BYTES = 50 * 1024 * 1024;

/**
 * Re-encode an image via canvas so EXIF / GPS metadata is stripped before upload.
 * Accepts large phone photos and most common formats; output is a clear JPEG.
 */
export async function prepareImageForUpload(file: File): Promise<File> {
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error("Image is too large. Please choose a photo under 50MB.");
  }

  const type = file.type || guessMimeFromName(file.name);
  if (type && !type.startsWith("image/") && type !== "application/octet-stream") {
    throw new Error("Please choose an image file.");
  }

  // Keep animated GIF / SVG as-is (canvas would flatten / break them).
  if (type === "image/gif" || type === "image/svg+xml") {
    return file;
  }

  const decoded = await decodeImage(file, type);
  if (!decoded) {
    // Last resort: upload original bytes (better than blocking the member).
    return file;
  }

  try {
    const { width: srcW, height: srcH, draw } = decoded;
    const scale = Math.min(1, MAX_EDGE / Math.max(srcW, srcH));
    const width = Math.max(1, Math.round(srcW * scale));
    const height = Math.max(1, Math.round(srcH * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    draw(ctx, width, height);

    const blob = await canvasToJpegBlob(canvas, JPEG_QUALITY);
    if (!blob) return file;

    // If somehow still huge, compress a bit more.
    const finalBlob =
      blob.size > 8 * 1024 * 1024
        ? (await canvasToJpegBlob(canvas, 0.82)) ?? blob
        : blob;

    const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([finalBlob], `${baseName}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } finally {
    decoded.close();
  }
}

type DecodedImage = {
  width: number;
  height: number;
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
  close: () => void;
};

async function decodeImage(
  file: File,
  type: string
): Promise<DecodedImage | null> {
  // Prefer createImageBitmap (fast, honors EXIF orientation on modern browsers).
  try {
    const bitmap = await createImageBitmap(file);
    return {
      width: bitmap.width,
      height: bitmap.height,
      draw: (ctx, w, h) => ctx.drawImage(bitmap, 0, 0, w, h),
      close: () => bitmap.close(),
    };
  } catch {
    // fall through
  }

  // Fallback: HTMLImageElement (helps some Android / odd MIME cases).
  try {
    const url = URL.createObjectURL(file);
    try {
      const img = await loadHtmlImage(url);
      return {
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
        draw: (ctx, w, h) => ctx.drawImage(img, 0, 0, w, h),
        close: () => undefined,
      };
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch {
    // fall through
  }

  if (/heic|heif/i.test(type) || /\.(heic|heif)$/i.test(file.name)) {
    throw new Error(
      "This photo format is not supported. Please upload a JPG or PNG."
    );
  }

  return null;
}

function loadHtmlImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read image"));
    img.src = url;
  });
}

function canvasToJpegBlob(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
  });
}

function guessMimeFromName(name: string): string {
  if (/\.jpe?g$/i.test(name)) return "image/jpeg";
  if (/\.png$/i.test(name)) return "image/png";
  if (/\.webp$/i.test(name)) return "image/webp";
  if (/\.gif$/i.test(name)) return "image/gif";
  if (/\.bmp$/i.test(name)) return "image/bmp";
  if (/\.heic$/i.test(name)) return "image/heic";
  if (/\.heif$/i.test(name)) return "image/heif";
  return "";
}
