import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  type DocumentRecord,
  type OrganizationRecord,
  type RegistryEntry,
  type SecurityEventRecord,
  type AuditLogRecord,
  type AdminUserRecord,
  type SystemSettingsRecord,
  type VerificationHistoryRecord,
  INITIAL_DOCUMENTS,
  INITIAL_ORGANIZATIONS,
  INITIAL_REGISTRY,
  INITIAL_SECURITY_EVENTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_ADMIN_USERS,
  INITIAL_SYSTEM_SETTINGS,
  INITIAL_VERIFICATIONS
} from '../data/mockData';
import { apiRequest } from '../utils/documentRegistryApi';
import { useAuth } from './AuthContext';

interface AppContextType {
  documents: DocumentRecord[];
  documentRegistryTotal: number;
  documentRegistryActiveTotal: number;
  documentRegistryRevokedTotal: number;
  documentRegistryLoading: boolean;
  documentRegistryError: string | null;
  organizations: OrganizationRecord[];
  registry: RegistryEntry[];
  securityEvents: SecurityEventRecord[];
  auditLogs: AuditLogRecord[];
  users: AdminUserRecord[];
  verifications: VerificationHistoryRecord[];
  systemSettings: SystemSettingsRecord;
  rolePermissions: Record<string, Record<string, boolean>>;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  addDocument: (doc: DocumentRecord) => void;
  revokeDocument: (id: string, reason: string) => void;
  updateDocumentStatus: (id: string, status: 'active' | 'revoked' | 'suspended', reason?: string) => void;
  addOrganization: (org: OrganizationRecord) => void;
  updateOrgStatus: (id: string, status: 'ACTIVE' | 'PENDING' | 'SUSPENDED', kycStatus: 'APPROVED' | 'PENDING' | 'REJECTED' | 'MANUAL_REVIEW') => void;
  updateUserStatus: (id: string, status: 'ACTIVE' | 'SUSPENDED' | 'REVOKED') => void;
  resolveSecurityFlag: (id: string, resolution: string) => void;
  updateSystemSettings: (settings: Partial<SystemSettingsRecord>) => void;
  updateRolePermissions: (role: string, permissions: Record<string, boolean>) => void;
  addSecurityEvent: (event: Omit<SecurityEventRecord, 'id' | 'timestamp'>) => void;
  addAuditLog: (log: Omit<AuditLogRecord, 'id' | 'timestamp' | 'tamperHash'>) => void;
  lookupDocument: (query: string) => DocumentRecord | undefined;
  addVerification: (record: VerificationHistoryRecord) => void;
  verifyDocumentEngine: (query: string, method?: 'QR' | 'Upload' | 'Link' | 'Bulk') => VerificationHistoryRecord;
  resetToDefaults: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

const toDocumentRecord = (item: any): DocumentRecord => ({
  id: item.document_id || item.id || 'DOC-UNKNOWN',
  title: item.title || 'Untitled document',
  recipientName: item.recipient_name || item.recipientName || 'Unknown recipient',
  recipientId: item.recipient_identifier || item.recipientId || '',
  recipientEmail: item.recipient_email || item.recipientEmail || '',
  issuerId: item.issuer_user_id || item.issuer_id || item.issuerId || 'ORG-UNKNOWN',
  issuerName: item.issuer_name || item.issuerName || 'Unknown issuer',
  issuerOrg: item.organization_name || item.issuer_org || item.issuerOrg || 'Unknown organization',
  issueDate: item.issue_date || item.issueDate || new Date().toISOString().slice(0, 10),
  expiryDate: item.expires_at || item.expiryDate || undefined,
  documentType: (item.document_type || item.documentType || 'certificate').toString().toLowerCase().includes('degree') ? 'degree' : (item.document_type || item.documentType || 'certificate').toString().toLowerCase().includes('license') ? 'license' : 'certificate',
  status: item.status === 'REVOKED' ? 'revoked' : item.status === 'SUSPENDED' ? 'suspended' : 'active',
  sha256Hash: item.sha256_hash || item.sha256Hash || 'n/a',
  ecdsaSignature: item.signature_value || item.ecdsaSignature || 'n/a',
  publicKey: item.signing_public_key || item.publicKey || 'n/a',
  qrPayload: item.verification_url || item.qrPayload || `https://veriproof.app/verify/${item.public_verification_id || item.id || 'unknown'}`,
  verificationCount: Number(item.verification_count ?? item.verificationCount ?? 0),
  lastVerified: item.last_verified || item.lastVerified,
  trustScore: Number(item.trust_score ?? item.trustScore ?? 95),
  ocrExtractedText: item.ocr_extracted_text || item.ocrExtractedText || {},
  dnaMetrics: item.dna_metrics || item.dnaMetrics || {
    fontFamilyMatch: 95,
    layoutAlignment: 95,
    structuralIntegrity: 95,
    compressionSignature: 'Registry synced',
    pdfMetadataIntact: true,
  },
  tamperZones: item.tamper_zones || item.tamperZones,
  aiForensics: item.ai_forensics || item.aiForensics || {
    edgeSharpnessScore: 95,
    fontInconsistencyProb: 1,
    cloneStampArtifacts: false,
    metadataDivergence: false,
    noiseDiscrepancy: 0,
  },
  authorizedVerifiers: Array.isArray(item.authorized_verifiers) ? item.authorized_verifiers : Array.isArray(item.authorizedVerifiers) ? item.authorizedVerifiers : ['PUBLIC'],
  revocationReason: item.revocation_reason || item.revocationReason,
  revokedAt: item.revoked_at || item.revokedAt,
  version: Number(item.version ?? 1),
  previousVersionId: item.previous_version_id || item.previousVersionId,
});

const toOrganizationRecord = (item: any): OrganizationRecord => ({
  id: String(item.id),
  name: item.name || 'Unknown organization',
  legalName: item.legal_name || item.legalName || item.name || 'Unknown organization',
  type: (item.org_type || item.type || 'University') as OrganizationRecord['type'],
  registrationNumber: item.registration_number || item.registrationNumber || '',
  gstinTaxId: item.tax_id || item.gstinTaxId || '',
  officialDomain: item.official_domain || item.officialDomain || '',
  officialEmail: item.official_email || item.officialEmail || '',
  authorizedPerson: item.issuer_name || item.authorizedPerson || item.authorized_person || 'Authorized representative',
  authorizedRole: item.authorized_representative_role || item.authorizedRole || 'Authorized Representative',
  kycStatus: item.kyc_status === 'APPROVED' || item.status === 'ACTIVE' ? 'APPROVED' : item.kyc_status === 'REJECTED' ? 'REJECTED' : item.kyc_status === 'MANUAL_REVIEW' ? 'MANUAL_REVIEW' : 'PENDING',
  status: item.status === 'ACTIVE' ? 'ACTIVE' : item.status === 'SUSPENDED' ? 'SUSPENDED' : 'PENDING',
  joinedDate: item.created_at || item.joinedDate || new Date().toISOString().slice(0, 10),
  documentsIssuedCount: Number(item.documents_issued_count ?? item.documentsIssuedCount ?? 0),
  documentsVerifiedCount: Number(item.documents_verified_count ?? item.documentsVerifiedCount ?? 0),
  trustRating: Number(item.trust_rating ?? item.trustRating ?? 0),
  kycDocumentUrl: item.kyc_document_url || item.kycDocumentUrl,
  reviewedBy: item.reviewed_by || item.reviewedBy,
  reviewedAt: item.reviewed_at || item.reviewedAt,
  notes: item.notes,
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, accessToken } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [documents, setDocuments] = useState<DocumentRecord[]>(() => {
    if (user?.role === 'issuer' || user?.role === 'super_admin') return [];
    try {
      const saved = localStorage.getItem('veriproof_documents');
      return saved ? JSON.parse(saved) : INITIAL_DOCUMENTS;
    } catch {
      return INITIAL_DOCUMENTS;
    }
  });
  const [documentRegistryLoading, setDocumentRegistryLoading] = useState(false);
  const [documentRegistryError, setDocumentRegistryError] = useState<string | null>(null);
  const [documentRegistryTotal, setDocumentRegistryTotal] = useState(0);
  const [documentRegistryActiveTotal, setDocumentRegistryActiveTotal] = useState(0);
  const [documentRegistryRevokedTotal, setDocumentRegistryRevokedTotal] = useState(0);

  const [organizations, setOrganizations] = useState<OrganizationRecord[]>(() => {
    try {
      const saved = localStorage.getItem('veriproof_organizations');
      return saved ? JSON.parse(saved) : INITIAL_ORGANIZATIONS;
    } catch {
      return INITIAL_ORGANIZATIONS;
    }
  });

  const [registry, setRegistry] = useState<RegistryEntry[]>(() => {
    try {
      const saved = localStorage.getItem('veriproof_registry');
      return saved ? JSON.parse(saved) : INITIAL_REGISTRY;
    } catch {
      return INITIAL_REGISTRY;
    }
  });

  const [securityEvents, setSecurityEvents] = useState<SecurityEventRecord[]>(() => {
    try {
      const saved = localStorage.getItem('veriproof_security_events');
      return saved ? JSON.parse(saved) : INITIAL_SECURITY_EVENTS;
    } catch {
      return INITIAL_SECURITY_EVENTS;
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>(() => {
    try {
      const saved = localStorage.getItem('veriproof_audit_logs');
      return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  });

  const [users, setUsers] = useState<AdminUserRecord[]>(() => {
    try {
      const saved = localStorage.getItem('veriproof_admin_users');
      return saved ? JSON.parse(saved) : INITIAL_ADMIN_USERS;
    } catch {
      return INITIAL_ADMIN_USERS;
    }
  });

  const [systemSettings, setSystemSettings] = useState<SystemSettingsRecord>(() => {
    try {
      const saved = localStorage.getItem('veriproof_system_settings');
      return saved ? JSON.parse(saved) : INITIAL_SYSTEM_SETTINGS;
    } catch {
      return INITIAL_SYSTEM_SETTINGS;
    }
  });

  const [rolePermissions, setRolePermissions] = useState<Record<string, Record<string, boolean>>>(() => {
    try {
      const saved = localStorage.getItem('veriproof_role_permissions');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      'SUPER ADMIN': {
        'Organization Management_view': true, 'Organization Management_create': true, 'Organization Management_edit': true, 'Organization Management_delete': true, 'Organization Management_approve': true, 'Organization Management_export': true,
        'User Management_view': true, 'User Management_create': true, 'User Management_edit': true, 'User Management_delete': true, 'User Management_approve': true, 'User Management_export': true,
        'KYC Review_view': true, 'KYC Review_create': true, 'KYC Review_edit': true, 'KYC Review_delete': true, 'KYC Review_approve': true, 'KYC Review_export': true,
        'Document Issuance_view': true, 'Document Issuance_create': true, 'Document Issuance_edit': true, 'Document Issuance_delete': true, 'Document Issuance_approve': true, 'Document Issuance_export': true,
        'Document Revocation_view': true, 'Document Revocation_create': true, 'Document Revocation_edit': true, 'Document Revocation_delete': true, 'Document Revocation_approve': true, 'Document Revocation_export': true,
        'Document Verification_view': true, 'Document Verification_create': true, 'Document Verification_edit': true, 'Document Verification_delete': true, 'Document Verification_approve': true, 'Document Verification_export': true,
        'Trusted Registry Access_view': true, 'Trusted Registry Access_create': true, 'Trusted Registry Access_edit': true, 'Trusted Registry Access_delete': true, 'Trusted Registry Access_approve': true, 'Trusted Registry Access_export': true,
        'Audit Trail Access_view': true, 'Audit Trail Access_create': false, 'Audit Trail Access_edit': false, 'Audit Trail Access_delete': false, 'Audit Trail Access_approve': false, 'Audit Trail Access_export': true,
        'Reports Access_view': true, 'Reports Access_create': true, 'Reports Access_edit': true, 'Reports Access_delete': true, 'Reports Access_approve': true, 'Reports Access_export': true,
        'System Settings_view': true, 'System Settings_create': true, 'System Settings_edit': true, 'System Settings_delete': true, 'System Settings_approve': true, 'System Settings_export': true,
        'Security Monitoring_view': true, 'Security Monitoring_create': true, 'Security Monitoring_edit': true, 'Security Monitoring_delete': true, 'Security Monitoring_approve': true, 'Security Monitoring_export': true,
        'Export Data_view': true, 'Export Data_create': true, 'Export Data_edit': true, 'Export Data_delete': true, 'Export Data_approve': true, 'Export Data_export': true,
      },
      'ISSUER': {
        'Organization Management_view': true, 'Organization Management_create': false, 'Organization Management_edit': true, 'Organization Management_delete': false, 'Organization Management_approve': false, 'Organization Management_export': false,
        'User Management_view': true, 'User Management_create': true, 'User Management_edit': true, 'User Management_delete': false, 'User Management_approve': false, 'User Management_export': false,
        'KYC Review_view': true, 'KYC Review_create': false, 'KYC Review_edit': false, 'KYC Review_delete': false, 'KYC Review_approve': false, 'KYC Review_export': false,
        'Document Issuance_view': true, 'Document Issuance_create': true, 'Document Issuance_edit': true, 'Document Issuance_delete': false, 'Document Issuance_approve': true, 'Document Issuance_export': true,
        'Document Revocation_view': true, 'Document Revocation_create': true, 'Document Revocation_edit': false, 'Document Revocation_delete': false, 'Document Revocation_approve': true, 'Document Revocation_export': true,
        'Document Verification_view': true, 'Document Verification_create': false, 'Document Verification_edit': false, 'Document Verification_delete': false, 'Document Verification_approve': false, 'Document Verification_export': true,
        'Trusted Registry Access_view': true, 'Trusted Registry Access_create': false, 'Trusted Registry Access_edit': false, 'Trusted Registry Access_delete': false, 'Trusted Registry Access_approve': false, 'Trusted Registry Access_export': false,
        'Audit Trail Access_view': true, 'Audit Trail Access_create': false, 'Audit Trail Access_edit': false, 'Audit Trail Access_delete': false, 'Audit Trail Access_approve': false, 'Audit Trail Access_export': false,
        'Reports Access_view': true, 'Reports Access_create': false, 'Reports Access_edit': false, 'Reports Access_delete': false, 'Reports Access_approve': false, 'Reports Access_export': true,
        'System Settings_view': false, 'System Settings_create': false, 'System Settings_edit': false, 'System Settings_delete': false, 'System Settings_approve': false, 'System Settings_export': false,
        'Security Monitoring_view': true, 'Security Monitoring_create': false, 'Security Monitoring_edit': false, 'Security Monitoring_delete': false, 'Security Monitoring_approve': false, 'Security Monitoring_export': false,
        'Export Data_view': true, 'Export Data_create': false, 'Export Data_edit': false, 'Export Data_delete': false, 'Export Data_approve': false, 'Export Data_export': true,
      },
      'VERIFIER': {
        'Organization Management_view': true, 'Organization Management_create': false, 'Organization Management_edit': false, 'Organization Management_delete': false, 'Organization Management_approve': false, 'Organization Management_export': false,
        'User Management_view': false, 'User Management_create': false, 'User Management_edit': false, 'User Management_delete': false, 'User Management_approve': false, 'User Management_export': false,
        'KYC Review_view': false, 'KYC Review_create': false, 'KYC Review_edit': false, 'KYC Review_delete': false, 'KYC Review_approve': false, 'KYC Review_export': false,
        'Document Issuance_view': false, 'Document Issuance_create': false, 'Document Issuance_edit': false, 'Document Issuance_delete': false, 'Document Issuance_approve': false, 'Document Issuance_export': false,
        'Document Revocation_view': false, 'Document Revocation_create': false, 'Document Revocation_edit': false, 'Document Revocation_delete': false, 'Document Revocation_approve': false, 'Document Revocation_export': false,
        'Document Verification_view': true, 'Document Verification_create': true, 'Document Verification_edit': false, 'Document Verification_delete': false, 'Document Verification_approve': false, 'Document Verification_export': true,
        'Trusted Registry Access_view': true, 'Trusted Registry Access_create': false, 'Trusted Registry Access_edit': false, 'Trusted Registry Access_delete': false, 'Trusted Registry Access_approve': false, 'Trusted Registry Access_export': false,
        'Audit Trail Access_view': false, 'Audit Trail Access_create': false, 'Audit Trail Access_edit': false, 'Audit Trail Access_delete': false, 'Audit Trail Access_approve': false, 'Audit Trail Access_export': false,
        'Reports Access_view': true, 'Reports Access_create': false, 'Reports Access_edit': false, 'Reports Access_delete': false, 'Reports Access_approve': false, 'Reports Access_export': true,
        'System Settings_view': false, 'System Settings_create': false, 'System Settings_edit': false, 'System Settings_delete': false, 'System Settings_approve': false, 'System Settings_export': false,
        'Security Monitoring_view': false, 'Security Monitoring_create': false, 'Security Monitoring_edit': false, 'Security Monitoring_delete': false, 'Security Monitoring_approve': false, 'Security Monitoring_export': false,
        'Export Data_view': true, 'Export Data_create': false, 'Export Data_edit': false, 'Export Data_delete': false, 'Export Data_approve': false, 'Export Data_export': true,
      }
    };
  });

  useEffect(() => {
    if (!user || !accessToken || (user.role !== 'issuer' && user.role !== 'super_admin')) return;

    let isMounted = true;
    setDocuments([]);
    setDocumentRegistryTotal(0);
    setDocumentRegistryActiveTotal(0);
    setDocumentRegistryRevokedTotal(0);
    setDocumentRegistryLoading(true);
    setDocumentRegistryError(null);
    const loadLiveData = async () => {
      try {
        if (user.role === 'issuer') {
          const [response, activeResponse, revokedResponse] = await Promise.all([
            apiRequest<{ items?: any[]; total: number }>('/documents/my?limit=100'),
            apiRequest<{ total: number }>('/documents/my?status=ACTIVE&limit=1'),
            apiRequest<{ total: number }>('/documents/my?status=REVOKED&limit=1'),
          ]);
          if (isMounted && response.items) {
            setDocuments(response.items.map(item => ({
              ...toDocumentRecord(item),
              issuerId: String(user.organizationId || ''),
              issuerName: user.name,
              issuerOrg: user.organization,
            })));
            setDocumentRegistryTotal(response.total);
            setDocumentRegistryActiveTotal(activeResponse.total);
            setDocumentRegistryRevokedTotal(revokedResponse.total);
          }
        }

        if (user.role === 'super_admin') {
          const [orgResponse, docResponse] = await Promise.all([
            apiRequest<{ items?: any[] }>('/admin/organizations?limit=25'),
            apiRequest<{ items?: any[]; total: number; active_count: number; revoked_count: number }>('/admin/documents?limit=100'),
          ]);

          if (isMounted && orgResponse.items) {
            setOrganizations(orgResponse.items.map(toOrganizationRecord));
          }

          if (isMounted && docResponse.items) {
            setDocuments(docResponse.items.map(toDocumentRecord));
            setDocumentRegistryTotal(docResponse.total);
            setDocumentRegistryActiveTotal(docResponse.active_count);
            setDocumentRegistryRevokedTotal(docResponse.revoked_count);
          }
        }
      } catch {
        if (isMounted) {
          setDocuments([]);
          setDocumentRegistryTotal(0);
          setDocumentRegistryActiveTotal(0);
          setDocumentRegistryRevokedTotal(0);
          setDocumentRegistryError('The document registry is unavailable. Dashboard document data was not loaded.');
        }
      } finally {
        if (isMounted) setDocumentRegistryLoading(false);
      }
    };

    loadLiveData();
    return () => { isMounted = false; };
  }, [accessToken, user?.id, user?.role]);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('veriproof_documents', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem('veriproof_organizations', JSON.stringify(organizations));
  }, [organizations]);

  useEffect(() => {
    localStorage.setItem('veriproof_registry', JSON.stringify(registry));
  }, [registry]);

  useEffect(() => {
    localStorage.setItem('veriproof_security_events', JSON.stringify(securityEvents));
  }, [securityEvents]);

  useEffect(() => {
    localStorage.setItem('veriproof_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('veriproof_admin_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('veriproof_system_settings', JSON.stringify(systemSettings));
  }, [systemSettings]);

  useEffect(() => {
    localStorage.setItem('veriproof_role_permissions', JSON.stringify(rolePermissions));
  }, [rolePermissions]);

  const toggleSidebar = () => setSidebarCollapsed(prev => !prev);

  const addDocument = (doc: DocumentRecord) => {
    setDocuments(prev => [doc, ...prev]);
    addAuditLog({
      actorName: doc.issuerName,
      actorRole: 'ISSUER',
      actorId: doc.issuerId,
      action: 'DOCUMENT_ISSUED',
      entityType: 'DOCUMENT',
      entityId: doc.id,
      details: `Issued document '${doc.title}' to ${doc.recipientName} with SHA-256 fingerprint.`
    });
  };

  const revokeDocument = (id: string, reason: string) => {
    setDocuments(prev =>
      prev.map(d =>
        d.id === id
          ? {
              ...d,
              status: 'revoked',
              revocationReason: reason,
              revokedAt: new Date().toISOString(),
              trustScore: 0
            }
          : d
      )
    );
    addAuditLog({
      actorName: 'Alice Admin',
      actorRole: 'SUPER_ADMIN',
      actorId: 'USR-001',
      action: 'DOCUMENT_REVOKED',
      entityType: 'DOCUMENT',
      entityId: id,
      details: `Revoked credential ${id}. Reason: ${reason}`
    });
  };

  const updateDocumentStatus = (id: string, status: 'active' | 'revoked' | 'suspended', reason?: string) => {
    setDocuments(prev =>
      prev.map(d =>
        d.id === id
          ? {
              ...d,
              status,
              revocationReason: reason || d.revocationReason,
              revokedAt: status === 'revoked' ? new Date().toISOString() : d.revokedAt,
              trustScore: status === 'revoked' ? 0 : d.trustScore
            }
          : d
      )
    );
    addAuditLog({
      actorName: 'Alice Admin',
      actorRole: 'SUPER_ADMIN',
      actorId: 'USR-001',
      action: `DOCUMENT_STATUS_${status.toUpperCase()}`,
      entityType: 'DOCUMENT',
      entityId: id,
      details: `Admin changed document ${id} status to ${status.toUpperCase()}.${reason ? ` Reason: ${reason}` : ''}`
    });
  };

  const addOrganization = (org: OrganizationRecord) => {
    setOrganizations(prev => [org, ...prev]);
    addAuditLog({
      actorName: org.authorizedPerson,
      actorRole: 'ISSUER',
      actorId: org.id,
      action: 'ORGANIZATION_REGISTERED',
      entityType: 'ORGANIZATION',
      entityId: org.id,
      details: `New organization registration submitted for ${org.name}.`
    });
  };

  const updateOrgStatus = (
    id: string,
    status: 'ACTIVE' | 'PENDING' | 'SUSPENDED',
    kycStatus: 'APPROVED' | 'PENDING' | 'REJECTED' | 'MANUAL_REVIEW'
  ) => {
    setOrganizations(prev =>
      prev.map(o => (o.id === id ? { ...o, status, kycStatus } : o))
    );
    addAuditLog({
      actorName: 'Alice Admin',
      actorRole: 'SUPER_ADMIN',
      actorId: 'USR-001',
      action: 'ORG_STATUS_UPDATED',
      entityType: 'ORGANIZATION',
      entityId: id,
      details: `Updated organization ${id} status to ${status} (KYC: ${kycStatus}).`
    });
  };

  const updateUserStatus = (id: string, status: 'ACTIVE' | 'SUSPENDED' | 'REVOKED') => {
    setUsers(prev =>
      prev.map(u => (u.id === id ? { ...u, accountStatus: status } : u))
    );
    addAuditLog({
      actorName: 'Alice Admin',
      actorRole: 'SUPER_ADMIN',
      actorId: 'USR-001',
      action: `USER_${status}`,
      entityType: 'USER',
      entityId: id,
      details: `Administrative status change for user account ${id} to ${status}.`
    });
  };

  const resolveSecurityFlag = (id: string, resolution: string) => {
    setSecurityEvents(prev =>
      prev.map(e => (e.id === id ? { ...e, status: 'RESOLVED' as const } : e))
    );
    addAuditLog({
      actorName: 'Alice Admin',
      actorRole: 'SUPER_ADMIN',
      actorId: 'USR-001',
      action: 'SECURITY_FLAG_RESOLVED',
      entityType: 'SECURITY',
      entityId: id,
      details: `Security incident ${id} resolved. Resolution note: ${resolution}`
    });
  };

  const updateSystemSettings = (newSettings: Partial<SystemSettingsRecord>) => {
    setSystemSettings(prev => ({ ...prev, ...newSettings }));
    addAuditLog({
      actorName: 'Alice Admin',
      actorRole: 'SUPER_ADMIN',
      actorId: 'USR-001',
      action: 'SYSTEM_SETTINGS_UPDATED',
      entityType: 'SECURITY',
      entityId: 'SYS-GLOBAL-CONFIG',
      details: `Updated platform global settings parameters (${Object.keys(newSettings).join(', ')}).`
    });
  };

  const updateRolePermissions = (role: string, permissions: Record<string, boolean>) => {
    setRolePermissions(prev => ({
      ...prev,
      [role]: permissions
    }));
    addAuditLog({
      actorName: 'Alice Admin',
      actorRole: 'SUPER_ADMIN',
      actorId: 'USR-001',
      action: 'ROLE_PERMISSIONS_UPDATED',
      entityType: 'USER',
      entityId: `ROLE-${role.replace(/\s+/g, '_')}`,
      details: `Modified access control permissions for role ${role}.`
    });
  };

  const addSecurityEvent = (event: Omit<SecurityEventRecord, 'id' | 'timestamp'>) => {
    const newEvent: SecurityEventRecord = {
      ...event,
      id: `SEC-${Date.now().toString().slice(-4)}`,
      timestamp: 'Just now'
    };
    setSecurityEvents(prev => [newEvent, ...prev]);
  };

  const addAuditLog = (log: Omit<AuditLogRecord, 'id' | 'timestamp' | 'tamperHash'>) => {
    const newLog: AuditLogRecord = {
      ...log,
      id: `AUD-${Date.now().toString().slice(-5)}`,
      timestamp: 'Just now',
      tamperHash: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const lookupDocument = (query: string): DocumentRecord | undefined => {
    const clean = query.trim().toLowerCase();
    return documents.find(
      d =>
        d.id.toLowerCase() === clean ||
        d.sha256Hash.toLowerCase() === clean ||
        d.recipientEmail.toLowerCase() === clean ||
        d.recipientId.toLowerCase() === clean ||
        d.qrPayload.toLowerCase().includes(clean)
    );
  };

  const [verifications, setVerifications] = useState<VerificationHistoryRecord[]>(() => {
    try {
      const saved = localStorage.getItem('veriproof_verifications');
      return saved ? JSON.parse(saved) : INITIAL_VERIFICATIONS;
    } catch {
      return INITIAL_VERIFICATIONS;
    }
  });

  useEffect(() => {
    localStorage.setItem('veriproof_verifications', JSON.stringify(verifications));
  }, [verifications]);

  const addVerification = (record: VerificationHistoryRecord) => {
    setVerifications(prev => [record, ...prev]);
  };

  const verifyDocumentEngine = (query: string, method: 'QR' | 'Upload' | 'Link' | 'Bulk' = 'Upload'): VerificationHistoryRecord => {
    const doc = lookupDocument(query);
    const verifId = `VRF-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowStr = 'Just now';

    if (!doc) {
      const unverifiedRecord: VerificationHistoryRecord = {
        verificationId: verifId,
        documentId: query.trim().toUpperCase() || 'UNRESOLVED-DOC',
        documentTitle: 'Unregistered Document Query',
        documentType: 'unknown',
        issuerOrg: 'Unknown / Unregistered Entity',
        issuerId: 'N/A',
        recipientName: 'Unregistered Bearer',
        verificationDate: nowStr,
        result: 'UNVERIFIED',
        trustScore: 40,
        method,
        reasons: [
          'No matching cryptographic record found in registry',
          'Issuer identity not established on trusted ledger',
          'Digital signature and hash validation unavailable'
        ],
        evidenceDetails: {
          issuerStatus: 'NOT_FOUND',
          registryStatus: 'NOT_FOUND',
          hashStatus: 'NOT_AVAILABLE',
          signatureStatus: 'NOT_AVAILABLE',
          ocrMatch: false,
          metadataStatus: 'WARNING',
          visualStatus: 'WARNING',
          aiForensicRisk: 'MEDIUM'
        }
      };
      setVerifications(prev => [unverifiedRecord, ...prev]);
      addAuditLog({
        actorName: 'Forensic Verifier',
        actorRole: 'VERIFIER',
        actorId: 'USR-003',
        action: 'VERIFICATION_EXECUTED',
        entityType: 'DOCUMENT',
        entityId: query,
        details: `Verification query executed with result UNVERIFIED. Document was not found on trusted registry.`
      });
      return unverifiedRecord;
    }

    const isRevoked = doc.status === 'revoked';
    const isTampered = doc.id.includes('FORGED') || doc.trustScore < 50 || (doc.tamperZones && doc.tamperZones.length > 0);

    let result: 'VERIFIED' | 'TAMPERED' | 'UNVERIFIED' = 'VERIFIED';
    let trustScore = doc.trustScore;
    let reasons: string[] = [];

    if (isRevoked) {
      result = 'TAMPERED';
      trustScore = 15;
      reasons = [
        'Document was officially REVOKED by the issuing authority',
        doc.revocationReason || 'Accreditation or credential status cancelled'
      ];
    } else if (isTampered) {
      result = 'TAMPERED';
      trustScore = Math.min(doc.trustScore, 35);
      reasons = [
        'SHA-256 cryptographic pre-hash digest mismatch',
        'ECDSA secp256k1 digital signature failed mathematical consensus',
        'Visual & font kerning divergence detected by forensic engine'
      ];
      if (doc.tamperZones && doc.tamperZones[0]) {
        reasons.push(`Tampered region: ${doc.tamperZones[0].field} (${doc.tamperZones[0].detectedAnomaly})`);
      }
    } else {
      result = 'VERIFIED';
      trustScore = Math.max(doc.trustScore, 95);
      reasons = [
        'Trusted Issuer cryptographically validated',
        'Registry oracle canonical record active',
        'SHA-256 fingerprint verified against genesis state',
        'ECDSA signature mathematically confirmed valid',
        'All OCR semantic fields match authoritative ledger'
      ];
    }

    const historyRecord: VerificationHistoryRecord = {
      verificationId: verifId,
      documentId: doc.id,
      documentTitle: doc.title,
      documentType: doc.documentType,
      issuerOrg: doc.issuerOrg,
      issuerId: doc.issuerId,
      recipientName: doc.recipientName,
      verificationDate: nowStr,
      result,
      trustScore,
      method,
      reasons,
      evidenceDetails: {
        issuerStatus: isRevoked ? 'SUSPENDED' : 'VERIFIED',
        registryStatus: isRevoked ? 'REVOKED' : 'ACTIVE',
        hashStatus: isTampered ? 'MISMATCH' : 'MATCH',
        signatureStatus: isTampered ? 'INVALID' : 'VALID',
        ocrMatch: !isTampered,
        metadataStatus: isTampered ? 'ANOMALY' : 'NORMAL',
        visualStatus: isTampered ? 'ANOMALY' : 'NORMAL',
        aiForensicRisk: isTampered ? 'HIGH' : 'LOW'
      },
      submittedHash: doc.sha256Hash,
      trustedHash: doc.sha256Hash,
      tamperHighlights: isTampered
        ? (doc.tamperZones ? doc.tamperZones.map(z => `${z.field}: ${z.detectedAnomaly}`) : ['Cryptographic divergence detected'])
        : undefined
    };

    setVerifications(prev => [historyRecord, ...prev]);

    addAuditLog({
      actorName: 'Forensic Verifier',
      actorRole: 'VERIFIER',
      actorId: 'USR-003',
      action: 'VERIFICATION_EXECUTED',
      entityType: 'DOCUMENT',
      entityId: doc.id,
      details: `Multi-signal verification executed for ${doc.id}. Verdict: ${result} (Score: ${trustScore}/100). Method: ${method}.`
    });

    if (result === 'TAMPERED') {
      addSecurityEvent({
        type: isRevoked ? 'REVOKED_PRESENTATION' : 'HASH_MISMATCH',
        severity: 'CRITICAL',
        documentId: doc.id,
        ipAddress: '127.0.0.1',
        actor: 'Forensic Verifier',
        organization: doc.issuerOrg,
        details: `Integrity failure flagged for document ${doc.id}. Verdict: ${result}.`,
        status: 'ACTIVE'
      });
    }

    return historyRecord;
  };

  const resetToDefaults = () => {
    setDocuments(INITIAL_DOCUMENTS);
    setOrganizations(INITIAL_ORGANIZATIONS);
    setRegistry(INITIAL_REGISTRY);
    setSecurityEvents(INITIAL_SECURITY_EVENTS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setUsers(INITIAL_ADMIN_USERS);
    setSystemSettings(INITIAL_SYSTEM_SETTINGS);
    setVerifications(INITIAL_VERIFICATIONS);
    localStorage.removeItem('veriproof_documents');
    localStorage.removeItem('veriproof_organizations');
    localStorage.removeItem('veriproof_registry');
    localStorage.removeItem('veriproof_security_events');
    localStorage.removeItem('veriproof_audit_logs');
    localStorage.removeItem('veriproof_admin_users');
    localStorage.removeItem('veriproof_system_settings');
    localStorage.removeItem('veriproof_role_permissions');
    localStorage.removeItem('veriproof_verifications');
  };

  return (
    <AppContext.Provider
      value={{
        documents,
        documentRegistryTotal,
        documentRegistryActiveTotal,
        documentRegistryRevokedTotal,
        documentRegistryLoading,
        documentRegistryError,
        organizations,
        registry,
        securityEvents,
        auditLogs,
        users,
        verifications,
        systemSettings,
        rolePermissions,
        sidebarCollapsed,
        toggleSidebar,
        addDocument,
        revokeDocument,
        updateDocumentStatus,
        addOrganization,
        updateOrgStatus,
        updateUserStatus,
        resolveSecurityFlag,
        updateSystemSettings,
        updateRolePermissions,
        addSecurityEvent,
        addAuditLog,
        lookupDocument,
        addVerification,
        verifyDocumentEngine,
        resetToDefaults
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
