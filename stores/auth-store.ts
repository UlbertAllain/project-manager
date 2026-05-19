import { create } from "zustand";
import { AuthUser } from "@/lib/types";

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: (user) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("nexty_user", JSON.stringify(user));
    }
    set({ user, isAuthenticated: true });
  },
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("nexty_user");
    }
    set({ user: null, isAuthenticated: false });
  },
}));

// Initialize from localStorage on client side
if (typeof window !== "undefined") {
  const stored = localStorage.getItem("nexty_user");
  if (stored) {
    try {
      const user = JSON.parse(stored);
      useAuthStore.setState({ user, isAuthenticated: true });
    } catch {
      localStorage.removeItem("nexty_user");
    }
  }
}
