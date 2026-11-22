"use client";

import { useEffect } from "react";
import { useEditorStore } from "@/lib/store/editor-store";

declare global {
  interface Window {
    __scapeShareReceived?: (base64Jpeg: string) => void;
  }
}

function base64ToBlob(base64: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: "image/jpeg" });
}

/**
 * Bridges the native iOS Share Extension into the editor. The extension
 * (ScapeShare/ShareViewController.swift) writes a shared photo to an
 * app-group container and opens this app; AppDelegate.swift reads it back
 * and calls window.__scapeShareReceived(base64) once this callback exists
 * on the page - it polls for a few seconds if the page hasn't finished
 * loading yet, so this must be defined as early in the component tree as
 * possible (mounted at the page root, not buried under a conditional).
 *
 * Always a no-op on web/desktop - window.__scapeShareReceived is simply
 * never called there since there's no native shell invoking it.
 */
export function useNativeShare() {
  const setSourceImage = useEditorStore((s) => s.setSourceImage);

  useEffect(() => {
    window.__scapeShareReceived = async (base64Jpeg: string) => {
      try {
        const blob = base64ToBlob(base64Jpeg);
        const bitmap = await createImageBitmap(blob);
        setSourceImage(bitmap, "shared-photo.jpg");
      } catch {
        // Best-effort - a malformed handoff just means the editor stays on
        // the normal upload screen, no different from any other failed load.
      }
    };

    return () => {
      delete window.__scapeShareReceived;
    };
  }, [setSourceImage]);
}
