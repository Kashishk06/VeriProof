import React, { useState } from 'react';
import { Eye, ShieldAlert, CheckCircle, XCircle, Search, Filter, AlertTriangle, FileText } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../components/ui/Toast';
import { StatusBadge } from '../../components/ui/StatusBadge';

export const HumanReviewPage: React.FC = () => {
  const { documents, addAuditLog } = useApp();
  const { success, warning, error } = useToast();

  const [reviewItems, setReviewItems] = useState([
    {
      id: 'REV-ITEM-1',
      docId: 'DOC-2026-FORGED-1102',
      title: 'Tampered Executive Compliance Clearance',
      flaggedReason: 'Font Kerning Divergence & Clone Stamp Artifact (ELA)',
      riskLevel: 'CRITICAL',
      recipient: 'Viktor Kaelen',
      submittedAt: '15 mins ago',
      assignedTo: 'Forensic Tier 2 Analyst'
    },
    {
      id: 'REV-ITEM-2',
      docId: 'DOC-2026-STF-9021',
      title: 'Master of Science in Computer Science',
      flaggedReason: 'Slight Scanner Skew Angle during High-DPI Capture',
      riskLevel: 'LOW',
      recipient: 'Alexandra Chen',
      submittedAt: '1 hr ago',
      assignedTo: 'Forensic Tier 1 Analyst'
    }
  ]);

  const [selectedReview, setSelectedReview] = useState<any | null>(reviewItems[0]);

  const handleResolve = (action: 'APPROVE' | 'REJECT') => {
    if (!selectedReview) return;

    if (action === 'APPROVE') {
      success('Analyst Sign-Off Approved', `Document ${selectedReview.docId} cleared as authentic.`);
    } else {
      error('Analyst Confirmed Forgery', `Document ${selectedReview.docId} permanently blacklisted.`);
    }

    setReviewItems(prev => prev.filter(item => item.id !== selectedReview.id));
    setSelectedReview(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
              EXPERT TRIAGE QUEUE
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            Human Forensic Review Console
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Analyst inspection of flagged AI forensic anomalies and edge-case cryptographic divergence.
          </p>
        </div>

        <span className="text-xs font-mono text-purple-400 bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-full">
          {reviewItems.length} CASES IN QUEUE
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Queue Items */}
        <div className="lg:col-span-5 bg-[#0B1020]/90 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center justify-between">
            <span>Pending Flagged Submissions</span>
            <span className="text-xs font-mono text-slate-400">PRIORITY SORT</span>
          </h2>

          {reviewItems.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              All flagged items resolved. No pending reviews in queue.
            </div>
          ) : (
            <div className="space-y-3">
              {reviewItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedReview(item)}
                  className={`p-4 rounded-xl cursor-pointer border transition-all text-xs space-y-2 ${
                    selectedReview?.id === item.id
                      ? 'bg-purple-500/10 border-purple-500/40 shadow-lg'
                      : 'bg-[#050816] border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{item.docId}</span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      item.riskLevel === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-slate-500/20 text-slate-300'
                    }`}>
                      {item.riskLevel}
                    </span>
                  </div>
                  <p className="text-slate-300 font-semibold">{item.title}</p>
                  <p className="text-[11px] text-red-400 font-mono">Flag: {item.flaggedReason}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Inspection Console */}
        <div className="lg:col-span-7 bg-[#0B1020]/90 border border-white/10 rounded-2xl p-6 shadow-xl">
          {selectedReview ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div>
                  <h3 className="text-base font-bold text-white">{selectedReview.title}</h3>
                  <span className="text-xs font-mono text-purple-400">{selectedReview.docId}</span>
                </div>
                <span className="text-xs font-mono text-slate-400">{selectedReview.submittedAt}</span>
              </div>

              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 space-y-2 text-xs">
                <span className="font-bold text-red-300 flex items-center gap-1.5">
                  <AlertTriangle size={14} />
                  <span>AI Forensic Flag Trigger:</span>
                </span>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  {selectedReview.flaggedReason}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
                  <span className="text-slate-500 text-[10px] block">Recipient Identity</span>
                  <span className="font-bold text-white">{selectedReview.recipient}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
                  <span className="text-slate-500 text-[10px] block">Assigned Analyst</span>
                  <span className="font-bold text-white">{selectedReview.assignedTo}</span>
                </div>
              </div>

              {/* Analyst Decision Actions */}
              <div className="pt-4 border-t border-white/5 space-y-3">
                <span className="text-xs font-bold text-slate-400 block uppercase font-mono">
                  ANALYST DISPOSITION:
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleResolve('APPROVE')}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/20"
                  >
                    Clear & Whitelist (False Positive)
                  </button>
                  <button
                    onClick={() => handleResolve('REJECT')}
                    className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs shadow-lg shadow-red-500/20"
                  >
                    Confirm Forgery & Blacklist
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 text-xs">
              Select a review item from the queue to view full forensic telemetry.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HumanReviewPage;
