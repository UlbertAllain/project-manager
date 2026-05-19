"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useProjects } from "@/hooks/useProjects";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles,
  Send,
  Bot,
  User,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTION_CHIPS = [
  "Analisis project",
  "Tips deadline",
  "Saran budget",
];

export function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);

  const { data: projects } = useProjects();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  // Focus input when sheet opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const sendMessage = useCallback(
    async (messageText: string) => {
      const trimmed = messageText.trim();
      if (!trimmed || loading) return;

      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content: trimmed,
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);

      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            projectId: selectedProjectId || undefined,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Gagal mendapatkan respons");
        }

        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.response,
        };

        setMessages((prev) => [...prev, aiMsg]);
      } catch (error) {
        const errorMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            error instanceof Error
              ? `Error: ${error.message}`
              : "Maaf, terjadi kesalahan. Silakan coba lagi.",
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    },
    [loading, selectedProjectId]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      sendMessage(input);
    },
    [input, sendMessage]
  );

  const selectedProject = projects?.find((p) => p.id === selectedProjectId);

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-brand-primary text-white shadow-lg shadow-brand-primary/25 hover:shadow-brand-primary/40 transition-shadow flex items-center justify-center"
        aria-label="Open AI Assistant"
      >
        <Sparkles className="w-5 h-5" />
      </button>

      {/* Chat Sheet Panel */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="bg-base-bg border-l border-base-border sm:max-w-md w-full p-0 flex flex-col"
        >
          {/* Header */}
          <SheetHeader className="p-4 border-b border-base-border flex flex-row items-center gap-3 space-y-0">
            <div className="flex items-center gap-2 flex-1">
              <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-brand-primary" />
              </div>
              <div>
                <SheetTitle className="text-text-main text-sm font-semibold">
                  AI Assistant
                </SheetTitle>
                <SheetDescription className="text-text-muted text-xs">
                  Tanya tentang project kamu
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {/* Project Context Selector */}
          <div className="px-4 py-2 border-b border-base-border">
            <div className="relative">
              <button
                onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                className="w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-base-card border border-base-border text-xs text-text-muted hover:text-text-main transition-colors"
              >
                <span className="truncate">
                  {selectedProject
                    ? `${selectedProject.projectName} — ${selectedProject.clientName}`
                    : "Pilih project (opsional)"}
                </span>
                <ChevronDown className="w-3 h-3 shrink-0" />
              </button>
              {showProjectDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-base-card border border-base-border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                  <button
                    onClick={() => {
                      setSelectedProjectId("");
                      setShowProjectDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-text-muted hover:bg-base-hover transition-colors"
                  >
                    Tanpa konteks project
                  </button>
                  {projects?.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedProjectId(p.id);
                        setShowProjectDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-text-main hover:bg-base-hover transition-colors truncate"
                    >
                      {p.projectName} — {p.clientName}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 px-4">
            <div className="py-4 space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center mb-3">
                    <Bot className="w-6 h-6 text-brand-primary" />
                  </div>
                  <p className="text-text-main text-sm font-medium">
                    Halo! 👋
                  </p>
                  <p className="text-text-muted text-xs mt-1 max-w-[240px]">
                    Tanyakan apa saja tentang project kamu. Saya siap membantu
                    menganalisis dan memberikan saran.
                  </p>
                </div>
              )}

              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-6 h-6 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0 mt-1">
                        <Bot className="w-3.5 h-3.5 text-brand-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] px-3 py-2 text-sm ${
                        msg.role === "user"
                          ? "bg-brand-primary/10 text-text-main border border-brand-primary/20 rounded-xl rounded-tr-sm"
                          : "bg-base-card text-text-main border border-base-border rounded-xl rounded-tl-sm"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words leading-relaxed">
                        {msg.content}
                      </p>
                    </div>
                    {msg.role === "user" && (
                      <div className="w-6 h-6 rounded-full bg-brand-primary/20 flex items-center justify-center shrink-0 mt-1">
                        <User className="w-3.5 h-3.5 text-brand-primary" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Loading indicator */}
              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2 justify-start"
                >
                  <div className="w-6 h-6 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5 text-brand-primary" />
                  </div>
                  <div className="bg-base-card text-text-main border border-base-border rounded-xl rounded-tl-sm px-3 py-2">
                    <div className="flex items-center gap-1">
                      <span className="animate-bounce text-text-muted text-xs [animation-delay:0ms]">
                        .
                      </span>
                      <span className="animate-bounce text-text-muted text-xs [animation-delay:150ms]">
                        .
                      </span>
                      <span className="animate-bounce text-text-muted text-xs [animation-delay:300ms]">
                        .
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Suggestion Chips + Input */}
          <div className="border-t border-base-border p-4 space-y-3">
            {/* Suggestion Chips */}
            {messages.length === 0 && !loading && (
              <div className="flex gap-2 flex-wrap">
                {SUGGESTION_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => sendMessage(chip)}
                    className="bg-base-hover text-text-muted hover:text-text-main border border-base-border rounded-full px-3 py-1 text-xs cursor-pointer transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ketik pertanyaan..."
                disabled={loading}
                className="bg-base-card border-base-border text-text-main placeholder:text-text-subtle text-sm flex-1 h-9"
              />
              <Button
                type="submit"
                size="sm"
                disabled={loading || !input.trim()}
                className="bg-brand-primary hover:bg-brand-primary/90 text-white h-9 px-3"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
