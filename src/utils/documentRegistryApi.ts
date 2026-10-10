export type RegistryStatus = 'ACTIVE' | 'REVOKED';
export type VerificationOutcome = 'VERIFIED' | 'TAMPERED' | 'UNVERIFIED' | 'REVOKED' | 'EXPIRED';

export interface RegistryDocument {
  document_id: string;
  public_verification_id: string;
  title: string;
  document_type: string;
  recipient_name: string | null;
  recipient_identifier: string | null;
  original_filename: string;
  sha256_hash: string;
  signature_algorithm: string;
  signature_value: string;
  signing_key_id: string;
  signing_public_key: string;
  status: RegistryStatus;
  issue_date: string;
  issued_at: string;
  expires_at: string | null;
  revoked_at: string | null;
  revocation_reason?: string | null;
  version: number;
}

export interface RegistryDocumentDetail extends RegistryDocument {
  recipient_email: string | null;
  issuer_notes: string | null;
  verification_url: string;
  qr_code_data_url: string;
  hash_matches: boolean | null;
  signature_valid: boolean | null;
}

export interface IssuerRegistryDocument extends RegistryDocument {
  recipient_email: string | null;
}

export interface RegistryDocumentList<TDocument extends RegistryDocument = RegistryDocument> {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  items: TDocument[];
}

export interface AdminRegistryDocument extends RegistryDocument {
  organization_id: number;
  organization_name: string;
  issuer_user_id: number;
  issuer_name: string | null;
}

export interface AdminRegistryDocumentList extends RegistryDocumentList<AdminRegistryDocument> {
  active_count: number;
  revoked_count: number;
}

export interface PublicVerificationResult {
  public_verification_id: string;
  outcome: VerificationOutcome;
  title: string | null;
  issuer_name: string | null;
  document_type: string | null;
  issue_date: string | null;
  issued_at: string | null;
  expires_at: string | null;
  registry_status: RegistryStatus | null;
  sha256_hash: string | null;
  hash_matches: boolean | null;
  signature_valid: boolean | null;
  field_comparisons?: Array<{
    field_name: string;
    registered_value: string;
    observed_value: string;
    status: 'MATCH' | 'MISMATCH' | 'SUSPICIOUS' | 'NOT_CHECKED' | 'UNAVAILABLE';
    confidence: number;
    comparison_rule: string;
    evidence: string;
  }>;
  ocr_extracted_fields?: Record<string, any>;
  tamper_reasons?: string[];
}

export interface ForensicAnalysis {
  id: number;
  document_id: string;
  model_version: string;
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  features: Record<string, unknown>;
  reason_codes: string[];
  ml_signals: Record<string, Record<string, unknown>>;
  hash_matches: boolean | null;
  signature_valid: boolean | null;
  created_at: string;
}

export interface ForensicAnalysisHistory {
  document_id: string;
  total: number;
  items: ForensicAnalysis[];
}

export interface ForensicModelRegistry {
  models: Array<{
    model_id: string;
    algorithm: string;
    version: string;
    feature_names: string[];
    metrics: Record<string, unknown>;
    created_at: string;
  }>;
  active_model_ids: Record<string, string | null>;
}

export interface DocumentHistoryEvent {
  id: number;
  event_type: string;
  actor_id: number | null;
  actor_name: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
}

