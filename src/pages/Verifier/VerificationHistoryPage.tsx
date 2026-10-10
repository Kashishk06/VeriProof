import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History, Search, Filter, ArrowUpDown, Download, CheckCircle2,
  AlertTriangle, XCircle, HelpCircle, Eye, ExternalLink, Calendar,
  RefreshCw, FileText, QrCode, Upload, Link as LinkIcon, Layers,
  ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../components/ui/Toast';
import { VerificationResultView } from './VerificationResultView';
import type { VerificationHistoryRecord } from '../../data/mockData';

export const VerificationHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { verifications } = useApp();
  const { info, success } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VERIFIED' | 'TAMPERED' | 'UNVERIFIED' | 'SUSPICIOUS'>('ALL');
  const [methodFilter, setMethodFilter] = useState<'ALL' | 'QR' | 'Upload' | 'Link' | 'Bulk'>('ALL');
  const [selectedRecord, setSelectedRecord] = useState<VerificationHistoryRecord | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filtered dataset
  const filteredRecords = useMemo(() => {
    return verifications.filter((record) => {
      // Status filter
      if (statusFilter !== 'ALL' && record.result !== statusFilter) {
        return false;
      }
      // Method filter
      if (methodFilter !== 'ALL' && record.method !== methodFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesDocId = record.documentId.toLowerCase().includes(q);
        const matchesVerId = record.verificationId.toLowerCase().includes(q);
        const matchesIssuer = record.issuerOrg.toLowerCase().includes(q);
        const matchesType = record.documentType.toLowerCase().includes(q);
        const matchesUser = record.recipientName?.toLowerCase().includes(q);
        if (!matchesDocId && !matchesVerId && !matchesIssuer && !matchesType && !matchesUser) {
          return false;
        }
      }
      return true;
    });
  }, [verifications, statusFilter, methodFilter, searchQuery]);

  // Paginated records
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(start, start + itemsPerPage);
  }, [filteredRecords, currentPage, itemsPerPage]);

  const getVerdictBadge = (verdict: VerificationHistoryRecord['result']) => {
    switch (verdict) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED
          </span>
        );
      case 'TAMPERED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" /> TAMPERED
          </span>
        );
      case 'SUSPICIOUS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5" /> SUSPICIOUS
          </span>
        );
      case 'UNVERIFIED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/30">
            <HelpCircle className="w-3.5 h-3.5" /> UNVERIFIED
          </span>
        );
    }
  };

  const getMethodIcon = (method: VerificationHistoryRecord['method']) => {
    switch (method) {
      case 'QR':
        return <QrCode className="w-3.5 h-3.5 text-indigo-400" />;
      case 'Upload':
        return <Upload className="w-3.5 h-3.5 text-cyan-400" />;
      case 'Link':
        return <LinkIcon className="w-3.5 h-3.5 text-amber-400" />;
      case 'Bulk':
        return <Layers className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const exportCsv = () => {
    const headers = ['Verification ID', 'Document ID', 'Type', 'Issuer', 'Timestamp', 'Verdict', 'Trust Score', 'Method'];
    const rows = filteredRecords.map(r => [
      r.verificationId,
      r.documentId,
      r.documentType,
      r.issuerOrg,
      r.verificationDate,
      r.result,
      r.trustScore,
      r.method
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `veriproof_history_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('History Exported', `Downloaded ${filteredRecords.length} verification audit rows.`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <History className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">Verification History</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Complete audit trail of all single, QR, link, and bulk verifications executed by your organization.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportCsv}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-lg transition"
          >
            <Download className="w-4 h-4 text-slate-400" />
            Export CSV
          </button>
          <button
            onClick={() => navigate('/verifier/verify')}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition"
          >
            <FileText className="w-4 h-4" />
            Verify New Document
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by Document ID, Verification ID, Issuer, or Recipient..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 whitespace-nowrap">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="VERIFIED">VERIFIED</option>
            <option value="TAMPERED">TAMPERED</option>
            <option value="SUSPICIOUS">SUSPICIOUS</option>
            <option value="UNVERIFIED">UNVERIFIED</option>
          </select>
        </div>

        {/* Method Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 whitespace-nowrap">Method:</span>
          <select
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Methods</option>
            <option value="Upload">File Upload</option>
            <option value="QR">QR Code</option>
            <option value="Link">Link / ID</option>
            <option value="Bulk">Bulk Batch</option>
          </select>
        </div>
      </div>

      {/* History Table Card */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Verification ID</th>
                <th className="py-3 px-4">Document Details</th>
                <th className="py-3 px-4">Issuing Authority</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Trust Score</th>
                <th className="py-3 px-4">Result</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {paginatedRecords.length > 0 ? (
                paginatedRecords.map((item) => (
                  <tr
                    key={item.verificationId}
                    className="hover:bg-slate-800/40 transition group cursor-pointer"
                    onClick={() => setSelectedRecord(item)}
                  >
                    <td className="py-3 px-4 font-mono text-indigo-400 font-medium">
                      {item.verificationId}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-white">{item.documentId}</div>
                      <div className="text-[11px] text-slate-400">{item.documentType}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {item.issuerOrg}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {item.verificationDate}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[11px] font-medium text-slate-300">
                        {getMethodIcon(item.method)}
                        {item.method}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold">
                      <span className={
                        item.trustScore >= 80 ? 'text-emerald-400' :
                        item.trustScore >= 50 ? 'text-amber-400' : 'text-rose-400'
                      }>
                        {item.trustScore}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {getVerdictBadge(item.result)}
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedRecord(item)}
                          className="px-2.5 py-1 text-[11px] font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3 text-indigo-400" />
                          View Result
                        </button>
                        <button
                          onClick={() => navigate(`/verifier/dna?id=${item.documentId}`)}
                          className="p-1 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition"
                          title="View Document DNA"
                        >
                          <Layers className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <History className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-50" />
                    <p className="text-sm font-medium text-slate-400">No verification records found</p>
                    <p className="text-xs text-slate-500 mt-1">Try resetting your filter parameters or verify a new document.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Sub-Bar */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing <strong className="text-white">{filteredRecords.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong> to{' '}
            <strong className="text-white">{Math.min(currentPage * itemsPerPage, filteredRecords.length)}</strong> of{' '}
            <strong className="text-white">{filteredRecords.length}</strong> verifications
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono text-slate-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Full Verification Result Modal Overlay */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-5xl bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto p-6">
            <button
              onClick={() => setSelectedRecord(null)}
              className="absolute top-4 right-4 p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <VerificationResultView
              result={selectedRecord}
              onVerifyAnother={() => {
                setSelectedRecord(null);
                navigate('/verifier/verify');
              }}
              onBackToOverview={() => {
                setSelectedRecord(null);
                navigate('/verifier/overview');
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
