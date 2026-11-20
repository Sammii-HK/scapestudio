"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useEditorStore } from "@/lib/store/editor-store";
import {
  getAllPresets,
  savePreset,
  updatePreset,
  deletePreset,
  isBuiltInPreset,
} from "@/lib/presets/storage";
import type { Preset } from "@/types/editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ChevronDown, Save, Trash2, Check } from "lucide-react";

export function PresetManager() {
  const curves = useEditorStore((s) => s.curves);
  const threshold = useEditorStore((s) => s.threshold);
  const setCurves = useEditorStore((s) => s.setCurves);
  const setThreshold = useEditorStore((s) => s.setThreshold);

  const [presets, setPresets] = useState<Preset[]>([]);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [presetToDelete, setPresetToDelete] = useState<Preset | null>(null);
  const [newPresetName, setNewPresetName] = useState("");
  const [presetError, setPresetError] = useState("");
  useEffect(() => {
    let active = true;
    getAllPresets()
      .then((items) => {
        if (active) setPresets(items);
      })
      .catch(() => {
        if (active)
          setPresetError(
            "Saved presets are unavailable. You can still edit and export.",
          );
      });
    return () => {
      active = false;
    };
  }, []);

  // Derive isModified from current state (no effect needed)
  const isModified = useMemo(() => {
    if (!activePresetId) return false;
    const preset = presets.find((p) => p.id === activePresetId);
    if (!preset) return false;
    const curvesMatch =
      JSON.stringify(preset.curves) === JSON.stringify(curves);
    const thresholdMatch = preset.threshold === threshold;
    return !curvesMatch || !thresholdMatch;
  }, [activePresetId, presets, curves, threshold]);

  // Reload presets from DB
  const loadPresets = useCallback(async () => {
    const all = await getAllPresets();
    setPresets(all);
  }, []);

  // Apply a preset
  const applyPreset = useCallback(
    (preset: Preset) => {
      setCurves(preset.curves);
      setThreshold(preset.threshold);
      setActivePresetId(preset.id);
    },
    [setCurves, setThreshold],
  );

  // Save current settings as new preset
  const handleSaveNew = useCallback(async () => {
    if (!newPresetName.trim()) return;

    const preset = await savePreset({
      name: newPresetName.trim(),
      curves,
      threshold,
    });

    setActivePresetId(preset.id);
    setNewPresetName("");
    setSaveDialogOpen(false);
    await loadPresets();
  }, [newPresetName, curves, threshold, loadPresets]);

  // Update the active preset with current settings
  const handleUpdate = useCallback(async () => {
    if (!activePresetId) return;

    await updatePreset(activePresetId, { curves, threshold });
    await loadPresets();
  }, [activePresetId, curves, threshold, loadPresets]);

  // Delete a preset
  const handleDelete = useCallback(async () => {
    if (!presetToDelete) return;

    await deletePreset(presetToDelete.id);
    if (activePresetId === presetToDelete.id) {
      setActivePresetId(null);
    }
    setPresetToDelete(null);
    setDeleteDialogOpen(false);
    await loadPresets();
  }, [presetToDelete, activePresetId, loadPresets]);

  const activePreset = presets.find((p) => p.id === activePresetId);
  const displayName = activePreset
    ? isModified
      ? `${activePreset.name} (modified)`
      : activePreset.name
    : "Custom";

  return (
    <div className="space-y-2">
      {presetError && (
        <p role="alert" className="text-xs text-destructive">
          {presetError}
        </p>
      )}
      {/* Preset selector */}
      <div className="flex items-center gap-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              aria-label="Choose a tone preset"
              className="h-11 flex-1 justify-between gap-1 px-2 text-xs"
            >
              <span className="truncate">{displayName}</span>
              <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {presets.map((preset) => (
              <DropdownMenuItem
                key={preset.id}
                className="flex min-h-11 items-center justify-between text-xs"
                onClick={() => applyPreset(preset)}
              >
                <span>{preset.name}</span>
                {preset.id === activePresetId && !isModified && (
                  <Check className="h-3 w-3 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
            {presets.length > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem
              className="min-h-11 text-xs"
              onClick={() => {
                setNewPresetName("");
                setSaveDialogOpen(true);
              }}
            >
              <Save className="mr-2 h-3 w-3" />
              Save as new preset...
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Quick actions */}
        {activePresetId && isModified && (
          <Button
            variant="secondary"
            size="sm"
            className="h-11 min-w-11 px-2 text-xs"
            onClick={() => {
              void handleUpdate().catch(() =>
                setPresetError(
                  "Your preset could not be updated. Your edits are still available.",
                ),
              );
            }}
            title="Update preset with current settings"
            aria-label="Update preset with current settings"
          >
            <Save className="h-3 w-3" />
          </Button>
        )}

        {activePresetId && !isBuiltInPreset(activePresetId) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-11 min-w-11 px-2 text-xs text-muted-foreground hover:text-destructive"
            onClick={() => {
              setPresetToDelete(activePreset ?? null);
              setDeleteDialogOpen(true);
            }}
            title="Delete preset"
            aria-label="Delete preset"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Save dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Save Preset</DialogTitle>
          </DialogHeader>
          <Input
            aria-label="Preset name"
            placeholder="Preset name"
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                void handleSaveNew().catch(() =>
                  setPresetError(
                    "Your preset could not be saved. Your edits are still available.",
                  ),
                );
              }
            }}
            autoFocus
          />
          <DialogFooter>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSaveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                void handleSaveNew().catch(() =>
                  setPresetError(
                    "Your preset could not be saved. Your edits are still available.",
                  ),
                );
              }}
              disabled={!newPresetName.trim()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Preset</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete &ldquo;{presetToDelete?.name}&rdquo;? This can&apos;t be
            undone.
          </p>
          <DialogFooter>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                void handleDelete().catch(() =>
                  setPresetError("Your preset could not be deleted."),
                );
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
