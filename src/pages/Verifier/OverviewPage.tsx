import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, ShieldAlert, AlertTriangle, FileText,
  QrCode, Upload, ExternalLink, ArrowRight, Shield,
  Activity, Eye, Clock, Layers, FileSpreadsheet, Camera
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import StarBorder from '../../components/ui/StarBorder';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { verifications } = useApp();

  // Statistics
  const totalVerifications = verifications.length;
  const verifiedCount = verifications.filter(v => v.result === 'VERIFIED').length;
  const tamperedCount = verifications.filter(v => v.result === 'TAMPERED').length;
  const suspiciousCount = verifications.filter(v => v.result === 'UNVERIFIED' || v.result === 'SUSPICIOUS').length;

  // Suspicious/Tampered documents requiring attention
  const suspiciousList = verifications.filter(v => v.result === 'TAMPERED' || v.result === 'SUSPICIOUS' || v.result === 'UNVERIFIED');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              VERIFIER OPERATIONAL HUB
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1.5 font-sans">
            Verification Overview
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 max-w-2xl leading-relaxed">
            Real-time verification telemetry, active tamper alerts, and quick multi-modal document validation.
          </p>
        </div>

        <button
          onClick={() => navigate('/verifier/verify')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition-all self-start sm:self-auto"
        >
          <Shield size={14} />
          <span>New Verification</span>
        </button>
      </div>

      {/* 4.1 TOP STATISTICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div onClick={() => navigate('/verifier/history')} className="cursor-pointer">
          <StatCard
            title="Total Verifications"
            value={totalVerifications}
            icon={<Activity size={20} />}
            trend={totalVerifications > 0 ? `${totalVerifications} recorded` : 'No checks recorded'}
            trendUp={true}
          />
        </div>
        <div onClick={() => navigate('/verifier/history')} className="cursor-pointer">
          <StatCard
            title="Verified (Authentic)"
            value={verifiedCount}
            icon={<CheckCircle2 size={20} />}
            trend={`${totalVerifications > 0 ? Math.round((verifiedCount / totalVerifications) * 100) : 0}% success rate`}
            trendUp={true}
          />
        </div>
        <div onClick={() => navigate('/verifier/forensics')} className="cursor-pointer">
          <StatCard
            title="Tampered Evidence"
            value={tamperedCount}
            icon={<ShieldAlert size={20} />}
            trend={tamperedCount > 0 ? `${tamperedCount} Anomaly Flags` : 'Zero Tamper'}
            trendUp={tamperedCount === 0}
          />
        </div>
        <div onClick={() => navigate('/verifier/history')} className="cursor-pointer">
          <StatCard
            title="Suspicious / Unverified"
            value={suspiciousCount}
            icon={<AlertTriangle size={20} />}
            trend={suspiciousCount > 0 ? 'Requires Review' : 'Optimal'}
            trendUp={suspiciousCount === 0}
          />
        </div>
      </div>

      {/* 4.2 QUICK VERIFICATION SECTION */}
      <div className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
          Quick Verification Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StarBorder
            as="div"
            className="w-full h-full cursor-pointer"
            innerClassName="p-5 flex flex-col justify-between group h-full"
            color="#a855f7"
            speed="6s"
            backgroundColor="#0B1020"
            borderColor="rgba(168, 85, 247, 0.2)"
            onClick={() => navigate('/verifier/verify?tab=camera')}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                  <Camera size={20} />
                </div>
                <ArrowRight size={15} className="text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">Scan Camera</h3>
              <p className="text-xs text-slate-400 mt-1">Live camera stream QR scanning with reticle capture and instant validation</p>
            </div>
          </StarBorder>

          <StarBorder
            as="div"
            className="w-full h-full cursor-pointer"
            innerClassName="p-5 flex flex-col justify-between group h-full"
            color="#3b82f6"
            speed="6s"
            backgroundColor="#0B1020"
            borderColor="rgba(59, 130, 246, 0.2)"
            onClick={() => navigate('/verifier/verify?tab=qr_decode')}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                  <QrCode size={20} />
                </div>
                <ArrowRight size={15} className="text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">Decode QR File</h3>
              <p className="text-xs text-slate-400 mt-1">Extract and verify cryptographic QR barcodes embedded in image or PDF files</p>
            </div>
          </StarBorder>

          <StarBorder
            as="div"
            className="w-full h-full cursor-pointer"
            innerClassName="p-5 flex flex-col justify-between group h-full"
            color="#06b6d4"
            speed="6s"
            backgroundColor="#0B1020"
            borderColor="rgba(6, 182, 212, 0.2)"
            onClick={() => navigate('/verifier/verify?tab=compare')}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
                  <Upload size={20} />
                </div>
                <ArrowRight size={15} className="text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">Compare File</h3>
              <p className="text-xs text-slate-400 mt-1">Verify suspect document against original registry ledger and SHA-256 hash</p>
            </div>
          </StarBorder>

          <StarBorder
            as="div"
            className="w-full h-full cursor-pointer"
            innerClassName="p-5 flex flex-col justify-between group h-full"
            color="#10b981"
            speed="6s"
            backgroundColor="#0B1020"
            borderColor="rgba(168, 85, 247, 0.2)"
            onClick={() => navigate('/verifier/verify?tab=link')}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                  <ExternalLink size={20} />
                </div>
                <ArrowRight size={15} className="text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">Verify by Link / ID</h3>
              <p className="text-xs text-slate-400 mt-1">Direct credential resolution via canonical VeriProof URL or Public Document ID</p>
            </div>
          </StarBorder>
        </div>
      </div>

      {/* Split Section: Recent Verification (Left) & Suspicious Results (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 4.3 RECENT VERIFICATION SECTION */}
        <div className="lg:col-span-8 bg-[#0B1020]/90 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock size={16} className="text-purple-400" />
                <span>Recent Verification Activity</span>
              </h3>
              <p className="text-[11px] text-slate-400">Live operational ledger of completed validations</p>
            </div>
            <button
              onClick={() => navigate('/verifier/history')}
              className="text-xs font-mono text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#050816] text-slate-400 uppercase font-mono text-[10px] border-b border-white/5">
                <tr>
                  <th className="py-2.5 px-3">Document ID & Title</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Issuer</th>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Result</th>
                  <th className="py-2.5 px-3">Trust Score</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {verifications.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 font-mono text-xs">
                      No verification records recorded yet. Validate credentials using the actions above.
                    </td>
                  </tr>
                ) : (
                  verifications.slice(0, 5).map((v) => (
                    <tr key={v.verificationId} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-3 font-bold text-white max-w-[200px]">
                        <div>
                          <span className="font-mono text-purple-300 text-[11px] block">{v.documentId}</span>
                          <span className="truncate block font-sans text-xs">{v.documentTitle}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 uppercase text-[11px] font-mono text-slate-400">{v.documentType}</td>
                      <td className="py-3 px-3 text-slate-300 truncate max-w-[140px]">{v.issuerOrg}</td>
                      <td className="py-3 px-3 font-mono text-slate-400 text-[11px] whitespace-nowrap">{v.verificationDate}</td>
                      <td className="py-3 px-3">
                        <StatusBadge status={v.result} />
                      </td>
                      <td className="py-3 px-3 font-mono font-bold">
                        <span className={v.trustScore >= 80 ? 'text-emerald-400' : v.trustScore >= 50 ? 'text-amber-400' : 'text-red-400'}>
                          {v.trustScore}/100
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => navigate(`/verifier/verify?id=${encodeURIComponent(v.documentId)}`)}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-[11px] font-semibold transition-colors inline-flex items-center gap-1"
                        >
                          <Eye size={12} />
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4.4 RECENT SUSPICIOUS RESULTS */}
        <div className="lg:col-span-4 bg-[#0B1020]/90 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert size={16} className="text-red-400" />
                <span>Suspicious / Tampered Alerts</span>
              </h3>
              <p className="text-[11px] text-slate-400">Items requiring forensic attention</p>
            </div>
            <span className="text-[10px] font-mono text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
              {suspiciousList.length} ALERTS
            </span>
          </div>

          <div className="space-y-3">
            {suspiciousList.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No active suspicious or tampered items detected.
              </div>
            ) : (
              suspiciousList.slice(0, 3).map((item) => (
                <div
                  key={item.verificationId}
                  className="p-3.5 rounded-xl bg-[#050816] border border-red-500/20 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-purple-300 font-bold">{item.documentId}</span>
                    <StatusBadge status={item.result} />
                  </div>
                  <p className="text-slate-300 text-[11px] line-clamp-2">
                    {item.reasons[0] || 'Integrity divergence detected'}
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] font-mono">
                    <span className="text-red-400 font-bold">Score: {item.trustScore}/100</span>
                    <button
                      onClick={() => navigate(`/verifier/forensics?id=${encodeURIComponent(item.documentId)}`)}
                      className="text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1"
                    >
                      <span>View Analysis</span>
                      <ArrowRight size={11} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
