import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Files, Search, Filter, ShieldCheck, CheckCircle2,
  Eye, X, ArrowUpRight, Lock, Shield, History,
  ShieldAlert, Copy, ExternalLink, Calendar, QrCode
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { IssuerHeader } from './components/IssuerHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Pagination } from '../SuperAdmin/components/Pagination';
import { TableEmptyState } from '../SuperAdmin/components/TableStates';
import { useToast } from '../../components/ui/Toast';
import { useIssuerDocuments } from '../../hooks/useIssuerDocuments';
import type { IssuerDocumentView } from '../../utils/documentRegistryApi';

export const MyDocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success } = useToast();
  const { documents, isLoading, error: loadError } = useIssuerDocuments(user);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'REVOKED' | 'EXPIRED'>('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Selected document for Details Drawer
  const [selectedDoc, setSelectedDoc] = useState<IssuerDocumentView | null>(null);

  // Documents belonging to this issuer's organization
  const orgDocuments = useMemo(() => {
    return documents;
  }, [documents]);

  // Filtered documents
  const filteredDocs = useMemo(() => {
    const now = new Date();

    return orgDocuments.filter((doc) => {
      // Search
      const term = searchTerm.toLowerCase();
      const matchSearch =
        doc.id.toLowerCase().includes(term) ||
        doc.title.toLowerCase().includes(term) ||
        doc.recipientName.toLowerCase().includes(term) ||
        doc.recipientId.toLowerCase().includes(term) ||
        doc.documentType.toLowerCase().includes(term);

      // Status filter with Section A distinction:
      // An expired document must not automatically be considered revoked.
      // A revoked document must remain identifiable as revoked even if expired.
      let matchStatus = true;
      const isExpired = doc.expiryDate ? new Date(doc.expiryDate) < now : false;

      if (statusFilter === 'ACTIVE') {
        matchStatus = doc.status === 'active' && !isExpired;
      } else if (statusFilter === 'REVOKED') {
        matchStatus = doc.status === 'revoked';
      } else if (statusFilter === 'EXPIRED') {
        matchStatus = isExpired && doc.status !== 'revoked';
      } else if (statusFilter === 'PENDING') {
        matchStatus = (doc.status as string) === 'pending' || (doc.status as string) === 'suspended';
      }

      // Type filter
      const matchType =
        typeFilter === 'ALL' ||
        doc.documentType.toLowerCase() === typeFilter.toLowerCase();

      // Date filter
      const matchDate = !dateFilter || doc.issueDate.startsWith(dateFilter);

      return matchSearch && matchStatus && matchType && matchDate;
    });
  }, [orgDocuments, searchTerm, statusFilter, typeFilter, dateFilter]);

  // Paginated records
  const paginatedDocs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDocs.slice(start, start + pageSize);
  }, [filteredDocs, currentPage]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    success('Copied to Clipboard', label);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setTypeFilter('ALL');
    setDateFilter('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <IssuerHeader
        title="My Issued Documents"
        description="Authoritative repository of credentials issued by your organization. Inspect cryptographic hashes, verify registry status, check lifecycle timelines, or revoke credentials."
        badge="ORGANIZATION LEDGER"
        badgeColor="bg-violet-500/10 text-violet-400 border-violet-500/20"
        actions={
          <button
            onClick={() => navigate('/issuer/issue')}
            className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-violet-600/20 transition-all cursor-pointer"
          >
            <span>+ Issue New Document</span>
          </button>
        }
      />

      {loadError && <div role="alert" className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">{loadError}</div>}
      {isLoading && <div role="status" className="text-xs text-slate-400">Loading registered documents...</div>}

      {/* SECTION A & B: SEARCH & FILTER TOOLBAR */}
      <div className="bg-[#0B1020]/90 border border-white/10 rounded-2xl p-4 space-y-3">
        {/* Status Filter Tabs (Section A) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-white/5">
          {(['ALL', 'ACTIVE', 'PENDING', 'REVOKED', 'EXPIRED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === status
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {status === 'ALL' ? 'All Documents' : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Search, Type & Date Filters (Section B) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-1">
          {/* Search Input */}
          <div className="sm:col-span-2 relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search Document ID, Recipient, Title..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-[#050816] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-[#050816] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500/50 cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="degree">Degree / Marksheet</option>
              <option value="certificate">Certificate</option>
              <option value="license">License</option>
              <option value="legal">Legal / Contract</option>
              <option value="id_card">ID / Credential</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-[#050816] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500/50 font-mono"
            />
            {(searchTerm || typeFilter !== 'ALL' || dateFilter || statusFilter !== 'ALL') && (
              <button
                onClick={clearFilters}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                title="Reset filters"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SECTION C: DOCUMENT TABLE */}
      <div className="bg-[#0B1020]/90 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#070B19] border-b border-white/5 text-[10px] font-mono uppercase text-slate-400">
                <th className="py-3.5 px-4">Document ID</th>
                <th className="py-3.5 px-4">Title & Classification</th>
                <th className="py-3.5 px-4">Recipient</th>
                <th className="py-3.5 px-4">Issue Date</th>
                <th className="py-3.5 px-4">Expiry Date</th>
                <th className="py-3.5 px-4">Registry Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedDocs.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <TableEmptyState
                      title="No matching documents found"
                      description="Try adjusting your search criteria, clearing active filters, or issuing a new document."
                      isFiltered={Boolean(searchTerm || typeFilter !== 'ALL' || dateFilter || statusFilter !== 'ALL')}
                      onClearFilters={clearFilters}
                    />
                  </td>
                </tr>
              ) : (
                paginatedDocs.map((doc) => {
                  const isExpired = doc.expiryDate ? new Date(doc.expiryDate) < new Date() : false;
                  const displayStatus = doc.status === 'revoked' ? 'REVOKED' : isExpired ? 'EXPIRED' : doc.status.toUpperCase();

                  return (
                    <tr key={doc.id} className="hover:bg-white/[0.02] transition-colors group">
                      {/* Document ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-violet-300">
                        {doc.id}
                      </td>

                      {/* Title & Type */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white max-w-xs truncate">{doc.title}</div>
                        <span className="text-[10px] font-mono uppercase text-slate-400 capitalize">
                          {doc.documentType}
                        </span>
                      </td>

                      {/* Recipient */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-200 font-medium">{doc.recipientName}</div>
                        <div className="text-[10px] font-mono text-slate-400">{doc.recipientId}</div>
                      </td>

                      {/* Issue Date */}
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {doc.issueDate}
                      </td>

                      {/* Expiry Date */}
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {doc.expiryDate || 'Lifetime'}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={displayStatus} />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedDoc(doc)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                            title="Inspect Document Details"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            onClick={() => navigate(`/issuer/protection?id=${doc.id}`)}
                            className="p-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 transition-colors"
                            title="Open Document Protection"
                          >
                            <Shield size={13} />
                          </button>
                          <button
                            onClick={() => navigate(`/issuer/history?id=${doc.id}`)}
                            className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors"
                            title="View Lifecycle History"
                          >
                            <History size={13} />
                          </button>
                          {doc.status !== 'revoked' && (
                            <button
                              onClick={() => navigate(`/issuer/revoke?id=${doc.id}`)}
                              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                              title="Revoke Credential"
                            >
                              <ShieldAlert size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-white/5">
          <Pagination
            currentPage={currentPage}
            totalItems={filteredDocs.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* SECTION D: DOCUMENT DETAILS MODAL / DRAWER */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1020] border border-white/15 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  <Files size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedDoc.title}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-xs text-violet-300 font-bold">{selectedDoc.id}</span>
                    <StatusBadge status={selectedDoc.status.toUpperCase()} />
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* General Info */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                General Information
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-[#070B19] p-4 rounded-xl border border-white/5">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Recipient</span>
                  <span className="text-white font-semibold mt-0.5 block">{selectedDoc.recipientName}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{selectedDoc.recipientId}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Issuer Entity</span>
                  <span className="text-slate-200 mt-0.5 block">{selectedDoc.issuerOrg}</span>
                  <span className="text-[10px] text-slate-400">{selectedDoc.issuerName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Timeline</span>
                  <span className="text-slate-200 mt-0.5 block font-mono">Issued: {selectedDoc.issueDate}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Expires: {selectedDoc.expiryDate || 'Lifetime'}
                  </span>
                </div>
              </div>
            </div>

            {/* Security & Cryptographic Details */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                Cryptographic & Registry Security
              </h4>
              <div className="space-y-3 bg-[#070B19] p-4 rounded-xl border border-white/5 text-xs">
                {/* SHA-256 Hash */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1.5">
                      <Lock size={12} className="text-violet-400" /> Canonical SHA-256 Digest
                    </span>
                    <button
                      onClick={() => copyToClipboard(selectedDoc.sha256Hash, 'SHA-256 Hash')}
                      className="text-[10px] text-violet-400 hover:text-violet-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Copy size={11} /> Copy
                    </button>
                  </div>
                  <div className="p-2 rounded bg-[#050816] font-mono text-[11px] text-slate-300 break-all select-all border border-white/5">
                    {selectedDoc.sha256Hash}
                  </div>
                </div>

                {/* Digital Signature */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">Digital Signature</span>
                    <span className="font-mono text-emerald-400 text-[11px] font-bold block mt-0.5">
                      ECDSA secp256k1 VALID
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono truncate block">
                      {selectedDoc.ecdsaSignature.slice(0, 24)}...
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">Registry Record</span>
                    <span className="font-mono text-emerald-400 text-[11px] font-bold block mt-0.5">
                      {selectedDoc.status === 'revoked' ? 'REVOCATION RECORDED' : 'CONFIRMED IN LEDGER'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Verified Oracle Node</span>
                  </div>
                </div>

                {/* Public Verification Link */}
                <div className="pt-2 border-t border-white/5">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                    Verification Endpoint
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/verify/${selectedDoc.id}`}
                      className="flex-1 px-3 py-1.5 bg-[#050816] border border-white/10 rounded text-[11px] font-mono text-slate-300"
                    />
                    <button
                      onClick={() => copyToClipboard(`${window.location.origin}/verify/${selectedDoc.id}`, 'Verification URL')}
                      className="px-3 py-1.5 rounded bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const id = selectedDoc.id;
                    setSelectedDoc(null);
                    navigate(`/issuer/protection?id=${id}`);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <Shield size={14} className="text-violet-400" />
                  <span>Document Protection</span>
                </button>
                <button
                  onClick={() => {
                    const id = selectedDoc.id;
                    setSelectedDoc(null);
                    navigate(`/issuer/history?id=${id}`);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <History size={14} className="text-blue-400" />
                  <span>Timeline History</span>
                </button>
              </div>

              {selectedDoc.status !== 'revoked' && (
                <button
                  onClick={() => {
                    const id = selectedDoc.id;
                    setSelectedDoc(null);
                    navigate(`/issuer/revoke?id=${id}`);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold flex items-center gap-1.5"
                >
                  <ShieldAlert size={14} />
                  <span>Revoke Credential</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyDocumentsPage;
