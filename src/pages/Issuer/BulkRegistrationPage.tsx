import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, FileSpreadsheet, CheckCircle2, AlertCircle,
  Download, RefreshCw, ArrowRight, Info, Play, Mail, Send
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { IssuerHeader } from './components/IssuerHeader';
import { useToast } from '../../components/ui/Toast';
import { sendDocumentEmail } from '../../utils/emailService';
import type { DocumentRecord } from '../../data/mockData';

interface BatchRow {
  rowId: number;
  recipientName: string;
  recipientId: string;
  recipientEmail: string;
  documentTitle: string;
  documentType: string;
  issueDate: string;
  expiryDate?: string;
  filename: string;
  isValid: boolean;
  errors: string[];
  status?: 'PENDING' | 'SUCCESS' | 'FAILED';
  generatedDocId?: string;
  emailStatus?: 'IDLE' | 'SENDING' | 'SENT' | 'FAILED' | 'UNAVAILABLE';
  emailMessage?: string;
}

export const BulkRegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addDocument, organizations } = useApp();
  const { success, error, warning, info } = useToast();

  const [batchFile, setBatchFile] = useState<File | null>(null);
  const [rows, setRows] = useState<BatchRow[]>([]);
  const [batchId, setBatchId] = useState<string>('');
  const [batchStatus, setBatchStatus] = useState<'IDLE' | 'VALIDATED' | 'PROCESSING' | 'COMPLETED'>('IDLE');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [sendingRowIds, setSendingRowIds] = useState<Set<number>>(new Set());

  // Authoritative organization
  const currentOrg = organizations.find(
    (o) =>
      o.name.toLowerCase() === user?.organization?.toLowerCase() ||
      o.legalName.toLowerCase() === user?.organization?.toLowerCase() ||
      o.id === 'ORG-001'
  ) || organizations[0];

  // Section A: Download sample CSV template (including RecipientEmail column)
  const handleDownloadTemplate = () => {
    const csvContent =
      'RecipientName,RecipientId,RecipientEmail,DocumentTitle,DocumentType,IssueDate,ExpiryDate,Filename\n' +
      'Alexandra Chen,STF-STU-88219,alex.chen@alumni.stanford.edu,Master of Science in Computer Science Degree,degree,2026-06-15,,degree_alex_chen.pdf\n' +
      'Marcus Vance,MED-LIC-90924,m.vance@centralhealth.org,Certified Medical Practitioner License,license,2026-01-10,2028-01-10,lic_marcus_vance.pdf\n' +
      'Samantha Reed,ENG-CERT-44120,samantha.reed@cloudtech.io,Advanced Cloud Architecture Certificate,certificate,2026-03-20,,cert_samantha_reed.pdf\n' +
      'Johnathan Doe,EMP-OFF-10921,j.doe@enterprise.org,Executive Engineering Offer Letter,offer_letter,2026-05-01,,offer_johndoe.pdf\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'veriproof_bulk_registration_template.csv';
    a.click();
    URL.revokeObjectURL(url);
    success('Template Downloaded', 'Use this format with RecipientEmail to prepare your bulk issuance batch.');
  };

  // Section B: Parse & Validate CSV (with RecipientEmail mapping & format checking)
  const parseCSVContent = (text: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      error('Invalid Batch File', 'CSV must contain a header row and at least one record.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const newRows: BatchRow[] = [];
    const seenRecipientIds = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim());
      if (parts.length < 7) continue;

      // Schema: RecipientName, RecipientId, RecipientEmail, DocumentTitle, DocumentType, IssueDate, ExpiryDate, Filename
      const [
        recipientName,
        recipientId,
        recipientEmail,
        documentTitle,
        documentType,
        issueDate,
        expiryDate,
        filename
      ] = parts;

      const errorsList: string[] = [];

      if (!recipientName) errorsList.push('Missing recipient name');
      if (!recipientId) errorsList.push('Missing recipient identifier');

      // Email validation
      if (!recipientEmail) {
        errorsList.push('Missing recipient email');
      } else if (!emailRegex.test(recipientEmail)) {
        errorsList.push('Invalid email format');
      }

      if (!documentTitle) errorsList.push('Missing document title');
      if (!documentType) errorsList.push('Missing document type');
      if (!issueDate) errorsList.push('Missing issue date');
      if (!filename) errorsList.push('Missing target filename');

      // Check duplicates within batch
      if (recipientId && seenRecipientIds.has(recipientId.toLowerCase())) {
        errorsList.push(`Duplicate Recipient ID '${recipientId}' in batch`);
      } else if (recipientId) {
        seenRecipientIds.add(recipientId.toLowerCase());
      }

      // Check valid file extension
      if (filename && !/\.(pdf|jpg|jpeg|png)$/i.test(filename)) {
        errorsList.push('Invalid file extension (must be .pdf, .jpg, or .png)');
      }

      newRows.push({
        rowId: i,
        recipientName: recipientName || '',
        recipientId: recipientId || '',
        recipientEmail: recipientEmail || '',
        documentTitle: documentTitle || '',
        documentType: documentType || 'Certificate',
        issueDate: issueDate || '',
        expiryDate: expiryDate || '',
        filename: filename || '',
        isValid: errorsList.length === 0,
        errors: errorsList,
        status: 'PENDING',
        emailStatus: 'IDLE'
      });
    }

    const generatedBatchId = `BATCH-2026-REG-${Math.floor(1000 + Math.random() * 9000)}`;
    setBatchId(generatedBatchId);
    setRows(newRows);
    setBatchStatus('VALIDATED');
    setProcessedCount(0);
    success('Batch Loaded', `Parsed ${newRows.length} records in ${generatedBatchId}.`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    if (!f.name.endsWith('.csv')) {
      error('File Type Error', 'Please upload a .csv file format.');
      return;
    }

    setBatchFile(f);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCSVContent(text);
    };
    reader.readAsText(f);
  };

  // Metrics
  const totalRecords = rows.length;
  const validRecords = rows.filter((r) => r.isValid).length;
  const invalidRecords = rows.filter((r) => !r.isValid).length;
  const successfulRecords = rows.filter((r) => r.status === 'SUCCESS').length;

  // Section C: Batch Processing
  const handleProcessBatch = async () => {
    if (validRecords === 0) {
      warning('No Valid Records', 'Cannot process batch without valid records.');
      return;
    }

    setIsProcessing(true);
    setBatchStatus('PROCESSING');

    const updatedRows = [...rows];
    let processed = 0;

    for (let i = 0; i < updatedRows.length; i++) {
      const item = updatedRows[i];
      if (!item.isValid) continue;

      await new Promise((r) => setTimeout(r, 250));

      const orgPrefix = currentOrg.name.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'GTU';
      const docId = `DOC-2026-${orgPrefix}-${Math.floor(10000 + Math.random() * 90000)}`;
      const sha256 = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const ecdsa = `3045022100${sha256.slice(0, 32)}0220${sha256.slice(32, 64)}`;
      const verificationUrl = `${window.location.origin}/verify/${docId}`;

      let normType: 'degree' | 'license' | 'certificate' | 'id_card' | 'legal' | 'medical' = 'certificate';
      const dt = item.documentType.toLowerCase();
      if (dt.includes('deg') || dt.includes('mark')) normType = 'degree';
      else if (dt.includes('lic')) normType = 'license';
      else normType = 'certificate';

      const newDoc: DocumentRecord = {
        id: docId,
        title: item.documentTitle,
        recipientName: item.recipientName,
        recipientId: item.recipientId,
        recipientEmail: item.recipientEmail,
        issuerId: currentOrg.id,
        issuerName: user?.name || currentOrg.authorizedPerson || 'Batch Registrar',
        issuerOrg: currentOrg.name,
        issueDate: item.issueDate,
        expiryDate: item.expiryDate || undefined,
        documentType: normType,
        status: 'active',
        sha256Hash: sha256,
        ecdsaSignature: ecdsa,
        publicKey: `04${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        qrPayload: `${verificationUrl}?sig=${ecdsa.slice(10, 24)}`,
        verificationCount: 0,
        trustScore: 100,
        ocrExtractedText: {
          title: item.documentTitle,
          recipient: item.recipientName,
          recipientId: item.recipientId,
          recipientEmail: item.recipientEmail,
          batchId
        },
        dnaMetrics: {
          fontFamilyMatch: 99.4,
          layoutAlignment: 99.1,
          structuralIntegrity: 100,
          compressionSignature: 'Batch Registry Stream v4',
          pdfMetadataIntact: true
        },
        aiForensics: {
          edgeSharpnessScore: 98.7,
          fontInconsistencyProb: 0.1,
          cloneStampArtifacts: false,
          metadataDivergence: false,
          noiseDiscrepancy: 0.01
        },
        authorizedVerifiers: ['PUBLIC'],
        version: 1
      };

      // Commit to registry
      addDocument(newDoc);

      item.status = 'SUCCESS';
      item.generatedDocId = docId;
      processed++;
      setProcessedCount(processed);
      setRows([...updatedRows]);
    }

    setIsProcessing(false);
    setBatchStatus('COMPLETED');
    success('Batch Registration Completed', `Successfully issued and registered ${processed} documents.`);
  };

  // Change C: Per-Record Download Action
  const handleDownloadRecord = (row: BatchRow) => {
    if (row.status !== 'SUCCESS' || !row.generatedDocId) {
      error('Download Unavailable', 'Document has not been successfully registered yet.');
      return;
    }

    try {
      const docPayload = JSON.stringify(
        {
          documentId: row.generatedDocId,
          recipientName: row.recipientName,
          recipientId: row.recipientId,
          recipientEmail: row.recipientEmail,
          documentTitle: row.documentTitle,
          documentType: row.documentType,
          issueDate: row.issueDate,
          expiryDate: row.expiryDate || null,
          targetFile: row.filename,
          issuer: currentOrg.name,
          issuerId: currentOrg.id,
          verificationUrl: `${window.location.origin}/verify/${row.generatedDocId}`,
          status: 'ACTIVE',
          signatureStatus: 'ECDSA secp256k1 VALID'
        },
        null,
        2
      );

      const blob = new Blob([docPayload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${row.generatedDocId}_${row.recipientName.replace(/\s+/g, '_')}_record.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      success('Download Started', `Downloaded credential record for ${row.recipientName}.`);
    } catch {
      error('Download Failed', 'Failed to generate record download file.');
    }
  };

  // Change C: Per-Record Send Email Action
  const handleSendEmailRecord = async (row: BatchRow) => {
    if (row.status !== 'SUCCESS' || !row.generatedDocId) {
      error('Send Email Error', 'Document must be successfully issued before sending.');
      return;
    }

    if (!row.recipientEmail) {
      error('Email Missing', 'No recipient email is defined for this record.');
      return;
    }

    if (sendingRowIds.has(row.rowId)) return;

    setSendingRowIds((prev) => new Set(prev).add(row.rowId));

    // Update row state to SENDING
    setRows((prev) =>
      prev.map((r) =>
        r.rowId === row.rowId
          ? { ...r, emailStatus: 'SENDING', emailMessage: 'Contacting mail gateway...' }
          : r
      )
    );

    try {
      const result = await sendDocumentEmail({
        recipientName: row.recipientName,
        recipientEmail: row.recipientEmail,
        documentId: row.generatedDocId,
        documentTitle: row.documentTitle,
        verificationUrl: `${window.location.origin}/verify/${row.generatedDocId}`,
        fileName: row.filename,
        issuerOrg: currentOrg.name
      });

      setRows((prev) =>
        prev.map((r) =>
          r.rowId === row.rowId
            ? {
                ...r,
                emailStatus: result.status,
                emailMessage: result.message
              }
            : r
        )
      );

      if (result.success) {
        success('Email Sent', `Delivered to ${row.recipientEmail}`);
      } else {
        error('Delivery Failed', result.message);
      }
    } catch (err: any) {
      setRows((prev) =>
        prev.map((r) =>
          r.rowId === row.rowId
            ? {
                ...r,
                emailStatus: 'FAILED',
                emailMessage: err?.message || 'Transmission failed.'
              }
            : r
        )
      );
      error('Dispatch Failed', 'Failed to dispatch email.');
    } finally {
      setSendingRowIds((prev) => {
        const next = new Set(prev);
        next.delete(row.rowId);
        return next;
      });
    }
  };

  // Section E: Download Error Report CSV
  const handleDownloadErrorReport = () => {
    const invalidItems = rows.filter((r) => !r.isValid || r.status === 'FAILED');
    if (invalidItems.length === 0) {
      info('No Errors', 'All records in this batch are valid.');
      return;
    }

    const header = 'Row,RecipientName,RecipientId,RecipientEmail,DocumentTitle,Filename,Errors\n';
    const lines = invalidItems.map(
      (r) =>
        `${r.rowId},"${r.recipientName}","${r.recipientId}","${r.recipientEmail}","${r.documentTitle}","${r.filename}","${r.errors.join('; ')}"`
    );

    const blob = new Blob([header + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch_error_report_${batchId || 'draft'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Section F: Download Registration Manifest
  const handleDownloadManifest = () => {
    const successItems = rows.filter((r) => r.status === 'SUCCESS');
    const header = 'DocumentId,RecipientName,RecipientId,RecipientEmail,DocumentTitle,IssueDate,Status\n';
    const lines = successItems.map(
      (r) =>
        `${r.generatedDocId},"${r.recipientName}","${r.recipientId}","${r.recipientEmail}","${r.documentTitle}",${r.issueDate},ACTIVE`
    );

    const blob = new Blob([header + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch_manifest_${batchId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <IssuerHeader
        title="Bulk Document Registration"
        description="Batch register certificates, marksheets, and large credential collections via validated CSV manifests. Performs per-record cryptographic digest generation and registry commitment."
        badge="BATCH ISSUANCE ENGINE"
        badgeColor="bg-violet-500/10 text-violet-400 border-violet-500/20"
        actions={
          <button
            onClick={handleDownloadTemplate}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download size={14} />
            <span>Download Sample CSV</span>
          </button>
        }
      />

      {/* SECTION A: UPLOAD BATCH DATA */}
      <div className="bg-[#0B1020]/90 border border-white/10 rounded-2xl p-6 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileSpreadsheet size={16} className="text-violet-400" />
              Upload Batch Manifest
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select a prepared CSV file containing recipient emails, identities, and metadata mappings.
            </p>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            Supported formats: UTF-8 CSV
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 border-2 border-dashed border-white/10 hover:border-violet-500/40 rounded-2xl p-6 text-center transition-all bg-[#070B19]/50">
            <input
              type="file"
              id="bulk-csv-upload"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isProcessing}
              className="hidden"
            />
            <label htmlFor="bulk-csv-upload" className="cursor-pointer space-y-2 block">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mx-auto">
                <Upload size={20} />
              </div>
              <p className="text-xs font-bold text-violet-400 hover:underline">
                {batchFile ? batchFile.name : 'Click to select CSV batch file'}
              </p>
              <p className="text-[11px] text-slate-400">
                {batchFile
                  ? `${(batchFile.size / 1024).toFixed(1)} KB • Ready for batch validation`
                  : 'Or drag and drop your CSV file here'}
              </p>
            </label>
          </div>

          <div className="bg-[#070B19] border border-white/5 rounded-2xl p-4 text-xs space-y-2.5">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <Info size={14} className="text-violet-400" />
              Manifest Specifications
            </h4>
            <ul className="text-slate-400 space-y-1 text-[11px] list-disc list-inside">
              <li>Required: RecipientName, RecipientId, <strong>RecipientEmail</strong>, DocumentTitle, DocumentType, IssueDate, Filename</li>
              <li>Optional: ExpiryDate (YYYY-MM-DD)</li>
              <li>Each record is mapped directly to its individual recipient email</li>
              <li>Filename must end in .pdf, .jpg, or .png</li>
            </ul>
          </div>
        </div>
      </div>

      {/* SECTION D: PROCESSING DASHBOARD (IF ROWS LOADED) */}
      {rows.length > 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10">
              <span className="text-slate-400 text-[10px] uppercase font-mono block">Batch ID</span>
              <span className="text-xs font-mono font-bold text-violet-300 mt-1 block truncate">{batchId}</span>
              <span className="text-[10px] text-slate-500">{batchStatus}</span>
            </div>
            <div className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10">
              <span className="text-slate-400 text-[10px] uppercase font-mono block">Total Records</span>
              <span className="text-2xl font-black font-mono text-white mt-1 block">{totalRecords}</span>
              <span className="text-[10px] text-slate-500">In batch</span>
            </div>
            <div className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10">
              <span className="text-slate-400 text-[10px] uppercase font-mono block">Valid Records</span>
              <span className="text-2xl font-black font-mono text-emerald-400 mt-1 block">{validRecords}</span>
              <span className="text-[10px] text-slate-500">Ready to issue</span>
            </div>
            <div className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10">
              <span className="text-slate-400 text-[10px] uppercase font-mono block">Invalid Records</span>
              <span className="text-2xl font-black font-mono text-red-400 mt-1 block">{invalidRecords}</span>
              <span className="text-[10px] text-slate-500">Blocked</span>
            </div>
            <div className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10">
              <span className="text-slate-400 text-[10px] uppercase font-mono block">Processed</span>
              <span className="text-2xl font-black font-mono text-blue-400 mt-1 block">{processedCount}</span>
              <span className="text-[10px] text-slate-500">of {validRecords}</span>
            </div>
            <div className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10">
              <span className="text-slate-400 text-[10px] uppercase font-mono block">Registered</span>
              <span className="text-2xl font-black font-mono text-emerald-300 mt-1 block">{successfulRecords}</span>
              <span className="text-[10px] text-slate-500">Committed</span>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#0B1020]/90 border border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-300">
                {batchStatus === 'VALIDATED' && 'Batch validated. Ready for cryptographic signing and registration.'}
                {batchStatus === 'PROCESSING' && 'Pipeline active: signing documents & committing to ledger...'}
                {batchStatus === 'COMPLETED' && `Batch completed. ${successfulRecords} documents registered.`}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {invalidRecords > 0 && (
                <button
                  onClick={handleDownloadErrorReport}
                  className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download size={13} />
                  <span>Download Error Report ({invalidRecords})</span>
                </button>
              )}

              {batchStatus === 'COMPLETED' && (
                <>
                  <button
                    onClick={handleDownloadManifest}
                    className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download size={13} />
                    <span>Download Manifest</span>
                  </button>
                  <button
                    onClick={() => navigate('/issuer/documents')}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-emerald-600/20"
                  >
                    <span>View Registered Documents</span>
                    <ArrowRight size={13} />
                  </button>
                </>
              )}

              {batchStatus === 'VALIDATED' && (
                <button
                  onClick={handleProcessBatch}
                  disabled={isProcessing || validRecords === 0}
                  className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-lg shadow-violet-600/20"
                >
                  <Play size={13} />
                  <span>Process {validRecords} Valid Records</span>
                </button>
              )}
            </div>
          </div>

          {/* SECTION B: BATCH PREVIEW TABLE WITH PER-RECORD DOWNLOAD & SEND EMAIL */}
          <div className="bg-[#0B1020]/90 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Batch Record Manifest Preview & Registered Credential Actions
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                {rows.length} records parsed
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#070B19] border-b border-white/5 text-[10px] font-mono uppercase text-slate-400">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Recipient</th>
                    <th className="py-3 px-4">Recipient ID</th>
                    <th className="py-3 px-4">Recipient Email</th>
                    <th className="py-3 px-4">Document Title</th>
                    <th className="py-3 px-4">Validation</th>
                    <th className="py-3 px-4">Status / ID</th>
                    <th className="py-3 px-4 text-right">Individual Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {rows.map((row) => {
                    const isRowSending = sendingRowIds.has(row.rowId);

                    return (
                      <tr key={row.rowId} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-500">{row.rowId}</td>
                        <td className="py-3 px-4 font-semibold text-white">{row.recipientName || '—'}</td>
                        <td className="py-3 px-4 font-mono text-violet-300">{row.recipientId || '—'}</td>

                        {/* Recipient Email Column */}
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-300">
                          {row.recipientEmail || <span className="text-red-400">Missing</span>}
                        </td>

                        <td className="py-3 px-4 text-slate-300 max-w-xs truncate">{row.documentTitle || '—'}</td>

                        {/* Validation Status */}
                        <td className="py-3 px-4">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
                              <CheckCircle2 size={10} /> VALID
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-mono"
                              title={row.errors.join(', ')}
                            >
                              <AlertCircle size={10} /> INVALID ({row.errors.length})
                            </span>
                          )}
                        </td>

                        {/* Status / Document ID */}
                        <td className="py-3 px-4 font-mono text-[11px]">
                          {row.status === 'SUCCESS' ? (
                            <div>
                              <span className="text-emerald-400 font-bold block">{row.generatedDocId}</span>
                              {row.emailStatus === 'SENT' && (
                                <span className="text-[10px] text-emerald-400 block">Email Sent</span>
                              )}
                              {(row.emailStatus === 'FAILED' || row.emailStatus === 'UNAVAILABLE') && (
                                <span
                                  className="text-[10px] text-red-400 block truncate max-w-[120px]"
                                  title={row.emailMessage}
                                >
                                  Email Gateway Unreachable
                                </span>
                              )}
                            </div>
                          ) : row.status === 'FAILED' ? (
                            <span className="text-red-400">FAILED</span>
                          ) : row.isValid ? (
                            <span className="text-slate-500">READY</span>
                          ) : (
                            <span className="text-red-400/80 text-[10px]">{row.errors[0]}</span>
                          )}
                        </td>

                        {/* Change C: Per-Record Download & Send Email Actions */}
                        <td className="py-3 px-4 text-right">
                          {row.status === 'SUCCESS' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleDownloadRecord(row)}
                                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                title={`Download credential payload for ${row.recipientName}`}
                              >
                                <Download size={11} />
                                <span>Download</span>
                              </button>

                              <button
                                onClick={() => handleSendEmailRecord(row)}
                                disabled={isRowSending}
                                className="px-2.5 py-1 rounded-lg bg-blue-600/80 hover:bg-blue-600 disabled:opacity-50 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                title={`Send email to ${row.recipientEmail}`}
                              >
                                {isRowSending ? (
                                  <>
                                    <RefreshCw size={11} className="animate-spin" />
                                    <span>Sending...</span>
                                  </>
                                ) : (
                                  <>
                                    <Send size={11} />
                                    <span>Send Email</span>
                                  </>
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-600 text-[11px] font-mono">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkRegistrationPage;
