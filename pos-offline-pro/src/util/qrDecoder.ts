import jsQR from "jsqr";
import { Platform } from "react-native";

/**
 * Decode QR Code from Base64 or Image URI (100% offline pure JS)
 * Automatically scans any uploaded image (ShopeePay, BCA, Gopay, Mandiri, Dana, etc.)
 * and extracts the raw QRIS string payload.
 */
export async function decodeQrFromImage(
  imageUriOrBase64: string
): Promise<string | null> {
  if (!imageUriOrBase64) return null;

  try {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      return new Promise((resolve) => {
        const img = new window.Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            const w = img.naturalWidth || img.width;
            const h = img.naturalHeight || img.height;
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              resolve(null);
              return;
            }
            ctx.drawImage(img, 0, 0, w, h);
            const imageData = ctx.getImageData(0, 0, w, h);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "attemptBoth",
            });
            if (code && code.data) {
              resolve(code.data);
            } else {
              resolve(null);
            }
          } catch (err) {
            console.error("Canvas QR decode error:", err);
            resolve(null);
          }
        };
        img.onerror = () => resolve(null);

        let src = imageUriOrBase64;
        if (
          !src.startsWith("data:") &&
          !src.startsWith("http") &&
          !src.startsWith("blob:") &&
          !src.startsWith("file:")
        ) {
          src = `data:image/jpeg;base64,${src}`;
        }
        img.src = src;
      });
    }
  } catch (e) {
    console.warn("QR decode error:", e);
  }

  return null;
}
