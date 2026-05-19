"use client";

import { useState, useEffect, useCallback } from "react";
import { Sparkles, RefreshCw, ChevronUp, ChevronDown, AlertTriangle } from "lucide-react";

interface SmartInsightsProps {
  onNavigate?: (view: string) => void;
}

function renderInsights(text: string) {
  return text.split("\n").map((line, i) => {
    // Section headers with emojis
    if (line.match(/^[📊⚠️💡📈]/)) {
      return (
        <h4
          key={i}
          className="text-sm font-semibold text-text-main mt-3 mb-1 first:mt-0"
        >
          {line}
        </h4>
      );
    }
    // Bold text
    if (line.includes("**")) {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={i} className="text-xs text-text-muted leading-relaxed">
          {parts.map((part, j) =>
            j % 2 === 1 ? (
              <strong key={j} className="text-text-main font-medium">
                {part}
              </strong>
            ) : (
              part
            )
          )}
        </p>
      );
    }
    // Bullet points
    if (line.match(/^[-•]\s/)) {
      return (
        <p key={i} className="text-xs text-text-muted leading-relaxed pl-3">
          {line}
        </p>
      );
    }
    // Empty lines
    if (!line.trim()) return <div key={i} className="h-1" />;
    // Regular text
    return (
      <p key={i} className="text-xs text-text-muted leading-relaxed">
        {line}
      </p>
    );
  });
}

export function SmartInsights({ onNavigate: _onNavigate }: SmartInsightsProps) {
  const [insights, setInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        throw new Error("Failed to fetch insights");
      }
      const data = await res.json();
      setInsights(data.insights);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const refresh = () => {
    fetchInsights();
  };

  const toggleExpand = () => {
    setExpanded((prev) => !prev);
  };

  return (
    <div className="bg-base-card border border-base-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-base-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-primary" />
          <h3 className="text-sm font-medium text-text-main">AI Insights</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={refresh}
            className="p-1.5 hover:bg-base-hover rounded-md transition-colors"
            title="Refresh"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-text-muted ${loading ? "animate-spin" : ""}`}
            />
          </button>
          <button
            onClick={toggleExpand}
            className="p-1.5 hover:bg-base-hover rounded-md transition-colors"
            title={expanded ? "Minimize" : "Expand"}
          >
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-text-muted" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="p-4 max-h-96 overflow-y-auto">
          {loading && !insights && (
            <div className="space-y-3">
              <div className="h-3 bg-base-hover rounded w-1/3 animate-pulse" />
              <div className="h-2 bg-base-hover rounded w-full animate-pulse" />
              <div className="h-2 bg-base-hover rounded w-4/5 animate-pulse" />
              <div className="h-3 bg-base-hover rounded w-1/4 animate-pulse mt-4" />
              <div className="h-2 bg-base-hover rounded w-full animate-pulse" />
              <div className="h-2 bg-base-hover rounded w-3/4 animate-pulse" />
            </div>
          )}

          {error && (
            <div className="text-center py-6">
              <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <p className="text-xs text-text-muted">Gagal memuat insights</p>
              <button
                onClick={refresh}
                className="text-xs text-brand-primary hover:underline mt-1"
              >
                Coba lagi
              </button>
            </div>
          )}

          {!loading && !error && insights && renderInsights(insights)}
        </div>
      )}
    </div>
  );
}
