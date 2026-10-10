// ============================================================
// VERIPROOF — Enterprise Data Types & Dynamic Production Layer
// ============================================================

export interface DocumentRecord {
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
  documentType: 'degree' | 'license' | 'certificate' | 'id_card' | 'legal' | 'medical';
  status: 'active' | 'revoked' | 'suspended';
  sha256Hash: string;
  ecdsaSignature: string;
  publicKey: string;
  qrPayload: string;
  verificationCount: number;
  lastVerified?: string;
  trustScore: number;
  ocrExtractedText: Record<string, string>;
  dnaMetrics: {
    fontFamilyMatch: number; // %
    layoutAlignment: number; // %
    structuralIntegrity: number; // %
    compressionSignature: string;
    pdfMetadataIntact: boolean;
  };
  tamperZones?: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    field: string;
    detectedAnomaly: string;
    confidence: number;
  }>;
  aiForensics: {
    edgeSharpnessScore: number;
    fontInconsistencyProb: number;
    cloneStampArtifacts: boolean;
    metadataDivergence: boolean;
    noiseDiscrepancy: number;
  };
  authorizedVerifiers: string[]; // org ids or ['PUBLIC']
  revocationReason?: string;
  revokedAt?: string;
  version: number;
  previousVersionId?: string;
}

export interface OrganizationRecord {
  id: string;
  name: string;
  legalName: string;
  type: 'University' | 'Enterprise' | 'Government' | 'Healthcare' | 'Financial';
  registrationNumber: string;
  gstinTaxId: string;
  officialDomain: string;
  officialEmail: string;
  authorizedPerson: string;
  authorizedRole: string;
  kycStatus: 'APPROVED' | 'PENDING' | 'REJECTED' | 'MANUAL_REVIEW';
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  joinedDate: string;
  documentsIssuedCount: number;
  documentsVerifiedCount: number;
  trustRating: number;
  kycDocumentUrl?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
}

export interface RegistryEntry {
  registrationNumber: string;
  orgName: string;
  jurisdiction: string;
  type: string;
  status: 'ACTIVE' | 'DISSOLVED' | 'SUSPENDED';
  incorporationDate: string;
  officialDomain: string;
  authorizedDirectors: string[];
}

export interface SecurityEventRecord {
  id: string;
  timestamp: string;
  type: 'INVALID_SIGNATURE' | 'HASH_MISMATCH' | 'UNAUTHORIZED_ACCESS' | 'REVOKED_PRESENTATION' | 'SUSPICIOUS_OCR';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  documentId?: string;
  ipAddress: string;
  actor: string;
  organization: string;
  details: string;
  status: 'ACTIVE' | 'RESOLVED' | 'INVESTIGATING';
}

export interface AuditLogRecord {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: string;
  actorId: string;
  action: string;
  entityType: 'DOCUMENT' | 'ORGANIZATION' | 'USER' | 'REGISTRY' | 'SECURITY';
  entityId: string;
  details: string;
  tamperHash: string;
}

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  organization: string;
  role: 'SUPER ADMIN' | 'ISSUER' | 'VERIFIER';
  accountStatus: 'ACTIVE' | 'SUSPENDED' | 'REVOKED';
  registrationDate: string;
  lastLogin: string;
  lastActivity: string;
  department: string;
  documentsIssuedCount?: number;
  verificationCount?: number;
  successfulVerifications?: number;
  failedVerifications?: number;
  permissions?: string[];
}

export interface SystemSettingsRecord {
  platformName: string;
  logoUrl: string;
  platformDescription: string;
  supportEmail: string;
  supportContact: string;
  defaultLanguage: string;
  timeZone: string;
  passwordPolicy: string;
  minPasswordLength: number;
  sessionTimeout: number; // minutes
  maxLoginAttempts: number;
  accountLockoutDuration: number; // minutes
  mfaEnforced: boolean;
  securityAlertThreshold: string;
  verificationRules: string;
  trustScoreThreshold: number;
  hashValidationRequired: boolean;
  digitalSignatureRequired: boolean;
  qrValidationRequired: boolean;
  manualReviewThreshold: number;
  suspiciousDocumentThreshold: number;
  allowedDocumentTypes: string[];
  maxFileSizeMb: number;
  supportedFormats: string[];
  documentRetentionPolicy: string;
  defaultDocumentStatus: string;
  kycNotifications: boolean;
  securityAlerts: boolean;
  documentAlerts: boolean;
  userNotifications: boolean;
  emailNotifications: boolean;
}

