import React, { useState } from 'react';
import {
  Cpu, AlertTriangle, CheckCircle, ShieldAlert, Sliders,
  RefreshCw, ArrowRight, Layers, Lock, Eye, Download, Sparkles
} from 'lucide-react';
import { useToast } from '../../components/ui/Toast';

export const ForgeryLabPage: React.FC = () => {
  const { warning, error, success } = useToast();

  const [recipientName, setRecipientName] = useState('Alexandra Chen');
  const [alteredName, setAlteredName] = useState('Viktor Kaelen');
  const [degreeField, setDegreeField] = useState('Master of Science in Computer Science');
  const [alteredField, setAlteredField] = useState('Master of Science in Quantum AI [ALTERED]');
  const [gpaVal, setGpaVal] = useState('3.94 / 4.00');
  const [alteredGpa, setAlteredGpa] = useState('4.00 Perfect Honors');
  const [tamperApplied, setTamperApplied] = useState(true);

  const originalHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  const computedForgedHash = tamperApplied
    ? 'ff89102b4890c491829038cb472901a8947291038471902847a09182390147cb'
    : originalHash;

  const handleApplyTamper = () => {
    setTamperApplied(true);
    error('Tamper Simulation Triggered', 'Cryptographic signature invalidated & visual kerning anomaly injected.');
  };

  const handleResetToGenuine = () => {
    setTamperApplied(false);
    success('Reset to Canonical', 'Restored verified issuer state.');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-pink-500/10 text-pink-400 border border-pink-500/20">
              FORENSIC SIMULATION LAB
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            Forgery Testing & Tamper Lab
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Simulate credential alterations, font kerning divergence, and real-time cryptographic signature breakdown.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {tamperApplied ? (
            <button
              onClick={handleResetToGenuine}
              className="px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all"
            >
              Restore Canonical Document
            </button>
          ) : (
            <button
              onClick={handleApplyTamper}
              className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold transition-all"
            >
              Simulate Active Forgery
            </button>
          )}
        </div>
      </div>

      {/* Interactive Controls Bar */}
      <div className="bg-[#0B1020]/90 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
          <Sliders size={14} />
          <span>INJECT REAL-TIME ARTIFACT ALTERATIONS</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Recipient Name Manipulation
            </label>
            <input
              type="text"
              value={tamperApplied ? alteredName : recipientName}
              onChange={(e) => { setAlteredName(e.target.value); setTamperApplied(true); }}
              className="w-full px-3 py-2 bg-[#050816] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500/50"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Field / Degree Manipulation
            </label>
            <input
              type="text"
              value={tamperApplied ? alteredField : degreeField}
              onChange={(e) => { setAlteredField(e.target.value); setTamperApplied(true); }}
              className="w-full px-3 py-2 bg-[#050816] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500/50"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Grade / Honors Alteration
            </label>
            <input
              type="text"
              value={tamperApplied ? alteredGpa : gpaVal}
              onChange={(e) => { setAlteredGpa(e.target.value); setTamperApplied(true); }}
              className="w-full px-3 py-2 bg-[#050816] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500/50"
            />
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison: Genuine vs Tampered */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Canonical Genuine */}
        <div className="bg-[#0B1020]/90 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <CheckCircle size={18} className="text-emerald-400" />
              <h3 className="text-sm font-bold text-white">1. Canonical Issuer Record</h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
              TRUST 99%
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#050816] border border-white/5 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Recipient:</span>
              <span className="text-white font-bold">{recipientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Conferred Field:</span>
              <span className="text-white">{degreeField}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Honors:</span>
              <span className="text-white">{gpaVal}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#050816] border border-white/5 space-y-1.5 text-xs font-mono">
            <span className="text-slate-500 text-[10px] block">Canonical SHA-256 Digest:</span>
            <span className="text-emerald-400 text-[11px] break-all">{originalHash}</span>
            <div className="pt-1 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">ECDSA Signature:</span>
              <span className="text-emerald-400 font-bold">MATHEMATICALLY VALID</span>
            </div>
          </div>
        </div>

        {/* Right: Tampered Version */}
        <div className={`p-6 rounded-3xl border shadow-2xl space-y-4 transition-all ${
          tamperApplied
            ? 'bg-[#0B1020]/90 border-red-500/40 shadow-red-500/10'
            : 'bg-[#0B1020]/90 border-emerald-500/30'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className={tamperApplied ? 'text-red-400' : 'text-emerald-400'} />
              <h3 className="text-sm font-bold text-white">2. Injected Artifact State</h3>
            </div>
            <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border ${
              tamperApplied
                ? 'bg-red-500/10 text-red-400 border-red-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}>
              {tamperApplied ? 'TRUST 32% (FAILED)' : 'TRUST 99%'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#050816] border border-white/5 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Injected Recipient:</span>
              <span className={tamperApplied ? 'text-red-400 font-bold' : 'text-white font-bold'}>
                {tamperApplied ? alteredName : recipientName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Injected Field:</span>
              <span className={tamperApplied ? 'text-red-400' : 'text-white'}>
                {tamperApplied ? alteredField : degreeField}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Injected Honors:</span>
              <span className={tamperApplied ? 'text-red-400' : 'text-white'}>
                {tamperApplied ? alteredGpa : gpaVal}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#050816] border border-white/5 space-y-1.5 text-xs font-mono">
            <span className="text-slate-500 text-[10px] block">Recalculated SHA-256 Digest:</span>
            <span className={`text-[11px] break-all ${tamperApplied ? 'text-red-400' : 'text-emerald-400'}`}>
              {computedForgedHash}
            </span>
            <div className="pt-1 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">ECDSA Signature Check:</span>
              <span className={`font-bold ${tamperApplied ? 'text-red-400' : 'text-emerald-400'}`}>
                {tamperApplied ? 'INVALID SIGNATURE (REJECTED)' : 'VALID'}
              </span>
            </div>
          </div>

          {/* Tamper Heatmap Highlight */}
          {tamperApplied && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 space-y-2 text-xs">
              <span className="font-bold text-red-300 block flex items-center gap-1.5">
                <AlertTriangle size={13} />
                <span>Visual Heatmap Detected Bounding Box</span>
              </span>
              <p className="text-[11px] text-slate-300">
                Font kerning mismatch detected on recipient name glyphs (Confidence: 96.8%). JPEG block artifact boundary detected at coordinates X:140 Y:220.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgeryLabPage;
