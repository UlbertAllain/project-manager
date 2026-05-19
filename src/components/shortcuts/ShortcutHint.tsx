"use client";

interface ShortcutHintProps {
  keys: string[];
}

/**
 * Displays a keyboard shortcut hint as a series of kbd badges.
 * Useful for showing shortcuts in sidebar items, command palette, or help dialogs.
 */
export function ShortcutHint({ keys }: ShortcutHintProps) {
  return (
    <div className="flex items-center gap-0.5">
      {keys.map((key, i) => (
        <kbd
          key={i}
          className="px-1 py-0.5 text-[10px] rounded bg-base-hover border border-base-border text-text-subtle font-mono leading-none"
        >
          {key}
        </kbd>
      ))}
    </div>
  );
}
