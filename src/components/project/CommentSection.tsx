"use client";

import { Comment } from "@/lib/types";
import { formatDateTime } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CommentSectionProps {
  comments: Comment[];
  newComment: string;
  onNewCommentChange: (val: string) => void;
  onAddComment: () => void;
  commentSubmitting: boolean;
}

export function CommentSection({
  comments,
  newComment,
  onNewCommentChange,
  onAddComment,
  commentSubmitting,
}: CommentSectionProps) {
  return (
    <div className="bg-base-card border border-base-border rounded-lg">
      <div className="p-4 border-b border-base-border">
        <h3 className="text-sm font-medium text-text-main">
          Comments ({comments.length})
        </h3>
      </div>

      {/* Add comment */}
      <div className="p-3 border-b border-base-border flex items-start gap-2">
        <textarea
          value={newComment}
          onChange={(e) => onNewCommentChange(e.target.value)}
          placeholder="Tulis komentar..."
          rows={2}
          className="flex-1 text-sm bg-base-bg border border-base-border rounded-md text-text-main placeholder:text-text-subtle focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary resize-none p-2"
        />
        <Button
          size="sm"
          onClick={onAddComment}
          disabled={commentSubmitting || !newComment.trim()}
          className="h-8 text-xs gap-1 mt-auto"
        >
          {commentSubmitting ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Send className="w-3 h-3" />
          )}
        </Button>
      </div>

      {/* Comment list */}
      <div className="max-h-96 overflow-y-auto">
        <AnimatePresence initial={false}>
          {comments.length === 0 ? (
            <EmptyCommentState />
          ) : (
            comments.map((c) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="px-4 py-3 border-b border-base-border last:border-b-0"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-full bg-brand-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-[9px] font-bold text-brand-primary">
                      {c.userEmail.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-brand-primary">
                    {c.userEmail}
                  </span>
                  <span className="text-[10px] text-text-subtle">
                    {formatDateTime(c.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-text-muted pl-7">{c.message}</p>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function EmptyCommentState() {
  return (
    <div className="p-8 text-center">
      <div className="w-10 h-10 rounded-full bg-base-hover mx-auto mb-3 flex items-center justify-center">
        <MessageSquare className="w-5 h-5 text-text-subtle" />
      </div>
      <p className="text-sm text-text-subtle">Belum ada komentar</p>
      <p className="text-xs text-text-subtle mt-1">
        Mulai diskusi tentang project ini
      </p>
    </div>
  );
}
