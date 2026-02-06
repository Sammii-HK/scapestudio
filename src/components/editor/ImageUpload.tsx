"use client";

import { useCallback, useState } from "react";
import { Upload, ImageIcon } from "lucide-react";
import { useEditorStore } from "@/lib/store/editor-store";

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

export function ImageUpload() {
  const setSourceImage = useEditorStore((s) => s.setSourceImage);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      if (!ACCEPTED_TYPES.includes(file.type) && !file.name.match(/\.heic$/i)) {
        setError("Unsupported file type. Use JPG, PNG, WebP, or HEIC.");
        return;
      }

      try {
        const bitmap = await createImageBitmap(file);
        setSourceImage(bitmap, file.name);
      } catch {
        setError("Failed to load image. Try exporting as JPEG from Photos.");
      }
    },
    [setSourceImage]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
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
    input.accept = ACCEPTED_TYPES.join(",");
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
          {isDragging ? (
            <ImageIcon className="h-6 w-6 text-primary" />
          ) : (
            <Upload className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            {isDragging ? "Drop image here" : "Drop an image or click to browse"}
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
