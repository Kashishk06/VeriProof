// ============================================================
// VERIPROOF — Centralized Type Definitions
// ============================================================

export type UserRole = 'verifier' | 'issuer' | 'super_admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  lastActive: string;
  status: 'active' | 'inactive' | 'suspended';
  department: string;
}

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';
export type ThreatStatus = 'active' | 'investigating' | 'mitigated' | 'false_positive';
export type InvestigationStatus = 'active' | 'completed' | 'pending' | 'closed';
export type EvidenceStatus = 'pending' | 'protected' | 'verified' | 'tampered' | 'shared';
export type BlockchainStatus = 'registered' | 'verified' | 'failed' | 'pending';

export interface Threat {
  id: string;
  investigationId: string;
  type: string;
  severity: SeverityLevel;
  confidence: number;
  sourceIp: string;
  destinationIp: string;
  protocol: string;
  port: number;
  firstSeen: string;
  lastSeen: string;
  status: ThreatStatus;
  reasons: string[];
  packetsInvolved: number;
  bytesTransferred: number;
}

export interface Investigation {
  id: string;
  name: string;
  deviceId: string;
  deviceName: string;
  analyst: string;
  analystId: string;
  status: InvestigationStatus;
  severity: SeverityLevel;
  threatType: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  pcapFile?: string;
  pcapSize?: number;
  packetCount: number;
  uniqueIps: number;
  suspiciousEvents: number;
  externalDestinations: number;
  confidence: number;
  evidenceId?: string;
  description: string;
  tags: string[];
}

export interface Evidence {
  id: string;
  investigationId: string;
  incidentId: string;
  source: string;
  type: string;
  createdAt: string;
  createdBy: string;
  hash: string;
  originalHash: string;
  size: number;
  status: EvidenceStatus;
  encryptionStatus: 'encrypted' | 'unencrypted';
  blockchainStatus: BlockchainStatus;
  blockchainTxId?: string;
  blockchainBlock?: number;
  threatType: string;
  severity: SeverityLevel;
  integrityVerified: boolean;
  lastVerified?: string;
  sharedWith: string[];
  metadata: Record<string, string | number | boolean>;
}

export interface EvidenceEvent {
  id: string;
  evidenceId: string;
  action: string;
  actor: string;
  actorRole: UserRole;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
  details: string;
  ipAddress?: string;
}

export interface BlockchainRecord {
  id: string;
  evidenceId: string;
  hash: string;
  txId: string;
  block: number;
  timestamp: string;
  registrar: string;
  status: BlockchainStatus;
  gasUsed?: number;
  networkName: string;
  contractAddress: string;
}

export interface NetworkPacket {
  id: string;
  timestamp: string;
  srcIp: string;
  dstIp: string;
  srcPort: number;
  dstPort: number;
  protocol: string;
  length: number;
  flags: string[];
  risk: 'none' | 'low' | 'medium' | 'high' | 'critical';
  status: 'normal' | 'suspicious' | 'blocked';
  description: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  type: 'normal' | 'anomaly' | 'threat' | 'evidence' | 'system';
  title: string;
  description: string;
  severity?: SeverityLevel;
  sourceIp?: string;
  destIp?: string;
  protocol?: string;
  details?: Record<string, string | number>;
}

export interface TrafficStats {
  totalPackets: number;
  tcp: number;
  udp: number;
  dns: number;
  http: number;
  https: number;
  uniqueIps: number;
  externalDestinations: number;
  totalBytes: number;
  inboundBytes: number;
  outboundBytes: number;
  duration: number;
}

export interface AIAnalysisResult {
  threatType: string;
  severity: SeverityLevel;
  confidence: number;
  reasons: string[];
  evidenceStrength: number;
  affectedFlows: number;
  suspiciousPackets: number;
  recommendations: string[];
}

export interface Notification {
  id: string;
  type: 'threat' | 'evidence' | 'blockchain' | 'investigation' | 'system' | 'tamper';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  severity?: SeverityLevel;
  link?: string;
}

export interface DashboardMetrics {
  activeInvestigations: number;
  highRiskThreats: number;
  evidenceRecords: number;
  verifiedEvidence: number;
  tamperAlerts: number;
  blockchainProofs: number;
  recentThreats: Threat[];
  recentInvestigations: Investigation[];
}

export interface ThreatTrend {
  date: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface ProtocolStat {
  name: string;
  value: number;
  color: string;
}

export interface SharedEvidence {
  id: string;
  evidenceId: string;
  recipient: string;
  accessType: 'metadata_only' | 'threat_indicators' | 'evidence_summary' | 'protected_evidence';
  purpose: string;
  createdAt: string;
  expiresAt: string;
  createdBy: string;
  accessCount: number;
  status: 'active' | 'expired' | 'revoked';
}

export interface Report {
  id: string;
  type: 'investigation' | 'threat' | 'evidence_integrity' | 'chain_of_custody';
  title: string;
  investigationId?: string;
  createdAt: string;
  createdBy: string;
  status: 'generating' | 'ready' | 'failed';
  format: 'pdf' | 'json' | 'csv';
  size?: number;
}

export interface AnalysisStage {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  duration?: number;
  details?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
}

export interface AppSettings {
  sessionTimeout: number;
  mfaEnabled: boolean;
  loginNotifications: boolean;
  evidenceRetentionDays: number;
  encryptionEnabled: boolean;
  blockchainNetwork: string;
  contractAddress: string;
  verificationMode: 'automatic' | 'manual';
  detectionSensitivity: 'low' | 'medium' | 'high';
  confidenceThreshold: number;
  threatAlerts: boolean;
  tamperAlerts: boolean;
  evidenceVerificationAlerts: boolean;
}
