/**
 * Automatic Image Compressor & Base64 Converter for POS Offline Pro
 * Compresses any picked image (products, logo, QRIS) to a lightweight ~20-40KB JPEG Base64
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
    console.error("Image compression error:", error);
    return uri;
  }
}
