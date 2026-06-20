"use client";

import React from "react";

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="p-6 font-mono text-sm text-[#f85149] whitespace-pre-wrap break-all">
          <div className="text-[#e6edf3] font-semibold mb-2">Runtime error (captured):</div>
          <div>{this.state.error.message}</div>
          <div className="mt-2 text-[#9ba4b0] text-xs">{this.state.error.stack?.slice(0, 800)}</div>
          <button
            onClick={() => this.setState({ error: null })}
            className="mt-3 px-3 py-1 rounded bg-[#3b82f6] text-white text-xs"
          >
            Réessayer
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
