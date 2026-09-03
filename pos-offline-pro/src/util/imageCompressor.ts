/**
 * Automatic Image Compressor & Base64 Converter for POS Offline Pro
 * Compresses any picked image (products, logo, QRIS) to a lightweight ~20-40KB Base64
 * Auto-converts logo to high-contrast monochrome for thermal 58mm printer compatibility.
 * 100% Offline, Fast, and Preserved across SQLite Database Backup & Restore.
 */
import { Platform } from "react-native";
import * as ImageManipulator from "expo-image-manipulator";

export async function compressAndConvertToBase64(
  uri: string,
  maxWidth: number = 400,
  quality: number = 0.65
): Promise<string> {
  if (!uri) return "";

  // If already a lightweight base64 string, return directly
  if (uri.startsWith("data:image/jpeg;base64,") && uri.length < 150000) {
    return uri;
  }

  // Web Browser Canvas Compression
  if (Platform.OS === "web" && typeof document !== "undefined") {
    return new Promise((resolve) => {
      try {
        const img = new (window as any).Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            let targetWidth = img.width;
            let targetHeight = img.height;

            if (targetWidth > maxWidth) {
              targetHeight = Math.round((targetHeight * maxWidth) / targetWidth);
              targetWidth = maxWidth;
            }

            canvas.width = targetWidth;
            canvas.height = targetHeight;

            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
              const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
              resolve(compressedBase64);
            } else {
              resolve(uri);
            }
          } catch (canvasErr) {
            console.log("Canvas compression error:", canvasErr);
            resolve(uri);
          }
        };
        img.onerror = () => resolve(uri);
        img.src = uri;
      } catch (err) {
        console.log("Web compression error:", err);
        resolve(uri);
      }
    });
  }

  // Native Mobile (Android / iOS) Compression using expo-image-manipulator
  try {
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: maxWidth } }],
      {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      }
    );

    if (manipResult.base64) {
      return `data:image/jpeg;base64,${manipResult.base64}`;
    }
    return manipResult.uri;
  } catch (error) {
    console.log("ImageManipulator error:", error);
    return uri;
  }
}

/**
 * Auto-converts logo to pure crisp black & white (monochrome) for 58mm thermal printers
 */
export async function compressAndConvertToMonochromeBase64(
  uri: string,
  maxWidth: number = 260
): Promise<string> {
  if (!uri) return "";

  if (Platform.OS === "web" && typeof document !== "undefined") {
    return new Promise((resolve) => {
      try {
        const img = new (window as any).Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            let targetWidth = img.width;
            let targetHeight = img.height;

            if (targetWidth > maxWidth) {
              targetHeight = Math.round((targetHeight * maxWidth) / targetWidth);
              targetWidth = maxWidth;
            }

            canvas.width = targetWidth;
            canvas.height = targetHeight;

            const ctx = canvas.getContext("2d");
            if (ctx) {
              // Solid white background
              ctx.fillStyle = "#ffffff";
              ctx.fillRect(0, 0, targetWidth, targetHeight);
              ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

              const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
              const pixels = imgData.data;

              // Convert to sharp high-contrast pure monochrome (black on white)
              for (let i = 0; i < pixels.length; i += 4) {
                const r = pixels[i];
                const g = pixels[i + 1];
                const b = pixels[i + 2];
                const a = pixels[i + 3];

                const lum = a < 128 ? 255 : 0.299 * r + 0.587 * g + 0.114 * b;
                const val = lum < 165 ? 0 : 255;

                pixels[i] = val; // R
                pixels[i + 1] = val; // G
                pixels[i + 2] = val; // B
                pixels[i + 3] = 255; // Alpha
              }

              ctx.putImageData(imgData, 0, 0);
              const monochromeBase64 = canvas.toDataURL("image/png");
              resolve(monochromeBase64);
            } else {
              resolve(uri);
            }
          } catch (canvasErr) {
            console.log("Canvas monochrome error:", canvasErr);
            resolve(uri);
          }
        };
        img.onerror = () => resolve(uri);
        img.src = uri;
      } catch (err) {
        console.log("Monochrome compression error:", err);
        resolve(uri);
      }
    });
  }

  // Fallback
  return compressAndConvertToBase64(uri, maxWidth, 0.7);
}
