"use client";

import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

function getInitialOfflineState() {
  if (typeof window !== "undefined") {
    return !navigator.onLine;
  }
  return false;
}

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(getInitialOfflineState);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 flex items-center justify-center gap-2">
            <WifiOff className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs text-amber-400 font-medium">
              Kamu sedang offline. Perubahan akan disinkronkan saat kembali
              online.
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
