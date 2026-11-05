import React from 'react';
import { useData } from '../../context/DataContext';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  MessageSquareWarning,
  Route,
  Clock,
  BellRing,
} from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useData();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-3 sm:px-0"
      aria-live="polite"
    >
      {toasts.map(toast => {
        const isDisruption = toast.category === 'Disruption' || toast.title?.toLowerCase().includes('disruption');
        const isComplaint = toast.category === 'Complaint' || toast.title?.toLowerCase().includes('complaint');

        const icons = {
          success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
          error: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
          warning: isDisruption ? (
            <Route className="w-5 h-5 text-amber-600 shrink-0 animate-pulse" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          ),
          info: isComplaint ? (
            <MessageSquareWarning className="w-5 h-5 text-indigo-600 shrink-0" />
          ) : (
            <Info className="w-5 h-5 text-sky-600 shrink-0" />
          ),
        };

        const bgStyles = {
          success: 'bg-white border-emerald-300 text-slate-900 shadow-emerald-500/10',
          error: 'bg-white border-rose-300 text-slate-900 shadow-rose-500/10',
          warning: isDisruption
            ? 'bg-amber-50/95 border-amber-300 text-amber-950 shadow-amber-500/15 ring-1 ring-amber-400/40'
            : 'bg-white border-amber-300 text-slate-900 shadow-amber-500/10',
          info: isComplaint
            ? 'bg-indigo-50/95 border-indigo-300 text-indigo-950 shadow-indigo-500/15 ring-1 ring-indigo-400/40'
            : 'bg-white border-sky-300 text-slate-900 shadow-sky-500/10',
        };

        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-xs transition-all duration-300 animate-in fade-in slide-in-from-top-3 ${bgStyles[toast.type]}`}
          >
            <div className="mt-0.5">{icons[toast.type]}</div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {toast.category && (
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                        isDisruption
                          ? 'bg-amber-200/80 text-amber-900 border border-amber-300'
                          : isComplaint
                          ? 'bg-indigo-200/80 text-indigo-900 border border-indigo-300'
                          : 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      {toast.category}
                    </span>
                  )}
                  {toast.title && (
                    <span className="font-bold text-xs leading-tight text-slate-900">
                      {toast.title}
                    </span>
                  )}
                </div>

                {toast.timestamp && (
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-0.5 shrink-0">
                    <Clock className="w-2.5 h-2.5" />
                    {toast.timestamp}
                  </span>
                )}
              </div>

              <div className="text-xs leading-relaxed text-slate-700 font-medium">
                {toast.message}
              </div>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
