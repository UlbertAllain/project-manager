"use client";

import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <h3 className="text-sm font-medium text-text-main mb-1">
            Terjadi Kesalahan
          </h3>
          <p className="text-xs text-text-muted mb-4 max-w-xs">
            {this.state.error?.message || "Sesuatu yang tidak terduga terjadi"}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="gap-1.5"
          >
            Muat Ulang
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
