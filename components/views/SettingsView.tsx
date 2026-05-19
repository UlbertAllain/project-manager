"use client";

import { useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { usePreferencesStore } from "@/stores/preferences-store";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  User,
  Palette,
  SlidersHorizontal,
  AlertTriangle,
  Save,
  LogOut,
  RefreshCcw,
  Sun,
  Moon,
  Monitor,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SettingsViewProps {
  onNavigate: (view: string) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export function SettingsView({ onNavigate }: SettingsViewProps) {
  const { user, login, logout } = useAuthStore();
  const { preferences, setDefaultView, setShowShortcutHints, setCompactMode } =
    usePreferencesStore();
  const { theme, setTheme, resolvedTheme } = useTheme();

  // Profile editing state
  const [editName, setEditName] = useState(user?.name || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [resettingData, setResettingData] = useState(false);

  // Save profile handler
  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      toast.error("Nama tidak boleh kosong");
      return;
    }
    if (!user?.id) return;

    setSavingProfile(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, name: editName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal update profil");
        return;
      }
      // Update auth store with new user data
      login({ ...user, name: data.data.name });
      toast.success("Profil berhasil diperbarui");
    } catch {
      toast.error("Gagal update profil");
    } finally {
      setSavingProfile(false);
    }
  };

  // Reset data handler
  const handleResetData = async () => {
    setResettingData(true);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal reset data");
        return;
      }
      toast.success("Data berhasil direset ke default");
      onNavigate("dashboard");
    } catch {
      toast.error("Gagal reset data");
    } finally {
      setResettingData(false);
    }
  };

  // Logout handler
  const handleLogout = () => {
    logout();
  };

  // Theme options
  const themeOptions = [
    {
      value: "light",
      label: "Light",
      icon: Sun,
      description: "Tampilan terang",
      previewColor: "bg-white border-zinc-200",
    },
    {
      value: "dark",
      label: "Dark",
      icon: Moon,
      description: "Tampilan gelap",
      previewColor: "bg-zinc-900 border-zinc-700",
    },
    {
      value: "system",
      label: "System",
      icon: Monitor,
      description: "Ikuti preferensi OS",
      previewColor:
        "bg-gradient-to-br from-white to-zinc-900 border-zinc-400",
    },
  ];

  // Default view options
  const defaultViewOptions = [
    { value: "dashboard", label: "Dashboard" },
    { value: "projects", label: "Projects" },
    { value: "board", label: "Board" },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Page title */}
      <motion.div variants={itemVariants}>
        <h1 className="text-xl font-semibold text-text-main">Settings</h1>
        <p className="text-sm text-text-muted mt-0.5">
          Kelola profil, tampilan, dan preferensi aplikasi
        </p>
      </motion.div>

      {/* A. Profile Section */}
      <motion.div variants={itemVariants}>
        <div className="bg-base-card border border-base-border rounded-lg">
          <div className="p-4 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <User className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-text-main">
                  Profil
                </h2>
                <p className="text-xs text-text-subtle">
                  Informasi akun dan data diri
                </p>
              </div>
            </div>

            {user && (
              <div className="space-y-4">
                {/* Current user info (read-only) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-text-muted">Email</Label>
                    <p className="text-sm text-text-main">{user.email}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-text-muted">Role</Label>
                    <p className="text-sm text-text-main">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                        {user.role}
                      </span>
                    </p>
                  </div>
                </div>

                <Separator className="bg-base-border" />

                {/* Edit name */}
                <div className="space-y-2">
                  <Label
                    htmlFor="edit-name"
                    className="text-xs text-text-muted"
                  >
                    Nama
                  </Label>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Input
                      id="edit-name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Masukkan nama"
                      className="bg-base-bg border-base-border text-text-main placeholder:text-text-subtle text-sm h-9 w-full sm:w-auto sm:max-w-xs"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveProfile();
                      }}
                    />
                    <Button
                      onClick={handleSaveProfile}
                      disabled={
                        savingProfile || editName === user.name || !editName.trim()
                      }
                      size="sm"
                      className="h-9 px-3 gap-1.5"
                    >
                      {savingProfile ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      Simpan
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* B. Appearance Section */}
      <motion.div variants={itemVariants}>
        <div className="bg-base-card border border-base-border rounded-lg">
          <div className="p-4 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <Palette className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-text-main">
                  Tampilan
                </h2>
                <p className="text-xs text-text-subtle">
                  Sesuaikan tema dan tampilan aplikasi
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Theme selector */}
              <div className="space-y-3">
                <Label className="text-xs text-text-muted">Tema</Label>
                <RadioGroup
                  value={theme}
                  onValueChange={setTheme}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                >
                  {themeOptions.map((opt) => {
                    const Icon = opt.icon;
                    const isActive = theme === opt.value;
                    return (
                      <Label
                        key={opt.value}
                        htmlFor={`theme-${opt.value}`}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          isActive
                            ? "border-brand-primary/50 bg-brand-primary/5"
                            : "border-base-border hover:border-base-border/80 hover:bg-base-hover/50"
                        }`}
                      >
                        <RadioGroupItem
                          value={opt.value}
                          id={`theme-${opt.value}`}
                          className="sr-only"
                        />
                        <div
                          className={`w-8 h-8 rounded-md border-2 ${opt.previewColor} flex items-center justify-center shrink-0`}
                        >
                          <Icon
                            className={`w-4 h-4 ${
                              opt.value === "light"
                                ? "text-zinc-700"
                                : opt.value === "dark"
                                  ? "text-zinc-300"
                                  : "text-zinc-500"
                            }`}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text-main">
                            {opt.label}
                          </p>
                          <p className="text-[11px] text-text-subtle">
                            {opt.description}
                          </p>
                        </div>
                        {isActive && (
                          <div className="ml-auto w-2 h-2 rounded-full bg-brand-primary shrink-0" />
                        )}
                      </Label>
                    );
                  })}
                </RadioGroup>
              </div>

              {/* Current theme indicator */}
              <div className="flex items-center gap-2 text-xs text-text-subtle">
                <span>Tema aktif:</span>
                <span className="font-medium text-text-muted">
                  {resolvedTheme === "dark" ? "Dark" : "Light"}
                  {theme === "system" && " (System)"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* C. Preferences Section */}
      <motion.div variants={itemVariants}>
        <div className="bg-base-card border border-base-border rounded-lg">
          <div className="p-4 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <SlidersHorizontal className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-text-main">
                  Preferensi
                </h2>
                <p className="text-xs text-text-subtle">
                  Atur default dan perilaku aplikasi
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Default view on login */}
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label className="text-sm text-text-main">
                    Default View
                  </Label>
                  <p className="text-xs text-text-subtle">
                    Halaman yang ditampilkan saat login
                  </p>
                </div>
                <Select
                  value={preferences.defaultView}
                  onValueChange={setDefaultView}
                >
                  <SelectTrigger className="w-36 bg-base-bg border-base-border text-text-main text-sm h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-base-card border-base-border">
                    {defaultViewOptions.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        className="text-text-main focus:bg-base-hover focus:text-text-main"
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator className="bg-base-border" />

              {/* Show keyboard shortcut hints */}
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label className="text-sm text-text-main">
                    Shortcut Hints
                  </Label>
                  <p className="text-xs text-text-subtle">
                    Tampilkan petunjuk keyboard shortcut di sidebar
                  </p>
                </div>
                <Switch
                  checked={preferences.showShortcutHints}
                  onCheckedChange={setShowShortcutHints}
                />
              </div>

              <Separator className="bg-base-border" />

              {/* Compact mode */}
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label className="text-sm text-text-main">
                    Compact Mode
                  </Label>
                  <p className="text-xs text-text-subtle">
                    Tampilan lebih padat dengan padding dan spacing yang lebih
                    kecil
                  </p>
                </div>
                <Switch
                  checked={preferences.compactMode}
                  onCheckedChange={setCompactMode}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* D. Danger Zone Section */}
      <motion.div variants={itemVariants}>
        <div className="bg-base-card border border-red-500/20 rounded-lg">
          <div className="p-4 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-red-400">
                  Danger Zone
                </h2>
                <p className="text-xs text-text-subtle">
                  Aksi yang tidak dapat diurungkan
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Reset data */}
              <div className="flex items-center justify-between gap-4 p-3 rounded-lg border border-red-500/10 bg-red-500/5">
                <div className="space-y-0.5">
                  <Label className="text-sm text-text-main">
                    Reset Semua Data
                  </Label>
                  <p className="text-xs text-text-subtle">
                    Hapus semua data dan kembalikan ke demo seed data
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 gap-1.5 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 shrink-0"
                      disabled={resettingData}
                    >
                      {resettingData ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCcw className="w-3.5 h-3.5" />
                      )}
                      Reset
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-base-card border-base-border">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-text-main">
                        Reset Semua Data?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-text-muted">
                        Semua data project, task, transaksi, dan komentar akan
                        dihapus dan diganti dengan data demo. Aksi ini tidak
                        dapat diurungkan.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-base-bg border-base-border text-text-muted hover:bg-base-hover">
                        Batal
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleResetData}
                        className="bg-red-500 text-white hover:bg-red-600"
                      >
                        Ya, Reset Data
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              {/* Logout */}
              <div className="flex items-center justify-between gap-4 p-3 rounded-lg border border-base-border">
                <div className="space-y-0.5">
                  <Label className="text-sm text-text-main">Logout</Label>
                  <p className="text-xs text-text-subtle">
                    Keluar dari akun saat ini
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 gap-1.5 border-base-border text-text-muted hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 shrink-0"
                  onClick={handleLogout}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