export interface VerificationHistoryRecord {
  verificationId: string;
  documentId: string;
  documentTitle: string;
  documentType: string;
  issuerOrg: string;
  issuerId: string;
  recipientName: string;
  verificationDate: string;
  result: 'VERIFIED' | 'TAMPERED' | 'UNVERIFIED' | 'SUSPICIOUS';
  trustScore: number;
  method: 'QR' | 'Upload' | 'Link' | 'Bulk';
  reasons: string[];
  evidenceDetails: {
    issuerStatus: 'VERIFIED' | 'NOT_FOUND' | 'SUSPENDED';
    registryStatus: 'ACTIVE' | 'NOT_FOUND' | 'REVOKED';
    hashStatus: 'MATCH' | 'MISMATCH' | 'NOT_AVAILABLE';
    signatureStatus: 'VALID' | 'INVALID' | 'NOT_AVAILABLE';
    ocrMatch: boolean;
    metadataStatus: 'NORMAL' | 'WARNING' | 'ANOMALY';
    visualStatus: 'NORMAL' | 'WARNING' | 'ANOMALY';
    aiForensicRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  submittedHash?: string;
  trustedHash?: string;
  tamperHighlights?: string[];
}

// ─── EMPTY INITIAL DATASETS (Real Data Populated From Backend API / Database) ────

export const INITIAL_DOCUMENTS: DocumentRecord[] = [];
export const INITIAL_ORGANIZATIONS: OrganizationRecord[] = [];
export const INITIAL_REGISTRY: RegistryEntry[] = [];
export const INITIAL_SECURITY_EVENTS: SecurityEventRecord[] = [];
export const INITIAL_AUDIT_LOGS: AuditLogRecord[] = [];
export const INITIAL_ADMIN_USERS: AdminUserRecord[] = [];
export const INITIAL_VERIFICATIONS: VerificationHistoryRecord[] = [];

export const DEMO_USERS = [
  {
    id: 'USR-001',
    name: 'Alice Admin',
    email: 'admin@veriproof.io',
    role: 'super_admin' as const,
    organization: 'VeriProof Platform Authority',
    avatar: 'A',
    department: 'Platform Governance & Cryptographic Security',
    lastActive: 'Just now',
    status: 'active' as const
  },
  {
    id: 'USR-002',
    name: 'Bob Issuer',
    email: 'bob@techuniv.edu',
    role: 'issuer' as const,
    organization: 'Global Tech University',
    avatar: 'B',
    department: 'Registrar & Credential Issuance Office',
    lastActive: 'Just now',
    status: 'active' as const
  },
  {
    id: 'USR-003',
    name: 'Charlie Verifier',
    email: 'charlie@apexcorp.com',
    role: 'verifier' as const,
    organization: 'Apex Corp',
    avatar: 'C',
    department: 'Background Screening & Fraud Prevention',
    lastActive: 'Just now',
    status: 'active' as const
  }
];

export const INITIAL_SYSTEM_SETTINGS: SystemSettingsRecord = {
  platformName: 'VeriProof Enterprise Ledger',
  logoUrl: '/brand/veriproof-logo.svg',
  platformDescription: 'Authoritative Cryptographic Credential Issuance and Forensic Verification Platform',
  supportEmail: 'security-governance@veriproof.io',
  supportContact: '+1 (800) 555-PROOF',
  defaultLanguage: 'English (US)',
  timeZone: 'UTC (Coordinated Universal Time)',
  passwordPolicy: 'High Security (12+ chars, uppercase, lowercase, numbers, symbols)',
  minPasswordLength: 12,
  sessionTimeout: 30,
  maxLoginAttempts: 5,
  accountLockoutDuration: 15,
  mfaEnforced: true,
  securityAlertThreshold: 'IMMEDIATE',
  verificationRules: 'Multi-Signal Cryptographic Consensus (Hash + ECDSA + DNA + OCR)',
  trustScoreThreshold: 85,
  hashValidationRequired: true,
  digitalSignatureRequired: true,
  qrValidationRequired: true,
  manualReviewThreshold: 75,
  suspiciousDocumentThreshold: 50,
  allowedDocumentTypes: ['Degree / Diploma', 'Professional License', 'Identity Document', 'Compliance Certificate', 'Legal Affidavit', 'Medical Credential'],
  maxFileSizeMb: 25,
  supportedFormats: ['PDF (ISO 32000-2)', 'PNG', 'JPEG', 'JSON-LD'],
  documentRetentionPolicy: 'Permanent Cryptographic Audit Retention (7 Years Minimal Ledger State)',
  defaultDocumentStatus: 'ACTIVE',
  kycNotifications: true,
  securityAlerts: true,
  documentAlerts: true,
  userNotifications: true,
  emailNotifications: true,
};
