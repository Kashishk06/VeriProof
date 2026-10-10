import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Check, ShieldAlert } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  requireReason?: boolean;
  reasonPlaceholder?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  isDestructive = true,
  requireReason = false,
  reasonPlaceholder = 'Please provide an administrative reason / rationale...'
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (requireReason && !reason.trim()) {
      setError('An administrative reason is required for this action.');
      return;
    }
    setError('');
    onConfirm(reason.trim());
    setReason('');
  };

  const handleClose = () => {
    setReason('');
    setError('');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-lg bg-[#0B1020] border border-white/10 rounded-2xl p-6 shadow-2xl text-left"
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="flex items-start gap-3.5 mb-4">
            <div
              className={`p-3 rounded-xl border flex-shrink-0 ${
                isDestructive
                  ? 'bg-red-500/10 text-red-400 border-red-500/20'
                  : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
              }`}
            >
              {isDestructive ? <AlertTriangle size={22} /> : <ShieldAlert size={22} />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{message}</p>
            </div>
          </div>

          {/* Reason Input if Required */}
          {requireReason && (
            <div className="my-4 space-y-1.5">
              <label className="text-[11px] font-mono uppercase text-slate-400 font-semibold block">
                Administrative Justification <span className="text-red-400">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError('');
                }}
                rows={3}
                placeholder={reasonPlaceholder}
                className="w-full bg-[#050816] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 resize-none font-sans"
              />
              {error && <p className="text-[11px] text-red-400 font-medium">{error}</p>}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-white/5">
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              onClick={handleConfirm}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-1.5 ${
                isDestructive
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'
                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/20'
              }`}
            >
              <Check size={14} />
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