export interface DocumentHistoryResponse {
  document_id: string;
  events: DocumentHistoryEvent[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface IssuerDocumentView {
  id: string;
  title: string;
  recipientName: string;
  recipientId: string;
  recipientEmail: string;
  issuerId: string;
  issuerName: string;
  issuerOrg: string;
  issueDate: string;
  expiryDate?: string;
  documentType: string;
  status: 'active' | 'revoked';
  sha256Hash: string;
  ecdsaSignature: string;
  publicKey: string;
  qrPayload: string;
  verificationCount: number;
  revocationReason?: string;
  revokedAt?: string;
  version: number;
}

export function toIssuerDocumentView(record: IssuerRegistryDocument, issuerName: string, issuerOrg: string, issuerId: string): IssuerDocumentView {
  return {
    id: record.document_id,
    title: record.title,
    recipientName: record.recipient_name || '',
    recipientId: record.recipient_identifier || '',
    recipientEmail: record.recipient_email || '',
    issuerId,
    issuerName,
    issuerOrg,
    issueDate: record.issue_date,
    expiryDate: record.expires_at?.slice(0, 10),
    documentType: record.document_type,
    status: record.status === 'REVOKED' ? 'revoked' : 'active',
    sha256Hash: record.sha256_hash,
    ecdsaSignature: record.signature_value,
    publicKey: record.signing_public_key,
    qrPayload: `${window.location.origin}/verify/${record.public_verification_id}`,
    verificationCount: 0,
    revocationReason: record.revocation_reason || undefined,
    revokedAt: record.revoked_at || undefined,
    version: record.version,
  };
}

const ACCESS_TOKEN_KEY = 'veriproof_access_token';
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

function apiUrl(path: string): string {
  return `${API_BASE_URL}/api/v1${path.startsWith('/') ? path : `/${path}`}`;
}

function errorMessage(body: unknown, statusText: string): string {
  if (body && typeof body === 'object' && 'detail' in body) {
    const detail = (body as { detail: unknown }).detail;
    return typeof detail === 'string' ? detail : JSON.stringify(detail);
  }
  return statusText || 'The VeriProof API request failed.';
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(apiUrl(path), { ...options, headers });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(errorMessage(body, response.statusText));
  return body as T;
}

export async function apiBlob(path: string): Promise<Blob> {
  const headers = new Headers();
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(apiUrl(path), { headers });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(errorMessage(body, response.statusText));
  }
  return response.blob();
}

export function createForensicAnalysis(documentId: string): Promise<ForensicAnalysis> {
  return apiRequest(`/documents/${encodeURIComponent(documentId)}/forensic-analysis`, { method: 'POST' });
}

export function getForensicAnalysisHistory(documentId: string): Promise<ForensicAnalysisHistory> {
  return apiRequest(`/documents/${encodeURIComponent(documentId)}/forensic-analysis`);
}

export function getForensicModelRegistry(): Promise<ForensicModelRegistry> {
  return apiRequest('/forensics/models');
}

// ==========================================
// Bulk Operations Types & API Client Methods
// ==========================================

export interface BulkValidationItemPreview {
  filename: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
  title?: string;
  document_type?: string;
  recipient_name?: string;
  recipient_email?: string;
  recipient_identifier?: string;
  issue_date?: string;
  expires_at?: string;
}

export interface BulkValidationPreviewResponse {
  total_items: number;
  valid_items: number;
  invalid_items: number;
  items: BulkValidationItemPreview[];
  global_errors: string[];
}

export interface BulkBatchCreateResponse {
  batch_id: string;
  batch_type: 'REGISTRATION' | 'VERIFICATION';
  status: 'QUEUED' | 'VALIDATING' | 'PROCESSING' | 'COMPLETED' | 'COMPLETED_WITH_ERRORS' | 'FAILED' | 'CANCELLED';
  total_items: number;
  created_at: string;
  message: string;
}

export interface BulkBatchStatusResponse {
  batch_id: string;
  batch_type: 'REGISTRATION' | 'VERIFICATION';
  status: 'QUEUED' | 'VALIDATING' | 'PROCESSING' | 'COMPLETED' | 'COMPLETED_WITH_ERRORS' | 'FAILED' | 'CANCELLED';
  total_items: number;
  processed_items: number;
  successful_items: number;
  failed_items: number;
  progress_percentage: number;
  error_summary: Record<string, number>;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  total_duration_seconds: number | null;
  estimated_remaining_seconds: number | null;
  manifest_csv_filename: string | null;
  archive_filename: string | null;
}

export interface BulkBatchItemDetail {
  item_id: string;
  batch_id: string;
  item_index: number;
  original_filename: string;
  file_size_bytes: number;
  sha256_hash: string | null;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'RETRY_ELIGIBLE' | 'CANCELLED';
  error_code: string | null;
  error_message: string | null;
  document_id: string | null;
  public_verification_id: string | null;
  verification_outcome: 'VERIFIED' | 'TAMPERED' | 'UNVERIFIED' | 'REVOKED' | 'EXPIRED' | null;
  ml_risk_score: number | null;
  ml_risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null;
  ml_reasons: string[] | null;
  retry_count: number;
  started_at: string | null;
  completed_at: string | null;
}

export interface BulkBatchItemListResponse {
  batch_id: string;
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  items: BulkBatchItemDetail[];
}

export interface BulkBatchListItem {
  batch_id: string;
  batch_type: 'REGISTRATION' | 'VERIFICATION';
  status: 'QUEUED' | 'VALIDATING' | 'PROCESSING' | 'COMPLETED' | 'COMPLETED_WITH_ERRORS' | 'FAILED' | 'CANCELLED';
  total_items: number;
  processed_items: number;
  successful_items: number;
  failed_items: number;
  progress_percentage: number;
  created_at: string;
  completed_at: string | null;
}

export interface BulkBatchListResponse {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  batches: BulkBatchListItem[];
}

export interface BulkRetryResponse {
  batch_id: string;
  retried_item_count: number;
  status: string;
  message: string;
}

export interface BulkCancelResponse {
  batch_id: string;
  status: string;
  cancelled_item_count: number;
  message: string;
}

export async function validateBulkRegistration(manifestFile: File, archiveFile?: File): Promise<BulkValidationPreviewResponse> {
  const formData = new FormData();
  formData.append('manifest_file', manifestFile);
  if (archiveFile) {
    formData.append('archive_file', archiveFile);
  }
  return apiRequest<BulkValidationPreviewResponse>('/bulk/validate-registration', {
    method: 'POST',
    body: formData,
  });
}

export async function createBulkRegistrationBatch(manifestFile: File, archiveFile: File): Promise<BulkBatchCreateResponse> {
  const formData = new FormData();
  formData.append('manifest_file', manifestFile);
  formData.append('archive_file', archiveFile);
  return apiRequest<BulkBatchCreateResponse>('/bulk/register', {
    method: 'POST',
    body: formData,
  });
}

export async function createBulkVerificationBatch(options: {
  archiveFile?: File;
  manifestFile?: File;
  files?: File[];
}): Promise<BulkBatchCreateResponse> {
  const formData = new FormData();
  if (options.archiveFile) {
    formData.append('archive_file', options.archiveFile);
  }
  if (options.manifestFile) {
    formData.append('manifest_file', options.manifestFile);
  }
  if (options.files && options.files.length > 0) {
    for (const f of options.files) {
      formData.append('files', f);
    }
  }
  return apiRequest<BulkBatchCreateResponse>('/bulk/verify', {
    method: 'POST',
    body: formData,
  });
}

export async function getBulkBatchStatus(batchId: string): Promise<BulkBatchStatusResponse> {
  return apiRequest<BulkBatchStatusResponse>(`/bulk/batches/${encodeURIComponent(batchId)}`);
}

export async function getBulkBatchItems(
  batchId: string,
  options: { page?: number; limit?: number; status?: string; search?: string } = {}
): Promise<BulkBatchItemListResponse> {
  const params = new URLSearchParams();
  if (options.page) params.set('page', String(options.page));
  if (options.limit) params.set('limit', String(options.limit));
  if (options.status) params.set('status', options.status);
  if (options.search) params.set('search', options.search);
  const qs = params.toString() ? `?${params.toString()}` : '';
  return apiRequest<BulkBatchItemListResponse>(`/bulk/batches/${encodeURIComponent(batchId)}/items${qs}`);
}

export async function getBulkBatches(
  options: { batch_type?: string; status?: string; page?: number; limit?: number } = {}
): Promise<BulkBatchListResponse> {
  const params = new URLSearchParams();
  if (options.batch_type) params.set('batch_type', options.batch_type);
  if (options.status) params.set('status', options.status);
  if (options.page) params.set('page', String(options.page));
  if (options.limit) params.set('limit', String(options.limit));
  const qs = params.toString() ? `?${params.toString()}` : '';
  return apiRequest<BulkBatchListResponse>(`/bulk/batches${qs}`);
}

export async function retryBulkBatch(batchId: string): Promise<BulkRetryResponse> {
  return apiRequest<BulkRetryResponse>(`/bulk/batches/${encodeURIComponent(batchId)}/retry`, {
    method: 'POST',
  });
}

export async function cancelBulkBatch(batchId: string): Promise<BulkCancelResponse> {
  return apiRequest<BulkCancelResponse>(`/bulk/batches/${encodeURIComponent(batchId)}/cancel`, {
    method: 'POST',
  });
}

export async function exportBulkBatchCsv(batchId: string): Promise<Blob> {
  return apiBlob(`/bulk/batches/${encodeURIComponent(batchId)}/export`);
}

export interface DocumentEmailDispatchResponse {
  status: string;
  document_id: string;
  public_verification_id: string;
  recipient_email: string;
  provider_message_id: string;
  timestamp: string;
  details?: string;
  is_test_mode?: boolean;
}

export interface QRDecodeResult {
  success: boolean;
  raw_text?: string | null;
  verification_url?: string | null;
  public_verification_id?: string | null;
  is_trusted_domain: boolean;
  page_index?: number | null;
  confidence: number;
  error?: string | null;
}

export interface ScanCalibrationResult {
  total_scenarios: number;
  passed_scenarios: number;
  failed_scenarios: number;
  recovery_rate_percent: number;
  reference_url: string;
  recommended_minimum_print_size_mm: string;
  recommended_minimum_scan_dpi: number;
  scenarios: Array<{
    scenario_name: string;
    parameters: Record<string, unknown>;
    decoded_successfully: boolean;
    recovered_url?: string | null;
    public_id?: string | null;
    is_trusted_domain: boolean;
    latency_ms: number;
  }>;
  status: string;
}

export async function sendDocumentEmail(
  documentId: string,
  recipientEmail?: string,
  customMessage?: string
): Promise<DocumentEmailDispatchResponse> {
  return apiRequest<DocumentEmailDispatchResponse>(`/documents/${encodeURIComponent(documentId)}/send-email`, {
    method: 'POST',
    body: JSON.stringify({
      recipient_email: recipientEmail || undefined,
      custom_message: customMessage || undefined,
    }),
  });
}

export async function decodeQrCode(file: File): Promise<QRDecodeResult> {
  const formData = new FormData();
  formData.append('file', file);
  return apiRequest<QRDecodeResult>('/documents/decode-qr', {
    method: 'POST',
    body: formData,
  });
}

export function getTrustedDocumentPreviewUrl(publicVerificationId: string): string {
  return apiUrl(`/verify/${encodeURIComponent(publicVerificationId)}/preview`);
}

export async function comparePublicDocument(
  publicVerificationId: string,
  file: File
): Promise<PublicVerificationResult> {
  const formData = new FormData();
  formData.append('file', file);
  return apiRequest<PublicVerificationResult>(`/verify/${encodeURIComponent(publicVerificationId)}/compare`, {
    method: 'POST',
    body: formData,
  });
}


