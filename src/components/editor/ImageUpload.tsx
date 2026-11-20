"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import {
  Upload,
  ImageIcon,
  Loader2,
  ArrowUpRight,
  ShieldCheck,
  Crop,
  SlidersHorizontal,
  Layers,
} from "lucide-react";
import { createSampleImage, drawSample } from "@/lib/image-processing/sample";
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
    if (
      bytes[4] !== 0x66 ||
      bytes[5] !== 0x74 ||
      bytes[6] !== 0x79 ||
      bytes[7] !== 0x70
    ) {
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
  const sampleRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (sampleRef.current) drawSample(sampleRef.current);
  }, []);
  const setSourceImage = useEditorStore((s) => s.setSourceImage);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      if (!isAcceptedImage(file)) {
        setError(
          `Unsupported file type (${file.type || "unknown"}). Use JPG, PNG, WebP, or HEIC.`,
        );
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
            const converted = await heic2any({
              blob: file,
              toType: "image/jpeg",
              quality: 0.95,
            });
            imageSource = Array.isArray(converted) ? converted[0] : converted;
          } catch {
            setError(
              "Failed to convert HEIC. Try exporting as JPEG from Photos.",
            );
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
    [setSourceImage],
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

      setError(
        "Could not read the image. Try exporting from Photos as JPEG first, or click to browse.",
      );
    },
    [handleFile],
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

  const handleSample = async () => {
    setError(null);
    try {
      setSourceImage(await createSampleImage(), "tonal-study.png");
    } catch {
      setError("The sample could not open. Choose an image instead.");
    }
  };

  return (
    <div className="studio-welcome">
      <div className="studio-welcome-grid">
        <section
          className="studio-welcome-copy"
          aria-labelledby="welcome-heading"
        >
          <p className="studio-eyebrow">Your image. Ready for its next life.</p>
          <h2 id="welcome-heading">
            From photograph
            <br />
            to finished print.
          </h2>
          <p className="studio-intro">
            Shape the crop and tone once. Take away a fine art print,
            transparent artwork for apparel, and the original colour crop.
          </p>
          <button
            type="button"
            onClick={handleClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            disabled={converting}
            className={`studio-dropzone ${isDragging ? "is-dragging" : ""}`}
          >
            {converting ? (
              <Loader2
                className="size-6 animate-spin motion-reduce:animate-none"
                aria-hidden
              />
            ) : isDragging ? (
              <ImageIcon className="size-6" aria-hidden />
            ) : (
              <Upload className="size-6" aria-hidden />
            )}
            <span className="font-medium">
              {converting
                ? "Converting your image"
                : isDragging
                  ? "Drop it here"
                  : "Choose a photograph"}
            </span>
            <span className="text-xs text-muted-foreground">
              or drag it here. JPG, PNG, WebP and HEIC.
            </span>
          </button>
          <button
            type="button"
            onClick={handleSample}
            className="studio-sample-link"
          >
            Try the tonal study <ArrowUpRight size={16} aria-hidden />
          </button>
          {error && (
            <p role="alert" className="mt-3 text-sm text-destructive">
              {error}
            </p>
          )}
          <p className="studio-privacy">
            <ShieldCheck size={15} aria-hidden />
            Images are processed on your device.
          </p>
        </section>
        <figure className="studio-study">
          <div className="studio-study-top">
            <span>Tonal study / 01</span>
            <span>Synthetic sample</span>
          </div>
          <canvas
            ref={sampleRef}
            width={1200}
            height={900}
            aria-label="A synthetic mountain study with a range of light and dark tones"
            role="img"
          />
          <figcaption>
            <span>A little room to experiment.</span>
            <span>Open it in the real editor.</span>
          </figcaption>
        </figure>
      </div>
      <div className="studio-workflow" aria-label="Editing workflow">
        {[
          {
            Icon: Crop,
            title: "Frame it",
            detail: "A crop that keeps your proportions.",
          },
          {
            Icon: SlidersHorizontal,
            title: "Shape the light",
            detail: "Curves, contrast and a live histogram.",
          },
          {
            Icon: Layers,
            title: "Make it material",
            detail: "Print and apparel outputs, at your chosen widths.",
          },
        ].map(({ Icon, title, detail }) => (
          <div key={title}>
            <Icon size={19} aria-hidden />
            <div>
              <h3>{title}</h3>
              <p>{detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
