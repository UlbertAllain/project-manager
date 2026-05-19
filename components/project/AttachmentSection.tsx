"use client";

import { LinkAttachment } from "@/lib/types";
import { LINK_PLATFORMS } from "@/lib/constants";
import { getPlatformIcon } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, ExternalLink, Paperclip } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AttachmentSectionProps {
  attachments: LinkAttachment[];
  attForm: {
    title: string;
    url: string;
    platform: string;
  };
  onAttFormChange: (form: { title: string; url: string; platform: string }) => void;
  onAddAttachment: () => void;
  attSubmitting: boolean;
}

export function AttachmentSection({
  attachments,
  attForm,
  onAttFormChange,
  onAddAttachment,
  attSubmitting,
}: AttachmentSectionProps) {
  return (
    <div className="bg-base-card border border-base-border rounded-lg">
      <div className="p-4 border-b border-base-border">
        <h3 className="text-sm font-medium text-text-main">Link Attachments</h3>
      </div>

      {/* Add attachment */}
      <div className="p-3 border-b border-base-border">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <input
            type="text"
            placeholder="Judul link"
            value={attForm.title}
            onChange={(e) => onAttFormChange({ ...attForm, title: e.target.value })}
            className="h-8 px-3 text-sm bg-base-bg border border-base-border rounded-md text-text-main placeholder:text-text-subtle focus:outline-none focus:border-brand-primary"
          />
          <input
            type="url"
            placeholder="https://..."
            value={attForm.url}
            onChange={(e) => onAttFormChange({ ...attForm, url: e.target.value })}
            className="h-8 px-3 text-sm bg-base-bg border border-base-border rounded-md text-text-main placeholder:text-text-subtle focus:outline-none focus:border-brand-primary"
          />
          <Select
            value={attForm.platform}
            onValueChange={(v) => onAttFormChange({ ...attForm, platform: v })}
          >
            <SelectTrigger className="h-8 text-xs bg-base-bg border-base-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LINK_PLATFORMS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={onAddAttachment}
            disabled={attSubmitting}
            className="h-8 text-xs gap-1"
          >
            {attSubmitting ? (
              <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Plus className="w-3 h-3" />
            )}
            Add
          </Button>
        </div>
      </div>

      {/* Attachment list */}
      <div className="divide-y divide-base-border">
        <AnimatePresence initial={false}>
          {attachments.length === 0 ? (
            <EmptyAttachmentState />
          ) : (
            attachments.map((att) => (
              <motion.div
                key={att.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-base-hover/30"
              >
                <span className="text-sm">{getPlatformIcon(att.platform)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-main truncate">{att.title}</p>
                  <p className="text-[11px] text-text-subtle truncate">{att.url}</p>
                </div>
                <a
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded hover:bg-base-hover text-text-subtle hover:text-brand-primary transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function EmptyAttachmentState() {
  return (
    <div className="p-8 text-center">
      <div className="w-10 h-10 rounded-full bg-base-hover mx-auto mb-3 flex items-center justify-center">
        <Paperclip className="w-5 h-5 text-text-subtle" />
      </div>
      <p className="text-sm text-text-subtle">Belum ada attachment</p>
      <p className="text-xs text-text-subtle mt-1">
        Tambahkan link Figma, GitHub, dll
      </p>
    </div>
  );
}
