"use client";

import { useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { AuthUser } from "@/lib/types";
import { Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface LoginViewProps {
  onLogin: () => void;
}

export function LoginView({ onLogin }: LoginViewProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Email dan password wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Login gagal");
        return;
      }

      login(data.data as AuthUser);
      toast.success(`Selamat datang, ${data.data.name}!`);
      onLogin();
    } catch {
      toast.error("Terjadi kesalahan server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-brand-primary flex items-center justify-center mb-4">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-text-main">
            Nexty Labs
          </h1>
          <p className="text-sm text-text-muted mt-1">Project Tracker</p>
        </div>

        {/* Login Form */}
        <div className="bg-base-card border border-base-border rounded-lg p-6">
          <h2 className="text-sm font-medium text-text-main mb-4">
            Masuk ke akun Anda
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-text-muted mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@nextylab.com"
                className="w-full h-9 px-3 text-sm bg-base-bg border border-base-border rounded-md text-text-main placeholder:text-text-subtle focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
              />
            </div>

            <div>
              <label className="block text-xs text-text-muted mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="admin123"
                className="w-full h-9 px-3 text-sm bg-base-bg border border-base-border rounded-md text-text-main placeholder:text-text-subtle focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-9 bg-brand-primary hover:bg-brand-primary/90 text-white text-sm font-medium rounded-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-base-border">
            <p className="text-[11px] text-text-subtle text-center">
              Demo: admin@nextylab.com / admin123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
