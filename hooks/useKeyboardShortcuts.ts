"use client";

import { useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

interface ShortcutConfig {
  onNavigate: (view: string) => void;
  onOpenSearch: () => void;
  onNewProject?: () => void;
  onEscape?: () => void;
  /** Set to true to disable all shortcuts (e.g. on login view) */
  disabled?: boolean;
}

/** Check if the user is currently focused on an input-like element */
function isInputElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return false;
}

/** Check if a dialog or modal is currently open in the DOM */
function isDialogOpen(): boolean {
  return !!document.querySelector('[data-state="open"]');
}

/**
 * Global keyboard shortcuts hook.
 *
 * Shortcuts:
 *  - Cmd/Ctrl + K  → Open search (delegates to CommandPalette via onOpenSearch)
 *  - Escape         → Close dialog / go back (onEscape)
 *  - G then D       → Navigate to Dashboard
 *  - G then P       → Navigate to Projects
 *  - G then B       → Navigate to Board
 *  - G then F       → Navigate to Finance
 *  - N              → New project (when not in an input element)
 */
export function useKeyboardShortcuts(config: ShortcutConfig): void {
  const { onNavigate, onOpenSearch, onNewProject, onEscape, disabled } = config;

  // Use refs for stable callback references inside the effect
  const onNavigateRef = useRef(onNavigate);
  const onOpenSearchRef = useRef(onOpenSearch);
  const onNewProjectRef = useRef(onNewProject);
  const onEscapeRef = useRef(onEscape);

  useEffect(() => {
    onNavigateRef.current = onNavigate;
  }, [onNavigate]);
  useEffect(() => {
    onOpenSearchRef.current = onOpenSearch;
  }, [onOpenSearch]);
  useEffect(() => {
    onNewProjectRef.current = onNewProject;
  }, [onNewProject]);
  useEffect(() => {
    onEscapeRef.current = onEscape;
  }, [onEscape]);

  // Sequence shortcut state: tracking the first key of "G then X"
  const sequenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sequenceFirstKeyRef = useRef<string | null>(null);
  const toastIdRef = useRef<string | number | null>(null);

  const clearSequence = useCallback(() => {
    if (sequenceTimeoutRef.current) {
      clearTimeout(sequenceTimeoutRef.current);
      sequenceTimeoutRef.current = null;
    }
    sequenceFirstKeyRef.current = null;
    if (toastIdRef.current !== null) {
      toast.dismiss(toastIdRef.current);
      toastIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // --- Guard: input elements ---
      if (isInputElement(e.target)) return;

      // --- Cmd/Ctrl + K → Open search ---
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        // CommandPalette already has its own Cmd+K listener,
        // so we don't call onOpenSearch here — the palette handles it.
        // We just prevent any default browser behavior.
        e.preventDefault();
        return;
      }

      // --- Guard: don't trigger other shortcuts when modifier keys are held ---
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      // --- Guard: dialogs open ---
      // Allow Escape through even when dialog is open
      const dialogOpen = isDialogOpen();

      const key = e.key.toLowerCase();

      // --- Escape ---
      if (key === "escape") {
        clearSequence();
        if (onEscapeRef.current) {
          onEscapeRef.current();
        }
        return;
      }

      // If a dialog is open, don't process any other shortcuts
      if (dialogOpen) return;

      // --- Sequence shortcuts: G then X ---
      if (sequenceFirstKeyRef.current === "g") {
        // We're waiting for the second key
        const viewMap: Record<string, string> = {
          d: "dashboard",
          p: "projects",
          b: "board",
          f: "finance",
          s: "settings",
        };

        const view = viewMap[key];
        if (view) {
          e.preventDefault();
          clearSequence();
          onNavigateRef.current(view);
          return;
        }

        // If the second key doesn't match any sequence, reset
        clearSequence();
        return;
      }

      // First key of sequence: G
      if (key === "g") {
        e.preventDefault();
        sequenceFirstKeyRef.current = "g";
        toastIdRef.current = toast("G…", {
          duration: 800,
          className: "font-mono text-xs",
        });

        // Auto-clear sequence after 500ms if second key not pressed
        sequenceTimeoutRef.current = setTimeout(() => {
          clearSequence();
        }, 500);
        return;
      }

      // --- N → New project ---
      if (key === "n") {
        e.preventDefault();
        if (onNewProjectRef.current) {
          onNewProjectRef.current();
        }
        return;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      clearSequence();
    };
  }, [disabled, clearSequence]);
}
