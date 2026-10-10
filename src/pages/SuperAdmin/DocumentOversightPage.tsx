import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Search, Eye, Shield, Lock, X
} from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { AdminHeader } from './components/AdminHeader';
import { ConfirmModal } from './components/ConfirmModal';
import { Pagination } from './components/Pagination';
import { TableEmptyState } from './components/TableStates';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { apiRequest, type AdminRegistryDocument, type AdminRegistryDocumentList, type RegistryDocumentDetail } from '../../utils/documentRegistryApi';

export const DocumentOversightPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();

  // Registry status is authoritative; forensic risk scoring is not implemented by this API.
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'REVOKED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const [documents, setDocuments] = useState<AdminRegistryDocument[]>([]);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [activeDocuments, setActiveDocuments] = useState(0);
  const [revokedDocuments, setRevokedDocuments] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedDocumentDetail, setSelectedDocumentDetail] = useState<RegistryDocumentDetail | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  // Selected Document for details modal
  const [selectedDoc, setSelectedDoc] = useState<AdminRegistryDocument | null>(null);

  // Destructive Actions Modals
  const [revokeModal, setRevokeModal] = useState<{ isOpen: boolean; doc: AdminRegistryDocument | null }>({ isOpen: false, doc: null });
  const totalDocs = totalDocuments;
  const activeCount = activeDocuments;
  const revokedCount = revokedDocuments;

  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);
    setLoadError(null);
    const query = new URLSearchParams({ page: String(currentPage), limit: String(pageSize) });
    if (activeTab !== 'ALL') query.set('status', activeTab);
    if (searchTerm.trim()) query.set('search', searchTerm.trim());
    if (typeFilter !== 'ALL') query.set('document_type', typeFilter);
    apiRequest<AdminRegistryDocumentList>(`/admin/documents?${query.toString()}`)
      .then(response => {
        if (!isCurrent) return;
        setDocuments(response.items);
        setTotalDocuments(response.total);
        setActiveDocuments(response.active_count);
        setRevokedDocuments(response.revoked_count);
      })
      .catch(requestError => { if (isCurrent) setLoadError(requestError instanceof Error ? requestError.message : 'Unable to load the document registry.'); })
      .finally(() => { if (isCurrent) setIsLoading(false); });
    return () => { isCurrent = false; };
  }, [activeTab, currentPage, pageSize, searchTerm, typeFilter, refreshIndex]);

  // Filtered Documents
  const paginatedDocs = documents;

  const handleConfirmRevoke = async (reason?: string) => {
    if (!revokeModal.doc) return;
    try {
      const updated = await apiRequest<RegistryDocumentDetail>(`/documents/${encodeURIComponent(revokeModal.doc.document_id)}/revoke`, {
        method: 'POST',
        body: JSON.stringify({ reason: reason || 'Revoked by Super Admin.' }),
      });
      setSelectedDocumentDetail(updated);
      setRefreshIndex(value => value + 1);
      success('Document Revoked', `Credential ${revokeModal.doc.public_verification_id} has been marked REVOKED.`);
    } catch (requestError) {
      error('Revocation Failed', requestError instanceof Error ? requestError.message : 'The registry could not revoke this document.');
    } finally {
      setRevokeModal({ isOpen: false, doc: null });
    }
  };

  const openDocument = (record: AdminRegistryDocument) => {
    setSelectedDoc(record);
    setSelectedDocumentDetail(null);
    apiRequest<RegistryDocumentDetail>(`/documents/${encodeURIComponent(record.document_id)}`)
      .then(setSelectedDocumentDetail)
      .catch(requestError => error('Registry Detail Unavailable', requestError instanceof Error ? requestError.message : 'Unable to load cryptographic details.'));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('ALL');
    setActiveTab('ALL');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Document Oversight & Integrity Monitor"
        description="Search registered credentials, inspect signed-manifest integrity checks, and apply audited revocations."
        badge="DOCUMENT INTEGRITY LEDGER"
        badgeColor="bg-pink-500/10 text-pink-400 border-pink-500/20"
      />

      {/* A. SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div
          onClick={() => { setActiveTab('ALL'); setCurrentPage(1); }}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeTab === 'ALL' ? 'bg-pink-500/10 border-pink-500/40 shadow-lg' : 'bg-[#0B1020]/90 border-white/10'
          }`}
        >
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Total Documents</span>
          <span className="text-2xl font-black font-mono text-white mt-1 block">{totalDocs}</span>
          <span className="text-[10px] text-slate-500">Registered</span>
        </div>

        <div
          onClick={() => { setActiveTab('ACTIVE'); setCurrentPage(1); }}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeTab === 'ACTIVE' ? 'bg-emerald-500/10 border-emerald-500/40 shadow-lg' : 'bg-[#0B1020]/90 border-white/10'
          }`}
        >
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Active Valid</span>
          <span className="text-2xl font-black font-mono text-emerald-400 mt-1 block">{activeCount}</span>
          <span className="text-[10px] text-emerald-400 font-bold">Registry status ACTIVE</span>
        </div>

        <div
          onClick={() => { setActiveTab('REVOKED'); setCurrentPage(1); }}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeTab === 'REVOKED' ? 'bg-red-500/10 border-red-500/40 shadow-lg' : 'bg-[#0B1020]/90 border-white/10'
          }`}
        >
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Revoked</span>
          <span className="text-2xl font-black font-mono text-red-400 mt-1 block">{revokedCount}</span>
          <span className="text-[10px] text-slate-500">Invalidated</span>
        </div>

      </div>

      {/* Tabs Filter Bar */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-2 text-xs font-semibold overflow-x-auto">
        {[
          { key: 'ALL', label: 'All Documents', count: totalDocs },
          { key: 'ACTIVE', label: 'Active', count: activeCount },
          { key: 'REVOKED', label: 'Revoked', count: revokedCount },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key as any); setCurrentPage(1); }}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>{tab.label}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/10 text-slate-300">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Main Table Container */}
      <div className="bg-[#0B1020]/90 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
        {loadError && <div role="alert" className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">{loadError}</div>}
        {isLoading && <div role="status" className="text-xs text-slate-400">Loading PostgreSQL document registry...</div>}
        {/* Search & Type Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by registry ID, public ID, title, issuer, or SHA-256..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-[#050816] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
              className="bg-[#050816] border border-white/10 rounded-xl text-xs text-slate-300 px-3 py-2 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Document Types</option>
              <option value="degree">Degree / Diploma</option>
              <option value="license">License</option>
              <option value="certificate">Certificate</option>
              <option value="legal">Legal Affidavit</option>
              <option value="medical">Medical</option>
            </select>
          </div>
        </div>

        {/* B. DOCUMENT TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#050816] text-slate-400 uppercase font-mono text-[10px] border-b border-white/5">
              <tr>
                <th className="py-3 px-4">Document ID & Title</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Issuer Org</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Hash / Crypto</th>
                <th className="py-3 px-4">SHA-256</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedDocs.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <TableEmptyState
                      isFiltered={searchTerm !== '' || typeFilter !== 'ALL' || activeTab !== 'ALL'}
                      onClearFilters={clearFilters}
                    />
                  </td>
                </tr>
              ) : (
                paginatedDocs.map((doc) => {
                  const isRevoked = doc.status === 'REVOKED';

                  return (
                    <tr key={doc.document_id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white max-w-[220px]">
                        <div>
                          <span className="font-mono text-purple-300 text-[11px] block">{doc.public_verification_id}</span>
                          <span className="truncate block font-sans text-xs">{doc.title}</span>
                          <span className="text-[10px] text-slate-500 font-normal font-sans">Registry {doc.document_id}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 uppercase text-[11px] font-mono text-slate-300">{doc.document_type}</td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <span>{doc.organization_name}</span>
                        <span className="text-[10px] font-mono text-slate-500 block">Issuer #{doc.issuer_user_id}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">{doc.issue_date}</td>
                      <td className="py-3.5 px-4"><StatusBadge status={doc.status} /></td>
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <span className="text-slate-300">{doc.signature_algorithm}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400 text-[10px]" title={doc.sha256_hash}>{doc.sha256_hash.slice(0, 12)}...</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openDocument(doc)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                            title="Inspect Document"
                          >
                            <Eye size={14} />
                          </button>
                          {!isRevoked && (
                            <button
                              onClick={() => setRevokeModal({ isOpen: true, doc })}
                              className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[11px] font-bold transition-colors"
                            >
                              Revoke
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
        <Pagination
          currentPage={currentPage}
          totalItems={totalDocs}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* C & D. DOCUMENT DETAILS & FORENSICS MODAL */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-[#0B1020] border border-white/10 rounded-2xl p-6 shadow-2xl text-left max-h-[90vh] overflow-y-auto space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-white/5">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">{selectedDoc.title}</h3>
                  <StatusBadge status={selectedDoc.status} />
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300 uppercase">
                    {selectedDoc.document_type}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Public ID: {selectedDoc.public_verification_id} • Registry: {selectedDoc.document_id}
                </p>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Document Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
                <span className="text-slate-500 text-[10px] uppercase font-mono block">Issuer Organization</span>
                <span className="font-bold text-white">{selectedDoc.organization_name}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
                <span className="text-slate-500 text-[10px] uppercase font-mono block">Issue Date</span>
                <span className="font-mono text-slate-300">{selectedDoc.issue_date}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
                <span className="text-slate-500 text-[10px] uppercase font-mono block">Registry Status</span>
                <span className="font-mono font-bold text-slate-200">{selectedDoc.status}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
                <span className="text-slate-500 text-[10px] uppercase font-mono block">Version</span>
                <span className="font-mono text-white font-bold">{selectedDoc.version}</span>
              </div>
            </div>

            {/* Cryptographic Integrity Details */}
            <div className="p-4 rounded-xl bg-[#050816] border border-purple-500/20 space-y-2 text-xs">
              <span className="text-[10px] font-mono text-purple-400 uppercase font-bold block">
                Cryptographic Integrity & Digital Signatures
              </span>
              <div className="space-y-1.5 font-mono text-[11px]">
                <div>
                  <span className="text-slate-500">SHA-256 Digest:</span>
                  <p className="text-purple-300 break-all select-all">{selectedDocumentDetail?.sha256_hash || selectedDoc.sha256_hash}</p>
                </div>
                <div>
                  <span className="text-slate-500">{selectedDoc.signature_algorithm} Signature:</span>
                  <p className="text-slate-300 break-all select-all">{selectedDocumentDetail?.signature_value || selectedDoc.signature_value}</p>
                </div>
                <div>
                  <span className="text-slate-500">QR Payload URL:</span>
                  <p className="text-cyan-400 break-all">{selectedDocumentDetail?.verification_url || 'Verification URL unavailable'}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-2 text-[11px]">
                  <span className="text-slate-400">Stored byte hash: {selectedDocumentDetail ? selectedDocumentDetail.hash_matches ? 'MATCH' : 'MISMATCH' : 'Checking...'}</span>
                  <span className="text-slate-400">Manifest signature: {selectedDocumentDetail ? selectedDocumentDetail.signature_valid ? 'VALID' : 'INVALID' : 'Checking...'}</span>
                </div>
              </div>
            </div>

            {selectedDoc.status === 'REVOKED' ? (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs space-y-1">
                <span className="text-red-400 font-bold uppercase font-mono block">Revocation Record</span>
                <p className="text-slate-300 text-[11px]">Reason: {selectedDoc.revocation_reason || 'Not provided'}</p>
                <span className="text-[10px] text-slate-500 font-mono">Revoked At: {selectedDoc.revoked_at || 'Unavailable'}</span>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 font-mono flex items-center justify-between">
                <span>Verification outcome is based on stored-byte hash and signed-manifest checks.</span>
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setSelectedDoc(null); navigate('/admin/audit-trail'); }}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
                >
                  View Audit Trail
                </button>
                <button
                  onClick={() => { setSelectedDoc(null); navigate('/admin/trusted-registry'); }}
                  className="px-3 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold"
                >
                  View Registry Record
                </button>
              </div>

              {selectedDoc.status !== 'REVOKED' && (
                <button
                  onClick={() => setRevokeModal({ isOpen: true, doc: selectedDoc })}
                  className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold shadow-lg shadow-red-500/20"
                >
                  Revoke Credential
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Revocation Confirmation Modal */}
      <ConfirmModal
        isOpen={revokeModal.isOpen}
        onClose={() => setRevokeModal({ isOpen: false, doc: null })}
        onConfirm={handleConfirmRevoke}
        title={`Revoke Credential "${revokeModal.doc?.public_verification_id}"?`}
        message="Revoking a credential marks it as permanently invalid across all verifiers and public verification endpoints. Provide an administrative justification for the audit trail."
        confirmLabel="Confirm Revocation"
        isDestructive={true}
        requireReason={true}
        reasonPlaceholder="Specify revocation rationale (e.g. fraudulent claims, institutional accreditation cancellation)..."
      />

    </div>
  );
};
