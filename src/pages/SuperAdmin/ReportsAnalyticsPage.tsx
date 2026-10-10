import React, { useState } from 'react';
import {
  BarChart2, Download, FileText, Filter, CheckCircle,
  Eye, RefreshCw, Calendar, ArrowRight, ShieldAlert,
  Building, Users, Activity, FileSpreadsheet, X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../components/ui/Toast';
import { AdminHeader } from './components/AdminHeader';

export const ReportsAnalyticsPage: React.FC = () => {
  const { organizations, documents, users, auditLogs } = useApp();
  const { success, info } = useToast();

  // Selected Report Configuration
  const [selectedReportType, setSelectedReportType] = useState('Verification Report');
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [orgFilter, setOrgFilter] = useState('ALL');
  const [docTypeFilter, setDocTypeFilter] = useState('ALL');
  const [generating, setGenerating] = useState(false);
  const [previewData, setPreviewData] = useState<any | null>(null);

  // Summary Metrics
  const totalOrgs = 1248;
  const totalDocs = 142580;
  const totalVerifs = 1248900;
  const verifSuccessRate = '99.1%';
  const failedVerifRate = '0.67%';
  const suspiciousDocRate = '0.02%';
  const revocationRate = '0.24%';
  const activeUserRate = '93.5%';

  // 9 Report Types
  const reportTypes = [
    { id: 'Organization Report', name: 'Organization Report', desc: 'Accreditation, KYB status, and entity distribution' },
    { id: 'Issuer Report', name: 'Issuer Report', desc: 'Issuer organizations, active signing keys, credential throughput' },
    { id: 'User Report', name: 'User Report', desc: 'Platform users, role delegations, and authentication logs' },
    { id: 'Document Report', name: 'Document Report', desc: 'Complete inventory of registered cryptographic documents' },
    { id: 'Verification Report', name: 'Verification Report', desc: 'Forensic validation queries, success vs failure rates' },
    { id: 'KYC Report', name: 'KYC Report', desc: 'Verification pipeline turnaround, approval rates, rejections' },
    { id: 'Fraud/Tampering Report', name: 'Fraud/Tampering Report', desc: 'Detected anomalies, OCR mismatches, signature forgeries' },
    { id: 'Audit Report', name: 'Audit Report', desc: 'Chronological SHA-256 administrative log chain export' },
    { id: 'System Usage Report', name: 'System Usage Report', desc: 'API utilization, node queries, platform storage metrics' },
  ];

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setPreviewData({
        title: selectedReportType,
        range: dateRange,
        generatedAt: new Date().toUTCString(),
        recordCount: selectedReportType === 'Verification Report' ? 12480 : selectedReportType === 'Document Report' ? 1420 : 340,
        filters: `Date: ${dateRange} • Org: ${orgFilter} • Type: ${docTypeFilter}`,
        sampleRows: [
          { col1: 'REC-00192', col2: 'Stanford Academic Degree', col3: '2026-10-04', status: 'VERIFIED', metric: '99% Score' },
          { col1: 'REC-00193', col2: 'Medical Licensure Seal', col3: '2026-10-05', status: 'VERIFIED', metric: '98% Score' },
          { col1: 'REC-00194', col2: 'Apex Executive Clearance', col3: '2026-10-06', status: 'FLAGGED', metric: '32% Tampered' },
          { col1: 'REC-00195', col2: 'State Higher Ed Diploma', col3: '2026-10-07', status: 'VERIFIED', metric: '99% Score' },
          { col1: 'REC-00196', col2: 'Global Tech Compliance Cert', col3: '2026-10-08', status: 'VERIFIED', metric: '97% Score' },
        ]
      });
      success('Report Generated', `${selectedReportType} prepared for review and export.`);
    }, 600);
  };

  const handleExport = (format: 'PDF' | 'CSV') => {
    info('Export Initiated', `Downloading ${selectedReportType} as ${format}...`);
    // Simulate instantaneous download trigger
    setTimeout(() => {
      success('Export Completed', `Successfully exported ${selectedReportType}.${format.toLowerCase()}`);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Reports & Analytical Intelligence"
        description="Enterprise analytics, cross-sectional forensic data, and downloadable compliance reports in PDF and CSV formats."
        badge="COMPLIANCE & AUDIT REPORTING"
        badgeColor="bg-blue-500/10 text-blue-400 border-blue-500/20"
      />

      {/* A. SUMMARY METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="p-3.5 rounded-xl bg-[#0B1020]/90 border border-white/10 text-center">
          <span className="text-slate-400 text-[10px] font-mono uppercase block">Total Orgs</span>
          <span className="text-xl font-bold font-mono text-white mt-1 block">1,248</span>
        </div>
        <div className="p-3.5 rounded-xl bg-[#0B1020]/90 border border-white/10 text-center">
          <span className="text-slate-400 text-[10px] font-mono uppercase block">Total Docs</span>
          <span className="text-xl font-bold font-mono text-white mt-1 block">142.5K</span>
        </div>
        <div className="p-3.5 rounded-xl bg-[#0B1020]/90 border border-white/10 text-center">
          <span className="text-slate-400 text-[10px] font-mono uppercase block">Verifications</span>
          <span className="text-xl font-bold font-mono text-cyan-400 mt-1 block">1.25M</span>
        </div>
        <div className="p-3.5 rounded-xl bg-[#0B1020]/90 border border-white/10 text-center">
          <span className="text-slate-400 text-[10px] font-mono uppercase block">Success Rate</span>
          <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">{verifSuccessRate}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-[#0B1020]/90 border border-white/10 text-center">
          <span className="text-slate-400 text-[10px] font-mono uppercase block">Failed Rate</span>
          <span className="text-xl font-bold font-mono text-red-400 mt-1 block">{failedVerifRate}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-[#0B1020]/90 border border-white/10 text-center">
          <span className="text-slate-400 text-[10px] font-mono uppercase block">Suspicious Rate</span>
          <span className="text-xl font-bold font-mono text-orange-400 mt-1 block">{suspiciousDocRate}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-[#0B1020]/90 border border-white/10 text-center">
          <span className="text-slate-400 text-[10px] font-mono uppercase block">Revocation Rate</span>
          <span className="text-xl font-bold font-mono text-slate-300 mt-1 block">{revocationRate}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-[#0B1020]/90 border border-white/10 text-center">
          <span className="text-slate-400 text-[10px] font-mono uppercase block">Active User Rate</span>
          <span className="text-xl font-bold font-mono text-purple-400 mt-1 block">{activeUserRate}</span>
        </div>
      </div>

      {/* Main Grid: Report Generation Console (Left) & Visual Analytics Snapshot (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Report Generator */}
        <div className="lg:col-span-7 bg-[#0B1020]/90 border border-white/10 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText size={16} className="text-purple-400" />
                <span>Custom Report Generator</span>
              </h3>
              <p className="text-[11px] text-slate-400">Configure parameters, preview data, and export official records</p>
            </div>
            <span className="text-xs font-mono text-purple-300 font-bold">9 TEMPLATES</span>
          </div>

          {/* 1. Select Report Type */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono uppercase text-slate-400 font-bold block">
              1. Select Report Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {reportTypes.map((rt) => (
                <div
                  key={rt.id}
                  onClick={() => setSelectedReportType(rt.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedReportType === rt.id
                      ? 'bg-purple-500/10 border-purple-500/50 shadow-md'
                      : 'bg-[#050816] border-white/5 hover:border-white/15'
                  }`}
                >
                  <h4 className="text-xs font-bold text-white">{rt.name}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{rt.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Select Filters */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono uppercase text-slate-400 font-bold block">
              2. Filter Dimensions
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-mono block mb-1">Time Horizon</span>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full bg-[#050816] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                >
                  <option value="Last 7 Days">Last 7 Days</option>
                  <option value="Last 30 Days">Last 30 Days</option>
                  <option value="Last 90 Days">Last 90 Days</option>
                  <option value="Year to Date">Year to Date (2026)</option>
                  <option value="All Time">All Historical Ledger</option>
                </select>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] uppercase font-mono block mb-1">Target Organization</span>
                <select
                  value={orgFilter}
                  onChange={(e) => setOrgFilter(e.target.value)}
                  className="w-full bg-[#050816] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                >
                  <option value="ALL">All Organizations</option>
                  {organizations.map(o => (
                    <option key={o.id} value={o.name}>{o.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] uppercase font-mono block mb-1">Document Category</span>
                <select
                  value={docTypeFilter}
                  onChange={(e) => setDocTypeFilter(e.target.value)}
                  className="w-full bg-[#050816] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                >
                  <option value="ALL">All Categories</option>
                  <option value="degree">Academic Degree</option>
                  <option value="license">Professional License</option>
                  <option value="certificate">Certification</option>
                  <option value="legal">Legal Affidavit</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Generate */}
          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-mono">
              Generates cryptographic verification statement with tamper hashes
            </span>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 flex items-center gap-2"
            >
              {generating ? <RefreshCw size={14} className="animate-spin" /> : <BarChart2 size={14} />}
              <span>Generate Report Preview</span>
            </button>
          </div>
        </div>

        {/* Right: Visual Analytics Snapshot */}
        <div className="lg:col-span-5 bg-[#0B1020]/90 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity size={16} className="text-cyan-400" />
              <span>Verification Trends & Health</span>
            </h3>
            <span className="text-xs font-mono text-emerald-400">99.1% HEALTHY</span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Visual metric breakdown */}
            <div className="p-3.5 rounded-xl bg-[#050816] border border-white/5 space-y-2">
              <div className="flex justify-between font-mono">
                <span className="text-slate-300">Successful Verifications</span>
                <span className="text-emerald-400 font-bold">1,237,660 (99.1%)</span>
              </div>
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full" style={{ width: '99.1%' }} />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#050816] border border-white/5 space-y-2">
              <div className="flex justify-between font-mono">
                <span className="text-slate-300">Failed Signature Verification</span>
                <span className="text-red-400 font-bold">8,420 (0.67%)</span>
              </div>
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                <div className="bg-red-400 h-full rounded-full" style={{ width: '0.67%' }} />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#050816] border border-white/5 space-y-2">
              <div className="flex justify-between font-mono">
                <span className="text-slate-300">AI Forensic Discrepancies</span>
                <span className="text-amber-400 font-bold">2,820 (0.23%)</span>
              </div>
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-400 h-full rounded-full" style={{ width: '0.23%' }} />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[11px] text-slate-300 leading-relaxed font-mono">
              Ledger Consensus: 100% of validated records backed by ECDSA secp256k1 signature chains and SHA-256 pre-hashes.
            </div>
          </div>
        </div>
      </div>

      {/* E. REPORT PREVIEW & EXPORT MODAL */}
      {previewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-[#0B1020] border border-white/10 rounded-2xl p-6 shadow-2xl text-left max-h-[90vh] overflow-y-auto space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-white/5">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">{previewData.title}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    GENERATED
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Parameters: {previewData.filters} • Generated: {previewData.generatedAt}
                </p>
              </div>
              <button
                onClick={() => setPreviewData(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Preview Table */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono text-purple-400 uppercase font-bold block">
                Sample Output Dataset ({previewData.recordCount} Total Rows Available)
              </span>
              <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#050816]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0B1020] text-slate-400 uppercase font-mono text-[10px] border-b border-white/5">
                    <tr>
                      <th className="py-2.5 px-3">Record ID</th>
                      <th className="py-2.5 px-3">Title / Scope</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Metric</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {previewData.sampleRows.map((row: any) => (
                      <tr key={row.col1} className="hover:bg-white/[0.02]">
                        <td className="py-2.5 px-3 font-mono text-purple-300">{row.col1}</td>
                        <td className="py-2.5 px-3 font-semibold text-white">{row.col2}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">{row.col3}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            row.status === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-300">{row.metric}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions Bar & Export Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <button
                onClick={() => setPreviewData(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
              >
                Close Preview
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExport('CSV')}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Download size={14} />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={() => handleExport('PDF')}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-500/20 flex items-center gap-1.5 transition-colors"
                >
                  <Download size={14} />
                  <span>Export Official PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
