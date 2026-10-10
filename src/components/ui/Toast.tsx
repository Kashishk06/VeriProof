import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toast: (options: Omit<Toast, 'id'>) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

const TOAST_ICONS = {
  success: <CheckCircle size={18} className="text-green-400 flex-shrink-0" />,
  error: <XCircle size={18} className="text-red-400 flex-shrink-0" />,
  warning: <AlertTriangle size={18} className="text-amber-400 flex-shrink-0" />,
  info: <Info size={18} className="text-purple-400 flex-shrink-0" />,
};

const TOAST_COLORS = {
  success: 'border-green-500/30',
  error: 'border-red-500/30',
  warning: 'border-amber-500/30',
  info: 'border-purple-500/30',
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((options: Omit<Toast, 'id'>) => {
    const id = `toast_${Date.now()}`;
    const newToast: Toast = { ...options, id };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => removeToast(id), options.duration || 4000);
  }, [removeToast]);

  const success = useCallback((title: string, message?: string) =>
    toast({ type: 'success', title, message }), [toast]);

  const error = useCallback((title: string, message?: string) =>
    toast({ type: 'error', title, message, duration: 6000 }), [toast]);

  const warning = useCallback((title: string, message?: string) =>
    toast({ type: 'warning', title, message }), [toast]);

  const info = useCallback((title: string, message?: string) =>
    toast({ type: 'info', title, message }), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className={`bg-[#0B1020]/95 backdrop-blur-md border ${TOAST_COLORS[t.type]} rounded-xl p-4 flex items-start gap-3 shadow-2xl`}
            >
              {TOAST_ICONS[t.type]}
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold leading-tight">{t.title}</p>
                {t.message && (
                  <p className="text-[#94A3B8] text-xs mt-1 leading-relaxed">{t.message}</p>
                )}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-[#64748B] hover:text-white transition-colors flex-shrink-0"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
