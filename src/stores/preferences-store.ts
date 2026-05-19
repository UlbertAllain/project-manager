import { create } from "zustand";

const STORAGE_KEY = "nexty_prefs";

interface Preferences {
  defaultView: string;
  showShortcutHints: boolean;
  compactMode: boolean;
}

const defaultPreferences: Preferences = {
  defaultView: "dashboard",
  showShortcutHints: true,
  compactMode: false,
};

function loadPreferences(): Preferences {
  if (typeof window === "undefined") return defaultPreferences;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored
      ? { ...defaultPreferences, ...JSON.parse(stored) }
      : defaultPreferences;
  } catch {
    return defaultPreferences;
  }
}

function savePreferences(prefs: Preferences) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }
}

interface PreferencesState {
  preferences: Preferences;
  setDefaultView: (view: string) => void;
  setShowShortcutHints: (show: boolean) => void;
  setCompactMode: (compact: boolean) => void;
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  preferences: defaultPreferences,
  setDefaultView: (defaultView) => {
    const prefs = { ...get().preferences, defaultView };
    savePreferences(prefs);
    set({ preferences: prefs });
  },
  setShowShortcutHints: (showShortcutHints) => {
    const prefs = { ...get().preferences, showShortcutHints };
    savePreferences(prefs);
    set({ preferences: prefs });
  },
  setCompactMode: (compactMode) => {
    const prefs = { ...get().preferences, compactMode };
    savePreferences(prefs);
    set({ preferences: prefs });
  },
}));

// Initialize from localStorage on client side
if (typeof window !== "undefined") {
  usePreferencesStore.setState({ preferences: loadPreferences() });
}
