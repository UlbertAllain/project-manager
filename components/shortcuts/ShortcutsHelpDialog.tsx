"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ShortcutHint } from "./ShortcutHint";
import { Keyboard } from "lucide-react";

interface ShortcutsHelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NAVIGATION_SHORTCUTS = [
  { label: "Go to Dashboard", keys: ["G", "D"] },
  { label: "Go to Projects", keys: ["G", "P"] },
  { label: "Go to Board", keys: ["G", "B"] },
  { label: "Go to Finance", keys: ["G", "F"] },
  { label: "Go to Settings", keys: ["G", "S"] },
];

const ACTION_SHORTCUTS = [
  { label: "Open Search", keys: ["⌘", "K"] },
  { label: "New Project", keys: ["N"] },
  { label: "Close / Go Back", keys: ["Esc"] },
];

function ShortcutRow({ label, keys }: { label: string; keys: string[] }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-text-main">{label}</span>
      <ShortcutHint keys={keys} />
    </div>
  );
}

export function ShortcutsHelpDialog({
  open,
  onOpenChange,
}: ShortcutsHelpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-base-card border-base-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-text-main">
            <Keyboard className="w-4 h-4 text-brand-primary" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription className="text-text-subtle">
            Use these shortcuts to navigate and take actions quickly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Navigation section */}
          <div>
            <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              Navigation
            </h4>
            <div className="space-y-0.5">
              {NAVIGATION_SHORTCUTS.map((s) => (
                <ShortcutRow key={s.label} label={s.label} keys={s.keys} />
              ))}
            </div>
          </div>

          {/* Actions section */}
          <div>
            <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
              Actions
            </h4>
            <div className="space-y-0.5">
              {ACTION_SHORTCUTS.map((s) => (
                <ShortcutRow key={s.label} label={s.label} keys={s.keys} />
              ))}
            </div>
          </div>

          {/* Tip */}
          <div className="text-[11px] text-text-subtle border-t border-base-border pt-3">
            Sequence shortcuts (G then X) require pressing the keys in order
            within 500ms. Shortcuts are disabled when typing in input fields or
            when a dialog is open.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
