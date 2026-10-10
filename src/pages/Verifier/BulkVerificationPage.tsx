import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet, Upload, Search, Filter, Download,
  CheckCircle2, ShieldAlert, AlertTriangle, Eye, RefreshCw,
  Cpu, FileText, Check, X, ArrowRight, Loader2, Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../components/ui/Toast';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Pagination } from '../SuperAdmin/components/Pagination';
import { TableEmptyState } from '../SuperAdmin/components/TableStates';

interface BulkItem {
  id: string;
  fileName: string;
  documentType: string;
  issuerOrg: string;
  result: 'VERIFIED' | 'TAMPERED' | 'UNVERIFIED';
  trustScore: number;
  mainReason: string;
  date: string;
}

export const BulkVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const { documents, organizations, addAuditLog } = useApp();
  const { success, info } = useToast();

  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const totalBatchSize = 10;

  // Batch Results Data
  const [batchItems, setBatchItems] = useState<BulkItem[]>([
    {
      id: 'DOC-2026-STF-9021',
      fileName: 'Stanford_MS_Diploma_Chen.pdf',
      documentType: 'degree',
      issuerOrg: 'Global Tech University',
      result: 'VERIFIED',
      trustScore: 99,
      mainReason: 'SHA-256 and ECDSA cryptographic match against Genesis ledger',
      date: 'Today, 09:20'
    },
    {
      id: 'DOC-2026-FORGED-1102',
      fileName: 'ApexCorp_Clearance_Kaelen.pdf',
      documentType: 'certificate',
      issuerOrg: 'Apex Corp',
      result: 'TAMPERED',
      trustScore: 32,
      mainReason: 'Recipient name kerning divergence & signature hash mismatch',
      date: 'Today, 09:20'
    },
    {
      id: 'DOC-2026-WHO-4412',
      fileName: 'Medical_Practitioner_License_Vance.pdf',
      documentType: 'license',
      issuerOrg: 'National Medical Board',
      result: 'VERIFIED',
      trustScore: 97,
      mainReason: 'Accreditation oracle confirmed active and ECDSA signature valid',
      date: 'Today, 09:21'
    },
    {
      id: 'DOC-2026-REV-7781',
      fileName: 'ISO27001_LeadAuditor_Miller.pdf',
      documentType: 'certificate',
      issuerOrg: 'Global Standards Assurance',
      result: 'TAMPERED',
      trustScore: 18,
      mainReason: 'Credential officially revoked by issuing authority',
      date: 'Today, 09:21'
    },
    {
      id: 'DOC-2026-STF-9022',
      fileName: 'BSc_ElectricalEng_Tanaka.pdf',
      documentType: 'degree',
      issuerOrg: 'Global Tech University',
      result: 'VERIFIED',
      trustScore: 98,
      mainReason: 'Valid cryptographic anchor in university ledger',
      date: 'Today, 09:22'
    },
    {
      id: 'DOC-2026-UNKN-4410',
      fileName: 'Cyber_Doctorate_Black.pdf',
      documentType: 'degree',
      issuerOrg: 'Unregistered Institute',
      result: 'UNVERIFIED',
      trustScore: 48,
      mainReason: 'Issuer authority not recognized in trusted registry',
      date: 'Today, 09:22'
    },
    {
      id: 'DOC-2026-APEX-8821',
      fileName: 'CyberSecurity_Analyst_Cert.pdf',
      documentType: 'certificate',
      issuerOrg: 'Apex Corp',
      result: 'VERIFIED',
      trustScore: 96,
      mainReason: 'All multi-signal checks passed consensus threshold',
      date: 'Today, 09:23'
    },
    {
      id: 'DOC-2026-MED-1029',
      fileName: 'State_Pharmacy_License_Grover.pdf',
      documentType: 'license',
      issuerOrg: 'National Medical Board',
      result: 'VERIFIED',
      trustScore: 95,
      mainReason: 'Medical register lookup valid',
      date: 'Today, 09:23'
    }
  ]);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [resultFilter, setResultFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // 19.3 Bulk Summary metrics
  const totalCount = batchItems.length;
  const verifiedCount = batchItems.filter(i => i.result === 'VERIFIED').length;
  const tamperedCount = batchItems.filter(i => i.result === 'TAMPERED').length;
  const unverifiedCount = batchItems.filter(i => i.result === 'UNVERIFIED').length;

  // Filtered List
  const filteredItems = useMemo(() => {
    return batchItems.filter(item => {
      const matchSearch =
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.issuerOrg.toLowerCase().includes(searchTerm.toLowerCase());

      const matchResult = resultFilter === 'ALL' || item.result === resultFilter;
      const matchType = typeFilter === 'ALL' || item.documentType === typeFilter;

      return matchSearch && matchResult && matchType;
    });
  }, [batchItems, searchTerm, resultFilter, typeFilter]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage]);

  const handleProcessBatchDemo = () => {
    setIsProcessing(true);
    setProcessedCount(1);

    const interval = setInterval(() => {
      setProcessedCount(prev => {
        if (prev >= totalBatchSize) {
          clearInterval(interval);
          setIsProcessing(false);
          success('Batch Processed', `Completed cryptographic verification for ${totalBatchSize} documents.`);
          addAuditLog({
            actorName: 'Forensic Verifier',
            actorRole: 'VERIFIER',
            actorId: 'USR-003',
            action: 'BULK_VERIFICATION_COMPLETED',
            entityType: 'DOCUMENT',
            entityId: `BATCH-${Date.now().toString().slice(-4)}`,
            details: `Processed batch of ${totalBatchSize} files. Verified: ${verifiedCount}, Tampered: ${tamperedCount}.`
          });
          return totalBatchSize;
        }
        return prev + 2;
      });
    }, 200);
  };

  const handleExportBatchCsv = () => {
    info('Exporting Batch CSV', 'Generating structured audit statement for current batch...');
    setTimeout(() => {
      success('Export Completed', 'bulk_verification_report.csv has been saved.');
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              HIGH-THROUGHPUT ENGINE
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1.5 font-sans">
            Bulk Verification
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 max-w-2xl leading-relaxed">
            Verify multiple credentials or ZIP bundles in parallel. Multi-signal verification is executed individually per file.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportBatchCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors"
          >
            <Download size={14} />
            <span>Download CSV</span>
          </button>
          <button
            onClick={handleProcessBatchDemo}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
          >
            {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            <span>Process New Batch</span>
          </button>
        </div>
      </div>

      {/* 19.1 UPLOAD DROP ZONE */}
      <div className="bg-[#0B1020]/90 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl space-y-4">
        <div
          onClick={handleProcessBatchDemo}
          className="border-2 border-dashed border-white/10 hover:border-emerald-500/40 rounded-2xl p-8 text-center cursor-pointer transition-all hover:bg-emerald-500/5 group space-y-3"
        >
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
            <Upload size={24} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
              Drag & Drop Multiple Files or ZIP Archive Here
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Supports PDF, PNG, JPG, or .ZIP bundles (up to 500 documents per batch)
            </p>
          </div>
          <span className="inline-block text-[11px] font-mono text-emerald-400 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 font-bold">
            CLICK TO SIMULATE 10-DOCUMENT BATCH UPLOAD
          </span>
        </div>

        {/* 19.2 Processing Progress State */}
        {isProcessing && (
          <div className="p-4 rounded-xl bg-[#050816] border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-emerald-400 font-bold flex items-center gap-2">
                <Loader2 size={13} className="animate-spin" />
                Processing Batch Documents...
              </span>
              <span className="text-slate-300">Processing {processedCount} / {totalBatchSize}</span>
            </div>
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-200"
                style={{ width: `${(processedCount / totalBatchSize) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 19.3 BULK SUMMARY METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10">
          <span className="text-slate-400 text-[10px] font-mono uppercase block">Total Processed</span>
          <span className="text-2xl font-black font-mono text-white mt-1 block">{totalCount}</span>
          <span className="text-[10px] text-slate-500">100% completed</span>
        </div>

        <div
          onClick={() => setResultFilter(resultFilter === 'VERIFIED' ? 'ALL' : 'VERIFIED')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            resultFilter === 'VERIFIED' ? 'bg-emerald-500/10 border-emerald-500/40 shadow-lg' : 'bg-[#0B1020]/90 border-white/10 hover:border-emerald-500/30'
          }`}
        >
          <span className="text-slate-400 text-[10px] font-mono uppercase block">Verified Genuine</span>
          <span className="text-2xl font-black font-mono text-emerald-400 mt-1 block">{verifiedCount}</span>
          <span className="text-[10px] text-emerald-400 font-bold">Passed consensus</span>
        </div>

        <div
          onClick={() => setResultFilter(resultFilter === 'TAMPERED' ? 'ALL' : 'TAMPERED')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            resultFilter === 'TAMPERED' ? 'bg-red-500/10 border-red-500/40 shadow-lg' : 'bg-[#0B1020]/90 border-white/10 hover:border-red-500/30'
          }`}
        >
          <span className="text-slate-400 text-[10px] font-mono uppercase block">Tampered / Altered</span>
          <span className="text-2xl font-black font-mono text-red-400 mt-1 block">{tamperedCount}</span>
          <span className="text-[10px] text-red-400 font-bold">Integrity failure</span>
        </div>

        <div
          onClick={() => setResultFilter(resultFilter === 'UNVERIFIED' ? 'ALL' : 'UNVERIFIED')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            resultFilter === 'UNVERIFIED' ? 'bg-amber-500/10 border-amber-500/40 shadow-lg' : 'bg-[#0B1020]/90 border-white/10 hover:border-amber-500/30'
          }`}
        >
          <span className="text-slate-400 text-[10px] font-mono uppercase block">Unverified / Missing</span>
          <span className="text-2xl font-black font-mono text-amber-400 mt-1 block">{unverifiedCount}</span>
          <span className="text-[10px] text-amber-300 font-bold">No registry record</span>
        </div>
      </div>

      {/* 19.4 & 19.5 RESULTS TABLE, FILTERS, SEARCH */}
      <div className="bg-[#0B1020]/90 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by Document ID, File Name, or Issuer..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-[#050816] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={resultFilter}
              onChange={(e) => { setResultFilter(e.target.value); setCurrentPage(1); }}
              className="bg-[#050816] border border-white/10 rounded-xl text-xs text-slate-300 px-3 py-2 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Results</option>
              <option value="VERIFIED">Verified Only</option>
              <option value="TAMPERED">Tampered Only</option>
              <option value="UNVERIFIED">Unverified Only</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
              className="bg-[#050816] border border-white/10 rounded-xl text-xs text-slate-300 px-3 py-2 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="degree">Degree</option>
              <option value="license">License</option>
              <option value="certificate">Certificate</option>
            </select>
          </div>
        </div>

        {/* 19.4 Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#050816] text-slate-400 uppercase font-mono text-[10px] border-b border-white/5">
              <tr>
                <th className="py-2.5 px-3">Document ID</th>
                <th className="py-2.5 px-3">File Name</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Issuer</th>
                <th className="py-2.5 px-3">Result</th>
                <th className="py-2.5 px-3">Trust Score</th>
                <th className="py-2.5 px-3">Main Evidence Reason</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <TableEmptyState
                      isFiltered={searchTerm !== '' || resultFilter !== 'ALL' || typeFilter !== 'ALL'}
                      onClearFilters={() => { setSearchTerm(''); setResultFilter('ALL'); setTypeFilter('ALL'); }}
                    />
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3 font-mono text-purple-300 font-bold">{item.id}</td>
                    <td className="py-3 px-3 text-white font-medium max-w-[170px] truncate" title={item.fileName}>
                      {item.fileName}
                    </td>
                    <td className="py-3 px-3 uppercase text-[10px] font-mono text-slate-400">{item.documentType}</td>
                    <td className="py-3 px-3 text-slate-300 truncate max-w-[130px]">{item.issuerOrg}</td>
                    <td className="py-3 px-3"><StatusBadge status={item.result} /></td>
                    <td className="py-3 px-3 font-mono font-bold">
                      <span className={item.trustScore >= 80 ? 'text-emerald-400' : item.trustScore >= 50 ? 'text-amber-400' : 'text-red-400'}>
                        {item.trustScore}/100
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px] max-w-[220px] truncate" title={item.mainReason}>
                      {item.mainReason}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => navigate(`/verifier/verify?id=${encodeURIComponent(item.id)}`)}
                          className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors text-[10px] font-semibold"
                          title="View Result"
                        >
                          Result
                        </button>
                        <button
                          onClick={() => navigate(`/verifier/forensics?id=${encodeURIComponent(item.id)}`)}
                          className="px-2 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 transition-colors text-[10px] font-semibold"
                          title="View Forensics"
                        >
                          Forensics
                        </button>
                        <button
                          onClick={() => navigate(`/verifier/dna?id=${encodeURIComponent(item.id)}`)}
                          className="px-2 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 transition-colors text-[10px] font-semibold"
                          title="View DNA"
                        >
                          DNA
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredItems.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};
