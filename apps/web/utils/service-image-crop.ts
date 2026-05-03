import type { Area } from "react-easy-crop";

/** Matches public booking cards (`aspect-video`) and wide service banners. */
export const SERVICE_BOOKING_IMAGE_ASPECT = 16 / 9;

export const SERVICE_BOOKING_IMAGE_RECOMMENDED_WIDTH = 1200;
export const SERVICE_BOOKING_IMAGE_RECOMMENDED_HEIGHT = 675;

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("IMAGE_LOAD_FAILED"));
    img.src = src;
  });
}

export async function getCroppedImageDataUrl(
  imageSrc: string,
  pixelCrop: Area,
  p: { maxOutputWidth?: number; mimeType?: string; quality?: number } = {},
): Promise<string> {
  const maxOutputWidth = p.maxOutputWidth ?? SERVICE_BOOKING_IMAGE_RECOMMENDED_WIDTH;
  const mimeType = p.mimeType ?? "image/jpeg";
  const quality = p.quality ?? 0.88;

  if (pixelCrop.width < 1 || pixelCrop.height < 1) {
    throw new Error("INVALID_CROP");
  }

  const image = await loadImageElement(imageSrc);
  const scale = pixelCrop.width > maxOutputWidth ? maxOutputWidth / pixelCrop.width : 1;
  const outW = Math.max(1, Math.round(pixelCrop.width * scale));
  const outH = Math.max(1, Math.round(pixelCrop.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("NO_2D_CONTEXT");
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outW,
    outH,
  );

  return canvas.toDataURL(mimeType, mimeType === "image/jpeg" ? quality : undefined);
}
