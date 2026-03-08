"use client";

import { useCallback, useState } from "react";
import { Upload, ImageIcon, Loader2 } from "lucide-react";
import { useEditorStore } from "@/lib/store/editor-store";

// MIME types for validation (macOS often reports HEIC as "" or "application/octet-stream")
const IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

// File picker accept string — include extensions so macOS shows HEIC files
const FILE_ACCEPT = "image/jpeg,image/png,image/webp,.heic,.heif";

// HEIC magic byte detection — reads file header to identify HEIC regardless of
// MIME type or extension (macOS Photos often provides neither)
async function hasHeicSignature(file: File): Promise<boolean> {
  try {
    const buffer = await file.slice(0, 12).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    // HEIC files have an "ftyp" box at offset 4
    if (bytes[4] !== 0x66 || bytes[5] !== 0x74 || bytes[6] !== 0x79 || bytes[7] !== 0x70) {
      return false;
    }
    const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
    return ["heic", "heix", "mif1", "msf1", "hevc"].includes(brand);
  } catch {
    return false;
  }
}

function isAcceptedImage(file: File): boolean {
  if (IMAGE_MIMES.has(file.type)) return true;
  if (file.type === "" || file.type === "application/octet-stream") return true; // let magic bytes decide later
  return /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name);
}

export function ImageUpload() {
  const setSourceImage = useEditorStore((s) => s.setSourceImage);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      if (!isAcceptedImage(file)) {
        setError(`Unsupported file type (${file.type || "unknown"}). Use JPG, PNG, WebP, or HEIC.`);
        return;
      }

      try {
        let imageSource: Blob = file;

        // Detect HEIC via magic bytes — MIME type and extension are unreliable on macOS
        const isHeic =
          file.type === "image/heic" ||
          file.type === "image/heif" ||
          /\.heic$/i.test(file.name) ||
          (await hasHeicSignature(file));

        if (isHeic) {
          setConverting(true);
          try {
            const heic2any = (await import("heic2any")).default;
            const converted = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.95 });
            imageSource = Array.isArray(converted) ? converted[0] : converted;
          } catch {
            setError("Failed to convert HEIC. Try exporting as JPEG from Photos.");
            setConverting(false);
            return;
          }
          setConverting(false);
        }

        const bitmap = await createImageBitmap(imageSource);
        setSourceImage(bitmap, file.name);
      } catch {
        setError("Failed to load image. Try exporting as JPEG from Photos.");
      }
    },
    [setSourceImage]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      // Standard file drop (Finder, desktop, etc.)
      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
        return;
      }

      // macOS Photos app drops a URL or promise instead of a file.
      // Try to extract an image URL and fetch it as a blob.
      const url =
        e.dataTransfer.getData("text/uri-list") ||
        e.dataTransfer.getData("text/plain");

      if (url && url.startsWith("http")) {
        try {
          const res = await fetch(url);
          const blob = await res.blob();
          if (blob.type.startsWith("image/")) {
            const fetched = new File([blob], "photo.jpg", { type: blob.type });
            handleFile(fetched);
            return;
          }
        } catch {
          // Fall through to items check
        }
      }

      // Also check dataTransfer items for image content (clipboard-style drops)
      for (const item of Array.from(e.dataTransfer.items)) {
        if (item.kind === "file") {
          const itemFile = item.getAsFile();
          if (itemFile && isAcceptedImage(itemFile)) {
            handleFile(itemFile);
            return;
          }
        }
      }

      setError("Could not read the image. Try exporting from Photos as JPEG first, or click to browse.");
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = FILE_ACCEPT;
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleFile(file);
    };
    input.click();
  }, [handleFile]);

  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <button
        type="button"
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`flex h-80 w-full max-w-lg cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-muted-foreground"
        }`}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
          {converting ? (
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
          ) : isDragging ? (
            <ImageIcon className="h-6 w-6 text-primary" />
          ) : (
            <Upload className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            {converting
              ? "Converting HEIC..."
              : isDragging
                ? "Drop image here"
                : "Drop an image or click to browse"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            JPG, PNG, WebP, or HEIC
          </p>
        </div>
        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}
      </button>
    </div>
  );
}
