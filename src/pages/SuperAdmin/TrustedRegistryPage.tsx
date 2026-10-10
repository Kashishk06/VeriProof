import { apiRequest, type AdminRegistryDocumentList, type RegistryDocumentDetail } from '../../utils/documentRegistryApi';
import React, { useState, useMemo, useEffect } from 'react';
import {
  Database, Search, Filter, ShieldCheck, CheckCircle,
  Eye, X, ArrowUpRight, Shield, QrCode, Lock,
  FileText, Check, AlertTriangle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AdminHeader } from './components/AdminHeader';
import { Pagination } from './components/Pagination';
import { TableEmptyState } from './components/TableStates';
import { StatusBadge } from '../../components/ui/StatusBadge';

export const TrustedRegistryPage: React.FC = () => {
  const { registry, organizations } = useApp();

  // Internal tabs: Registry Dataset, Organization Records, Document Registry
  const [activeTab, setActiveTab] = useState<'DATASET' | 'ORGANIZATIONS' | 'DOCUMENTS'>('ORGANIZATIONS');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Selected Record Details
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
    const [selectedDocumentDetail, setSelectedDocumentDetail] = useState<RegistryDocumentDetail | null>(null);
    const [selectedDocumentDetailError, setSelectedDocumentDetailError] = useState<string | null>(null);
  const [adminDocuments, setAdminDocuments] = useState<AdminRegistryDocumentList['items']>([]);
  const [adminDocumentsTotal, setAdminDocumentsTotal] = useState(0);
  const [adminDocumentsLoading, setAdminDocumentsLoading] = useState(false);
  const [adminDocumentsError, setAdminDocumentsError] = useState<string | null>(null);
  const openRecord = (record: any, recordType: 'ORG' | 'DOC') => {
    setSelectedRecord({ ...record, recordType });
    setSelectedDocumentDetail(null);
    setSelectedDocumentDetailError(null);
    if (recordType === 'DOC') {
      apiRequest<RegistryDocumentDetail>(`/documents/${encodeURIComponent(record.registryRecordId)}`)
        .then(setSelectedDocumentDetail)
        .catch(requestError => setSelectedDocumentDetailError(requestError instanceof Error ? requestError.message : 'Unable to verify registry record.'));
    }
  };

  // Summary Metrics
  const totalRegistryRecords = registry.length + adminDocumentsTotal;
  const verifiedOrgsCount = organizations.filter(o => o.kycStatus === 'APPROVED').length;
  const registeredDocsCount = adminDocumentsTotal;
  const activeRecordsCount = registry.filter(r => r.status === 'ACTIVE').length;
  const revokedRecordsCount = registry.filter(r => r.status === 'SUSPENDED').length;
  const registryMismatchesCount = 'Not tracked';

  useEffect(() => {
    if (activeTab !== 'DOCUMENTS') return;
    let isCurrent = true;
    setAdminDocumentsLoading(true);
    setAdminDocumentsError(null);
    const query = new URLSearchParams({ page: String(currentPage), limit: String(pageSize) });
    if (searchTerm.trim()) query.set('search', searchTerm.trim());
    apiRequest<AdminRegistryDocumentList>(`/admin/documents?${query.toString()}`)
      .then(response => {
        if (isCurrent) {
          setAdminDocuments(response.items);
          setAdminDocumentsTotal(response.total);
        }
      })
      .catch(requestError => {
        if (isCurrent) setAdminDocumentsError(requestError instanceof Error ? requestError.message : 'Unable to load registered documents.');
      })
      .finally(() => { if (isCurrent) setAdminDocumentsLoading(false); });
    return () => { isCurrent = false; };
  }, [activeTab, currentPage, pageSize, searchTerm]);

  // Organization Records Data
  const orgRecords = useMemo(() => {
    return registry.map((reg, idx) => {
      const matchOrg = organizations.find(o => o.registrationNumber === reg.registrationNumber);
      return {
        registryId: `REG-ORG-00${idx + 1}`,
        orgName: reg.orgName,
        orgType: reg.type,
        registrationNumber: reg.registrationNumber,
        registrationAuthority: reg.jurisdiction,
        verificationStatus: matchOrg ? 'VERIFIED' : 'PENDING',
        createdDate: reg.incorporationDate,
        lastUpdated: '2026-10-01',
        status: reg.status,
        officialDomain: reg.officialDomain,
        directors: reg.authorizedDirectors
      };
    });
  }, [registry, organizations]);

  // Document Registry Data
  const docRecords = useMemo(() => {
    return adminDocuments.map(record => ({
      registryRecordId: record.document_id,
      documentId: record.public_verification_id,
      issuerId: String(record.issuer_user_id),
      issuerOrg: record.organization_name,
      documentType: record.document_type,
      sha256Hash: record.sha256_hash,
      digitalSignatureStatus: record.signature_value ? 'SIGNED' : 'MISSING',
      signature: record.signature_value,
      issueDate: record.issue_date,
      qrVerificationId: record.public_verification_id,
      documentStatus: record.status,
      verificationCount: null as number | null,
    }));
  }, [adminDocuments]);

  // Filtered List based on active tab
  const filteredList = useMemo(() => {
    if (activeTab === 'ORGANIZATIONS' || activeTab === 'DATASET') {
      return orgRecords.filter(r =>
        r.orgName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.registryId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.registrationAuthority.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } else {
      return docRecords.filter(r =>
        r.registryRecordId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.documentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.issuerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.issuerOrg.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.sha256Hash.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  }, [activeTab, orgRecords, docRecords, searchTerm]);

  const paginatedList = useMemo(() => {
    if (activeTab === 'DOCUMENTS') return filteredList;
    const start = (currentPage - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [activeTab, filteredList, currentPage]);

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Authoritative Trusted Registry"
        description="Tamper-evident canonical ledger records of accredited organizations and cryptographically registered documents."
        badge="CANONICAL GROUND TRUTH"
        badgeColor="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      />

      {/* A. REGISTRY SUMMARY */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10">
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Registry Records</span>
          <span className="text-2xl font-black font-mono text-white mt-1 block">{totalRegistryRecords}</span>
          <span className="text-[10px] text-slate-500">Immutable ledger</span>
        </div>
        <div className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10">
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Verified Entities</span>
          <span className="text-2xl font-black font-mono text-emerald-400 mt-1 block">{verifiedOrgsCount}</span>
          <span className="text-[10px] text-emerald-400 font-bold">Oracle cross-checked</span>
        </div>
        <div className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10">
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Registered Docs</span>
          <span className="text-2xl font-black font-mono text-blue-400 mt-1 block">{registeredDocsCount}</span>
          <span className="text-[10px] text-slate-500">SHA-256 anchored</span>
        </div>
        <div className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10">
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Active Records</span>
          <span className="text-2xl font-black font-mono text-purple-400 mt-1 block">{activeRecordsCount}</span>
          <span className="text-[10px] text-slate-500">Current valid</span>
        </div>
        <div className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10">
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Revoked Records</span>
          <span className="text-2xl font-black font-mono text-red-400 mt-1 block">{revokedRecordsCount}</span>
          <span className="text-[10px] text-slate-500">Explicitly revoked</span>
        </div>
        <div className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10">
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Oracle Mismatches</span>
          <span className="text-2xl font-black font-mono text-amber-400 mt-1 block">{registryMismatchesCount}</span>
          <span className="text-[10px] text-amber-300 font-bold">Not tracked by registry API</span>
        </div>
      </div>

      {/* Internal Tabs */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-2 text-xs font-semibold">
        {[
          { key: 'ORGANIZATIONS', label: 'Organization Records', count: orgRecords.length },
          { key: 'DOCUMENTS', label: 'Document Registry', count: adminDocumentsTotal },
          { key: 'DATASET', label: 'Accreditation Oracles Dataset', count: registry.length }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key as any); setCurrentPage(1); }}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 ${
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

      {/* Table Container */}
      <div className="bg-[#0B1020]/90 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          {activeTab === 'DOCUMENTS' && adminDocumentsError && <div role="alert" className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">{adminDocumentsError}</div>}
          {activeTab === 'DOCUMENTS' && adminDocumentsLoading && <div role="status" className="text-xs text-slate-400">Loading PostgreSQL document registry...</div>}
        {/* Search */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder={
                activeTab === 'DOCUMENTS'
                  ? 'Search by record ID, document ID, issuer, SHA-256...'
                  : 'Search by registry ID, organization name, registration number...'
              }
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-[#050816] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Lock size={10} />
              IMMUTABLE LEDGER
            </span>
          </div>
        </div>

        {/* B. ORGANIZATION REGISTRY TABLE */}
        {(activeTab === 'ORGANIZATIONS' || activeTab === 'DATASET') && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#050816] text-slate-400 uppercase font-mono text-[10px] border-b border-white/5">
                <tr>
                  <th className="py-3 px-4">Registry ID</th>
                  <th className="py-3 px-4">Organization Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Registration Number</th>
                  <th className="py-3 px-4">Authority</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedList.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <TableEmptyState
                        isFiltered={searchTerm !== ''}
                        onClearFilters={() => setSearchTerm('')}
                      />
                    </td>
                  </tr>
                ) : (
                  paginatedList.map((rec: any) => (
                    <tr key={rec.registryId} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-mono text-purple-300 font-bold">{rec.registryId}</td>
                      <td className="py-3.5 px-4 font-bold text-white">{rec.orgName}</td>
                      <td className="py-3.5 px-4 text-slate-300">{rec.orgType}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">{rec.registrationNumber}</td>
                      <td className="py-3.5 px-4 text-slate-300">{rec.registrationAuthority}</td>
                      <td className="py-3.5 px-4"><StatusBadge status={rec.verificationStatus} /></td>
                      <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">{rec.createdDate}</td>
                      <td className="py-3.5 px-4"><StatusBadge status={rec.status} /></td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => openRecord(rec, 'ORG')}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* C. DOCUMENT REGISTRY TABLE */}
        {activeTab === 'DOCUMENTS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#050816] text-slate-400 uppercase font-mono text-[10px] border-b border-white/5">
                <tr>
                  <th className="py-3 px-4">Record ID</th>
                  <th className="py-3 px-4">Document ID</th>
                  <th className="py-3 px-4">Issuer ID & Org</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">SHA-256 Hash</th>
                  <th className="py-3 px-4">Signature</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedList.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <TableEmptyState
                        isFiltered={searchTerm !== ''}
                        onClearFilters={() => setSearchTerm('')}
                      />
                    </td>
                  </tr>
                ) : (
                  paginatedList.map((rec: any) => (
                    <tr key={rec.registryRecordId} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-mono text-purple-300 font-bold">{rec.registryRecordId}</td>
                      <td className="py-3.5 px-4 font-mono text-white font-semibold">{rec.documentId}</td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <span className="font-bold">{rec.issuerOrg}</span>
                        <span className="text-[10px] font-mono text-slate-500 block">{rec.issuerId}</span>
                      </td>
                      <td className="py-3.5 px-4 uppercase text-[11px] font-mono text-slate-400">{rec.documentType}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-400 text-[10px] max-w-[120px] truncate" title={rec.sha256Hash}>
                        {rec.sha256Hash.slice(0, 12)}...
                      </td>
                      <td className="py-3.5 px-4"><StatusBadge status={rec.digitalSignatureStatus} /></td>
                      <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">{rec.issueDate}</td>
                      <td className="py-3.5 px-4"><StatusBadge status={rec.documentStatus} /></td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => openRecord(rec, 'DOC')}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={activeTab === 'DOCUMENTS' ? adminDocumentsTotal : filteredList.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* D. REGISTRY RECORD DETAILS MODAL */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-[#0B1020] border border-white/10 rounded-2xl p-6 shadow-2xl text-left max-h-[90vh] overflow-y-auto space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Database size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">
                      {selectedRecord.recordType === 'ORG' ? selectedRecord.orgName : selectedRecord.documentId}
                    </h3>
                    <StatusBadge status={selectedRecord.status || selectedRecord.documentStatus} />
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Canonical Record ID: {selectedRecord.registryId || selectedRecord.registryRecordId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {selectedRecord.recordType === 'DOC' && (
              <div className="p-4 rounded-xl bg-[#050816] border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300 font-bold flex items-center gap-1.5"><ShieldCheck size={14} /> REGISTRY INTEGRITY CHECK</span>
                  <span className={selectedDocumentDetail?.hash_matches && selectedDocumentDetail.signature_valid ? 'text-emerald-400 font-semibold' : 'text-amber-300 font-semibold'}>
                    {selectedDocumentDetailError ? 'CHECK UNAVAILABLE' : selectedDocumentDetail ? selectedDocumentDetail.hash_matches && selectedDocumentDetail.signature_valid ? 'CHECKS PASSED' : 'CHECK FAILED' : 'CHECKING RECORD'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                  <div className="p-2 rounded-lg bg-white/5 flex items-center justify-between"><span className="text-slate-400">Hash:</span><span>{selectedDocumentDetail ? selectedDocumentDetail.hash_matches ? 'MATCH' : 'MISMATCH' : '—'}</span></div>
                  <div className="p-2 rounded-lg bg-white/5 flex items-center justify-between"><span className="text-slate-400">Signature:</span><span>{selectedDocumentDetail ? selectedDocumentDetail.signature_valid ? 'VALID' : 'INVALID' : '—'}</span></div>
                  <div className="p-2 rounded-lg bg-white/5 flex items-center justify-between"><span className="text-slate-400">Registry:</span><span>{selectedDocumentDetail ? 'LOADED' : '—'}</span></div>
                  <div className="p-2 rounded-lg bg-white/5 flex items-center justify-between"><span className="text-slate-400">QR:</span><span>{selectedDocumentDetail ? 'AVAILABLE' : '—'}</span></div>
                </div>
                {selectedDocumentDetailError && <p role="alert" className="text-xs text-red-300">{selectedDocumentDetailError}</p>}
              </div>
            )}

            {/* Detailed Metadata based on Type */}
            {selectedRecord.recordType === 'DOC' ? (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#050816] border border-white/5 space-y-2">
                  <span className="text-[10px] font-mono text-purple-400 uppercase block font-bold">Cryptographic Fingerprint</span>
                  <div>
                    <span className="text-slate-500 text-[10px] font-mono block">SHA-256 Digest:</span>
                    <span className="font-mono text-purple-300 break-all select-all">{selectedDocumentDetail?.sha256_hash || selectedRecord.sha256Hash}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] font-mono block">ECDSA Signature:</span>
                    <span className="font-mono text-slate-300 break-all select-all">{selectedDocumentDetail?.signature_value || selectedRecord.signature}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] font-mono block">Signing Key ID:</span>
                    <span className="font-mono text-slate-300 break-all">{selectedDocumentDetail?.signing_key_id || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] font-mono block">Public Verification URL:</span>
                    <p className="text-cyan-400 break-all">{selectedDocumentDetail?.verification_url || 'Loading...'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
                    <span className="text-slate-500 text-[10px] font-mono block uppercase">Issue Date</span>
                    <span className="font-mono text-white">{selectedRecord.issueDate}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
                    <span className="text-slate-500 text-[10px] font-mono block uppercase">Registry Status</span>
                    <span className="font-mono text-white font-bold">{selectedRecord.documentStatus}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
                    <span className="text-slate-500 text-[10px] font-mono block uppercase">Version</span>
                    <span className="font-mono text-white font-bold">{selectedDocumentDetail?.version ?? '—'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
                    <span className="text-slate-500 text-[10px] font-mono block uppercase">Registration ID</span>
                    <span className="font-mono text-purple-300 font-bold">{selectedRecord.registrationNumber}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
                    <span className="text-slate-500 text-[10px] font-mono block uppercase">Authority</span>
                    <span className="text-white">{selectedRecord.registrationAuthority}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#050816] border border-white/5">
                    <span className="text-slate-500 text-[10px] font-mono block uppercase">Domain</span>
                    <span className="font-mono text-slate-300">{selectedRecord.officialDomain}</span>
                  </div>
                </div>

                {selectedRecord.directors && (
                  <div className="p-3.5 rounded-xl bg-[#050816] border border-white/5 space-y-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block">Registered Officers / Directors</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedRecord.directors.map((dir: string) => (
                        <span key={dir} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white font-medium">
                          {dir}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end pt-3 border-t border-white/5">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
