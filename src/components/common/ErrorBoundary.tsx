import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearCache = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400 mb-4 pb-3 border-b border-slate-700">
              <AlertTriangle className="w-8 h-8 shrink-0" />
              <div>
                <h1 className="text-lg font-bold text-white">
                  {this.props.fallbackTitle || 'Terjadi Kendala Memuat Aplikasi (ISMS)'}
                </h1>
                <p className="text-xs text-slate-400">
                  Komponen mendeteksi kesalahan runtime. Informasi diagnostik tertera di bawah.
                </p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs text-rose-300 overflow-auto max-h-60 border border-slate-800 mb-4 whitespace-pre-wrap">
              <strong>{this.state.error?.name}:</strong> {this.state.error?.message}
              {this.state.error?.stack && (
                <div className="mt-2 text-slate-500 text-[11px]">
                  {this.state.error.stack}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs flex items-center gap-2 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Muat Ulang Halaman
              </button>

              <button
                onClick={this.handleClearCache}
                className="px-4 py-2 bg-rose-600/80 hover:bg-rose-700 text-white font-medium rounded-lg text-xs flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Bersihkan Cache & Reset Data
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
