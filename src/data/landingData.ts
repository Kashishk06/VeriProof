// ============================================================
// CIPHER03 — Centralized Landing Page Demo Data Layer
// Secure Digital Document Verification Platform
// ============================================================

export interface HeroMetric {
  id: string;
  value: number;
  suffix: string;
  label: string;
  iconName: string;
}

export interface StatusCardData {
  threat: {
    title: string;
    description: string;
    confidence: number;
    severity: string;
  };
  evidence: {
    id: string;
    status: string;
    verified: boolean;
  };
  blockchain: {
    status: string;
    blockNumber: number;
    txHash: string;
  };
}

export interface CapabilityItem {
  id: string;
  title: string;
  iconName: string;
  tooltip: string;
}

export interface ChallengeItem {
  question: string;
  context: string;
  iconName: string;
}

export interface ValuePropItem {
  id: 'detect' | 'protect' | 'prove' | 'trust';
  concept: string;
  tagline: string;
  shortDesc: string;
  fullDesc: string;
  keyOutputs: string[];
  color: string;
  accentBorder: string;
}

export interface WorkflowStep {
  step: string;
  title: string;
  shortDesc: string;
  fullDesc: string;
  iconName: string;
  deliverables: string[];
  techUsed: string;
}

export interface FeatureItem {
  id: string;
  title: string;
  shortDesc: string;
  whatItDoes: string;
  whyItMatters: string;
  howVeriproofImplements: string;
  iconName: string;
  badge: string;
}

export interface InnovationItem {
  id: string;
  title: string;
  summary: string;
  details: string[];
  comparison: {
    traditional: string;
    veriproof: string;
  };
}

export interface ExplainabilityFactor {
  factor: string;
  strength: number;
  description: string;
  indicatorType: string;
}

export interface TimelineEventItem {
  time: string;
  title: string;
  eventType: string;
  source: string;
  destination: string;
  protocol: string;
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details: string;
}

export interface ArchitectureNode {
  id: string;
  name: string;
  category: 'INGESTION' | 'ANALYSIS' | 'PROOF' | 'VERIFICATION';
  purpose: string;
  input: string;
  output: string;
  tech: string;
}

export interface TechnologyCategory {
  category: string;
  iconName: string;
  items: string[];
}

export interface UseCaseItem {
  id: string;
  title: string;
  audience: string;
  description: string;
  keyBenefits: string[];
  iconName: string;
}

export interface ImpactPoint {
  title: string;
  metric: string;
  description: string;
}

export interface RolePreview {
  roleId: 'analyst' | 'investigator' | 'administrator';
  name: string;
  tagline: string;
  capabilities: string[];
  workspaceRoute: string;
  badge: string;
}

// ------------------------------------------------------------
// DATA INSTANCES
// ------------------------------------------------------------

export const LANDING_METRICS: HeroMetric[] = [
  { id: 'documents', value: 12, suffix: 'K+', label: 'Documents Verified', iconName: 'Activity' },
  { id: 'records', value: 183, suffix: '', label: 'Registry Records', iconName: 'FileText' },
  { id: 'accuracy', value: 97, suffix: '%', label: 'Verification Rate', iconName: 'Shield' },
  { id: 'support', value: 24, suffix: '/7', label: 'Platform Availability', iconName: 'Clock' },
];

export const HERO_STATUS_DATA: StatusCardData = {
  threat: {
    title: 'TAMPERING DETECTED',
    description: 'Document Inconsistency Found',
    confidence: 94,
    severity: 'HIGH',
  },
  evidence: {
    id: 'VP-2026-00981',
    status: 'VERIFIED',
    verified: true,
  },
  blockchain: {
    status: 'Registry Confirmed',
    blockNumber: 18421,
    txHash: 'VP-REG-7A91C28B...82FD',
  },
};

export const HERO_CAPABILITIES: CapabilityItem[] = [
  { id: 'doc-upload', title: 'Document Upload', iconName: 'Brain', tooltip: 'Upload supported document files for multi-signal verification analysis.' },
  { id: 'ocr', title: 'OCR Extraction', iconName: 'Activity', tooltip: 'Extract and compare relevant text fields and metadata from submitted documents.' },
  { id: 'tamper', title: 'Tampering Analysis', iconName: 'Lock', tooltip: 'Identify potential inconsistencies, suspicious edits, or visual anomalies in documents.' },
  { id: 'registry', title: 'Registry Verification', iconName: 'Database', tooltip: 'Compare document identifiers against the trusted issuer registry where available.' },
  { id: 'qr-verify', title: 'QR & Link Verification', iconName: 'Shield', tooltip: 'Check verification QR codes and document links against the platform verification workflow.' },
];

export const CHALLENGE_QUESTIONS: ChallengeItem[] = [
  { question: 'Is this document genuine?', context: 'Analyzing document structure, metadata, and available registry records to assess authenticity indicators.', iconName: 'Clock' },
  { question: 'Has it been modified?', context: 'Detecting potential signs of alteration through visual analysis, field inconsistencies, and metadata examination.', iconName: 'Brain' },
  { question: 'What does the registry say?', context: 'Comparing submitted document identifiers against trusted issuer records where the registry feature is available.', iconName: 'FileText' },
  { question: 'Can the findings be trusted?', context: 'Presenting verification status with supporting evidence, confidence information, and clear reasons behind each finding.', iconName: 'CheckCircle' },
  { question: 'Who issued this document?', context: 'Identifying and validating the issuing organization through supported verification channels and registry lookups.', iconName: 'Share2' },
];

export const PROBLEM_FLOW_STEPS = [
  { step: '01', title: 'Document Submitted', desc: 'Supported file, QR code, or verification link submitted for review.' },
  { step: '02', title: 'Text & Field Extraction', desc: 'OCR processes document text and extracts relevant fields for comparison.' },
  { step: '03', title: 'Metadata Inspection', desc: 'Available metadata examined for inconsistencies or unusual patterns.' },
  { step: '04', title: 'Tampering Analysis', desc: 'Visual and structural checks identify potential signs of modification.' },
  { step: '05', title: 'Registry Comparison', desc: 'Document identifiers compared against trusted issuer registry where available.' },
  { step: '06', title: 'Findings Compiled', desc: 'Verification status, confidence data, and supporting reasons are assembled.' },
  { step: '07', title: 'Result Delivered', desc: 'Clear verification result with supporting evidence presented to the user.' },
];

export const VALUE_PROPOSITIONS: ValuePropItem[] = [
  {
    id: 'detect',
    concept: 'DETECT',
    tagline: 'Identify potential document inconsistencies.',
    shortDesc: 'Multi-signal analysis examines document fields, metadata, and visual structure to surface possible signs of modification.',
    fullDesc: 'CIPHER03 processes submitted documents through OCR field extraction, metadata inspection, and visual analysis. The platform identifies potential signs of tampering, unusual edits, or structural inconsistencies and presents its findings with supporting reasons rather than opaque scores.',
    keyOutputs: ['OCR field comparison', 'Metadata inspection', 'Visual anomaly detection'],
    color: 'from-purple-500 to-pink-500',
    accentBorder: 'border-purple-500/40',
  },
  {
    id: 'protect',
    concept: 'PROTECT',
    tagline: 'Keep document data handled responsibly.',
    shortDesc: 'Submitted documents are processed for verification purposes and handled according to the platform\'s access and privacy controls.',
    fullDesc: 'CIPHER03 applies role-based access controls to ensure only authorized issuers, verifiers, and administrators interact with documents and records. The platform separates verification metadata from raw document content and limits access to sensitive credential information.',
    keyOutputs: ['Role-based access control', 'Audit logging', 'Controlled record access'],
    color: 'from-blue-500 to-violet-500',
    accentBorder: 'border-blue-500/40',
  },
  {
    id: 'prove',
    concept: 'PROVE',
    tagline: 'Generate a verifiable document record.',
    shortDesc: 'Verified documents are registered in the trusted issuer registry with a unique document ID and cryptographic record.',
    fullDesc: 'When an issuer registers a document, CIPHER03 generates a unique document identifier and records it in the trusted registry. This record can later be used to verify the document\'s origin and confirm that its key details match the registered version, helping establish document provenance.',
    keyOutputs: ['Document ID generation', 'Registry record creation', 'Issuer attribution'],
    color: 'from-purple-500 to-pink-500',
    accentBorder: 'border-purple-500/40',
  },
  {
    id: 'trust',
    concept: 'TRUST',
    tagline: 'Present clear, evidence-backed findings.',
    shortDesc: 'Verification results include the status, confidence information where available, and understandable reasons behind each finding.',
    fullDesc: 'CIPHER03 does not produce opaque pass/fail verdicts. Each verification result includes the specific checks performed, what each check found, and what the combined findings suggest about the document\'s authenticity. Users receive actionable information to support their review decisions.',
    keyOutputs: ['Verification status report', 'Supporting evidence display', 'Reason-backed findings'],
    color: 'from-emerald-500 to-teal-500',
    accentBorder: 'border-emerald-500/40',
  },
];

export const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    step: 'STEP 01',
    title: 'SUBMIT',
    shortDesc: 'Upload a document file or open a supported verification link or QR code.',
    fullDesc: 'Users can submit documents for verification by uploading a supported file (PDF, PNG, JPEG) or by scanning a QR code or opening a verification link. The platform accepts document submissions from verifiers and supports batch processing for high-volume use cases.',
    iconName: 'Search',
    deliverables: ['File upload support', 'QR code scanning', 'Verification link resolution'],
    techUsed: 'File ingestion, QR decoder, URL resolver',
  },
  {
    step: 'STEP 02',
    title: 'EXTRACT',
    shortDesc: 'Extract text fields, metadata, and document information for inspection.',
    fullDesc: 'The platform processes the submitted document using OCR to extract relevant text fields such as names, dates, identifiers, and issuer details. Available file metadata is also examined. The extracted data provides the basis for comparison and consistency checks.',
    iconName: 'Brain',
    deliverables: ['OCR field extraction', 'Metadata analysis', 'Document structure parsing'],
    techUsed: 'OCR Engine, Metadata Reader, Field Extractor',
  },
  {
    step: 'STEP 03',
    title: 'ANALYZE',
    shortDesc: 'Run implemented checks on fields, metadata, signatures, and registry records.',
    fullDesc: 'CIPHER03 runs the verification checks supported for the submitted document type. These may include comparing extracted fields against expected patterns, examining metadata for inconsistencies, checking digital signatures where present, and looking up the document in the trusted registry where applicable.',
    iconName: 'Lock',
    deliverables: ['Field consistency check', 'Registry lookup', 'Tamper indicator analysis'],
    techUsed: 'Field Comparator, Registry API, Integrity Checker',
  },
  {
    step: 'STEP 04',
    title: 'VERIFY',
    shortDesc: 'Check available records, signatures, and indicators against known data.',
    fullDesc: 'Where the trusted registry feature is implemented and a matching record exists, CIPHER03 compares the submitted document\'s identifiers against registered values. Digital signatures are validated where the necessary infrastructure is present. The platform assembles all findings into a coherent verification assessment.',
    iconName: 'Shield',
    deliverables: ['Registry match result', 'Signature validation', 'Consistency assessment'],
    techUsed: 'Registry Verifier, Signature Validator, Audit Engine',
  },
  {
    step: 'STEP 05',
    title: 'REPORT',
    shortDesc: 'Present verification status, confidence information, and supporting reasons.',
    fullDesc: 'The final verification result is presented with a clear status, the specific checks performed, and the reasons behind each finding. Where confidence scores are computed, they are displayed alongside the supporting factors. Users receive actionable findings rather than a simple pass or fail label.',
    iconName: 'CheckCircle',
    deliverables: ['Verification status', 'Supporting evidence summary', 'Reason-backed findings'],
    techUsed: 'Result Engine, Audit Trail, Evidence Reporter',
  },
];

export const CORE_FEATURES: FeatureItem[] = [
  {
    id: 'feat-1',
    title: 'Document Upload',
    shortDesc: 'Upload supported document files for verification analysis.',
    whatItDoes: 'Accepts supported document formats including PDF, PNG, and JPEG for submission to the verification pipeline.',
    whyItMatters: 'Enables verifiers to quickly submit physical or digital document copies without requiring special hardware or software.',
    howVeriproofImplements: 'Provides a secure upload interface that ingests files and routes them through the appropriate verification workflow based on document type.',
    iconName: 'Activity',
    badge: 'Upload',
  },
  {
    id: 'feat-2',
    title: 'OCR-Based Data Extraction',
    shortDesc: 'Extract relevant text and fields from supported documents for comparison.',
    whatItDoes: 'Reads and extracts text content, field values, and identifiers from submitted documents using optical character recognition.',
    whyItMatters: 'Provides the raw data needed for field comparison, registry lookup, and consistency analysis without manual data entry.',
    howVeriproofImplements: 'Applies OCR processing to extract key fields such as names, dates, document numbers, and issuer information for downstream verification checks.',
    iconName: 'Brain',
    badge: 'OCR',
  },
  {
    id: 'feat-3',
    title: 'Tampering Detection',
    shortDesc: 'Identify potential inconsistencies and signs of document modification.',
    whatItDoes: 'Examines document structure, visual patterns, metadata, and extracted fields for signs of suspicious editing or alteration.',
    whyItMatters: 'Helps reviewers surface documents that may have been modified after issuance and warrant further human review.',
    howVeriproofImplements: 'Runs implemented analysis checks on available document signals and reports identified inconsistencies with supporting context.',
    iconName: 'Clock',
    badge: 'Analysis',
  },
  {
    id: 'feat-4',
    title: 'Metadata Analysis',
    shortDesc: 'Examine available metadata for inconsistencies requiring review.',
    whatItDoes: 'Inspects file metadata such as creation date, modification history, software origin, and other embedded properties.',
    whyItMatters: 'Metadata inconsistencies can indicate that a document was created or modified in ways that do not match its claimed provenance.',
    howVeriproofImplements: 'Reads and displays available metadata fields and flags values that appear inconsistent with the document\'s stated origin or issuance date.',
    iconName: 'Shield',
    badge: 'Metadata',
  },
  {
    id: 'feat-5',
    title: 'Trusted Registry Verification',
    shortDesc: 'Compare document identifiers against the trusted issuer registry.',
    whatItDoes: 'Looks up the submitted document\'s identifiers in the platform registry to check whether a matching issuer record exists.',
    whyItMatters: 'A registry match provides evidence that the document was registered by a known, authorized issuer through the platform.',
    howVeriproofImplements: 'Queries the trusted registry using extracted document identifiers and returns the match status, issuer details, and any discrepancies found.',
    iconName: 'Terminal',
    badge: 'Registry',
  },
  {
    id: 'feat-6',
    title: 'QR Code & Link Verification',
    shortDesc: 'Check document verification QR codes and links against the platform.',
    whatItDoes: 'Resolves QR codes and verification URLs embedded in documents to retrieve and compare the associated registry record.',
    whyItMatters: 'Enables fast verification of documents that include a QR code or link issued by the platform, without manual field entry.',
    howVeriproofImplements: 'Decodes QR payloads or resolves verification links and cross-references the result against the platform\'s supported verification workflow.',
    iconName: 'Database',
    badge: 'QR / Link',
  },
  {
    id: 'feat-7',
    title: 'Verification Results',
    shortDesc: 'Present status, confidence information, and reasons behind each finding.',
    whatItDoes: 'Assembles all check results into a clear, readable verification report with supporting evidence and reason-backed findings.',
    whyItMatters: 'Helps users understand not just the verification outcome but the specific signals and checks that contributed to the result.',
    howVeriproofImplements: 'Displays the verification status, the checks performed, confidence data where available, and a structured summary of supporting findings.',
    iconName: 'AlertTriangle',
    badge: 'Results',
  },
  {
    id: 'feat-8',
    title: 'Audit Trail & History',
    shortDesc: 'Display verification history and audit records where supported.',
    whatItDoes: 'Maintains a log of document verification events, issuer registrations, and platform actions for traceability.',
    whyItMatters: 'Supports accountability and review by providing an auditable record of what was verified, by whom, and when.',
    howVeriproofImplements: 'Records verification events in the platform audit trail and makes them available to authorized users through the history and audit sections.',
    iconName: 'Share2',
    badge: 'Audit',
  },
];

export const INNOVATIONS: InnovationItem[] = [
  {
    id: 'reason-backed-results',
    title: 'REASON-BACKED RESULTS',
    summary: 'Every verification result includes the specific checks performed and the reasons behind each finding.',
    details: [
      'Verification status accompanied by the supporting checks and signals',
      'Direct display of extracted field values compared against registry records',
      'Clear indication of which checks passed, which flagged issues, and what was inconclusive',
    ],
    comparison: {
      traditional: 'Simple pass/fail stamps with no explanation of what was checked or why.',
      veriproof: 'Every result shows the specific checks performed, what each found, and what the combined findings suggest.',
    },
  },
  {
    id: 'multi-signal-verification',
    title: 'MULTI-SIGNAL VERIFICATION',
    summary: 'Combine OCR extraction, metadata analysis, registry lookup, and tampering checks into a single workflow.',
    details: [
      'OCR extraction provides field-level data for comparison and consistency checks',
      'Metadata inspection surfaces inconsistencies not visible in the document itself',
      'Registry lookup confirms whether a document was registered by a known issuer',
    ],
    comparison: {
      traditional: 'Single-method checks that miss inconsistencies visible only through a combination of signals.',
      veriproof: 'Multiple independent checks run together and their findings combined into a coherent assessment.',
    },
  },
  {
    id: 'registry-based-trust',
    title: 'REGISTRY-BASED TRUST',
    summary: 'Issuers register documents in the trusted registry; verifiers check against those records.',
    details: [
      'Issuers create registry records linked to specific document identifiers',
      'Verifiers submit documents and receive a registry match or mismatch result',
      'No registry record found means the document cannot be confirmed through the platform registry',
    ],
    comparison: {
      traditional: 'No systematic way to check whether a document was issued by a specific organization.',
      veriproof: 'Structured issuer registry allows direct comparison of submitted documents against registered records.',
    },
  },
  {
    id: 'honest-findings',
    title: 'HONEST VERIFICATION FINDINGS',
    summary: 'The platform reports what it found, not what users want to hear.',
    details: [
      'Results distinguish between confirmed, inconclusive, and flagged findings',
      'No tampering indicators detected does not mean the document is guaranteed authentic',
      'Registry match confirms registration; it does not guarantee legal validity',
    ],
    comparison: {
      traditional: 'Overclaiming systems that guarantee authenticity or fraud detection without qualification.',
      veriproof: 'Accurate language: "helps assess authenticity," "detected potential inconsistencies," "no registry record found."',
    },
  },
  {
    id: 'role-based-workflow',
    title: 'ROLE-BASED VERIFICATION WORKFLOW',
    summary: 'Issuers, verifiers, and administrators each access a tailored workspace suited to their responsibilities.',
    details: [
      'Issuers register and manage their document records through the issuer dashboard',
      'Verifiers submit and review document verification results through the verifier workspace',
      'Administrators manage organizations, users, and platform oversight through the admin console',
    ],
    comparison: {
      traditional: 'One-size-fits-all tools that force every user through the same workflow regardless of their role.',
      veriproof: 'Purpose-built workspaces that match each role\'s actual tasks, permissions, and information needs.',
    },
  },
];

export const EXPLAINABILITY_DEMO = {
  threatTitle: 'Document Consistency Assessment',
  confidenceScore: 87,
  severity: 'REVIEW RECOMMENDED',
  factors: [
    { factor: 'Field Consistency', strength: 91, description: 'Extracted field values match expected patterns for this document type', indicatorType: 'Field Analysis' },
    { factor: 'Registry Match', strength: 86, description: 'Document identifier found in trusted issuer registry with matching details', indicatorType: 'Registry Check' },
    { factor: 'Metadata Consistency', strength: 78, description: 'File creation date and modification history align with claimed issuance date', indicatorType: 'Metadata Analysis' },
    { factor: 'Visual Integrity', strength: 72, description: 'No obvious visual anomalies detected in document structure or typography', indicatorType: 'Visual Inspection' },
  ] as ExplainabilityFactor[],
};

export const ATTACK_TIMELINE_EVENTS: TimelineEventItem[] = [
  { time: '10:01:00', title: 'Document Submitted', eventType: 'Upload Event', source: 'Verifier Workspace', destination: 'Verification Pipeline', protocol: 'HTTPS/Upload', risk: 'LOW', details: 'PDF document submitted for verification. File accepted and routed to OCR extraction.' },
  { time: '10:01:03', title: 'OCR Extraction Complete', eventType: 'Field Extraction', source: 'OCR Engine', destination: 'Field Comparator', protocol: 'Internal', risk: 'LOW', details: 'Name, date, document number, and issuer fields extracted successfully from the submitted document.' },
  { time: '10:01:05', title: 'Metadata Inconsistency Flagged', eventType: 'Metadata Analysis', source: 'Metadata Reader', destination: 'Analysis Engine', protocol: 'Internal', risk: 'MEDIUM', details: 'File modification date is 14 days after the claimed issuance date. Flagged for review.' },
  { time: '10:01:07', title: 'Registry Lookup Initiated', eventType: 'Registry Check', source: 'Field Comparator', destination: 'Trusted Registry', protocol: 'Registry API', risk: 'LOW', details: 'Document identifier queried against the trusted issuer registry.' },
  { time: '10:01:09', title: 'Partial Registry Match', eventType: 'Registry Result', source: 'Trusted Registry', destination: 'Result Engine', protocol: 'Registry API', risk: 'HIGH', details: 'Registry record found for the issuer but the recipient name field does not match the registered value.' },
  { time: '10:01:11', title: 'Verification Result Delivered', eventType: 'Result Report', source: 'Result Engine', destination: 'Verifier Workspace', protocol: 'HTTPS', risk: 'HIGH', details: 'Result: Review Recommended. Metadata inconsistency and registry field mismatch require human review before accepting this document.' },
];

export const EVIDENCE_SAMPLE = {
  evidenceId: 'VP-2026-00981',
  threat: 'Certificate Authenticity Assessment',
  source: 'Verifier — Document Review',
  status: 'VERIFIED',
  registeredHash: 'A8F91D2C4E9102BF8791002DA71B209E48201C7A91283B41CD12C98F10482B19',
  currentHash: 'A8F91D2C4E9102BF8791002DA71B209E48201C7A91283B41CD12C98F10482B19',
  tamperedHash: '91C72AB409F1288B87102919FA821102482910BB7192003881029381AC01289A',
  blockchain: 'REGISTERED',
  blockNumber: 18421,
  txHash: 'VP-REG-7A91C28B490128410298A190284729',
  timestamp: '2026-09-23 09:48:15 UTC',
};

export const ARCHITECTURE_PIPELINE: ArchitectureNode[] = [
  { id: 'node-1', name: 'DOCUMENT INPUT', category: 'INGESTION', purpose: 'Accept document uploads, QR scans, and verification links from users.', input: 'PDF, PNG, JPEG, or verification URL', output: 'Queued document for processing', tech: 'File upload handler, QR decoder, URL resolver' },
  { id: 'node-2', name: 'FILE VALIDATION', category: 'INGESTION', purpose: 'Validate file format, size, and structure before processing.', input: 'Raw submitted file', output: 'Validated document ready for analysis', tech: 'Format checker, file parser' },
  { id: 'node-3', name: 'OCR EXTRACTION', category: 'ANALYSIS', purpose: 'Extract text fields, identifiers, and data from the document.', input: 'Validated document', output: 'Extracted field values and text', tech: 'OCR Engine, Text Parser' },
  { id: 'node-4', name: 'METADATA READER', category: 'ANALYSIS', purpose: 'Read and inspect available file metadata for inconsistencies.', input: 'Submitted file', output: 'Metadata field values and flags', tech: 'Metadata Extractor, Property Reader' },
  { id: 'node-5', name: 'TAMPER ANALYSIS', category: 'ANALYSIS', purpose: 'Examine document structure and visual patterns for signs of modification.', input: 'Document image and extracted fields', output: 'Tampering indicator report', tech: 'Integrity Checker, Visual Analyzer' },
  { id: 'node-6', name: 'REGISTRY LOOKUP', category: 'PROOF', purpose: 'Compare extracted identifiers against the trusted issuer registry.', input: 'Extracted document identifiers', output: 'Registry match or mismatch result', tech: 'Registry API, Field Comparator' },
  { id: 'node-7', name: 'SIGNATURE CHECK', category: 'PROOF', purpose: 'Validate digital signatures where supported by the document and infrastructure.', input: 'Digital signature payload', output: 'Signature validity status', tech: 'Signature Validator, PKI Verifier' },
  { id: 'node-8', name: 'RESULT COMPILER', category: 'PROOF', purpose: 'Assemble all check results into a structured verification report.', input: 'All analysis outputs', output: 'Consolidated verification findings', tech: 'Result Engine, Findings Aggregator' },
  { id: 'node-9', name: 'AUDIT LOGGING', category: 'VERIFICATION', purpose: 'Record the verification event in the immutable audit trail.', input: 'Verification result and metadata', output: 'Audit log entry', tech: 'Audit Trail Engine, Event Logger' },
  { id: 'node-10', name: 'RESULT DELIVERY', category: 'VERIFICATION', purpose: 'Present verification status, findings, and supporting evidence to the user.', input: 'Compiled verification report', output: 'Verification result display', tech: 'Result UI, Evidence Reporter' },
];

export const TECH_CAPABILITIES: TechnologyCategory[] = [
  {
    category: 'DOCUMENT PROCESSING',
    iconName: 'Activity',
    items: ['Multi-format file ingestion', 'OCR text and field extraction', 'Metadata inspection', 'Document structure parsing'],
  },
  {
    category: 'VERIFICATION ANALYSIS',
    iconName: 'Brain',
    items: ['Field consistency checking', 'Tampering indicator detection', 'Visual anomaly analysis', 'Multi-signal assessment'],
  },
  {
    category: 'REGISTRY & TRUST',
    iconName: 'Lock',
    items: ['Trusted issuer registry', 'Document ID lookup', 'Field-level record comparison', 'Issuer attribution'],
  },
  {
    category: 'PLATFORM SECURITY',
    iconName: 'Shield',
    items: ['Role-based access control', 'Cryptographic audit logging', 'Immutable verification records', 'Secure document handling'],
  },
  {
    category: 'WORKFLOW & ACCESS',
    iconName: 'Database',
    items: ['Issuer document management', 'Verifier submission workflow', 'Admin oversight console', 'Audit trail and history'],
  },
];

export const USE_CASES: UseCaseItem[] = [
  {
    id: 'education',
    title: 'Academic Certificate Verification',
    audience: 'Educational Institutions & Employers',
    description: 'Verify academic certificates, degrees, and transcripts submitted by applicants against the issuing institution\'s registered records.',
    keyBenefits: ['Registry-based issuer confirmation', 'Field-level comparison', 'Audit trail of verifications'],
    iconName: 'FileText',
  },
  {
    id: 'enterprise',
    title: 'Professional Document Review',
    audience: 'Organizations & HR Teams',
    description: 'Review submitted professional credentials, licenses, and experience documents for potential inconsistencies before onboarding decisions.',
    keyBenefits: ['Multi-signal consistency check', 'Metadata and field inspection', 'Batch verification support'],
    iconName: 'Shield',
  },
  {
    id: 'issuer-management',
    title: 'Issuer Credential Management',
    audience: 'Issuing Organizations',
    description: 'Register and manage issued documents through the issuer dashboard, providing a verifiable record for recipients and third-party verifiers.',
    keyBenefits: ['Document registry creation', 'Bulk registration support', 'Recipient email delivery'],
    iconName: 'Share2',
  },
  {
    id: 'compliance',
    title: 'Compliance Document Assessment',
    audience: 'Compliance Officers & Auditors',
    description: 'Assess submitted contracts, invoices, and regulatory documents for signs of modification or inconsistency as part of compliance workflows.',
    keyBenefits: ['Tamper indicator reporting', 'Reason-backed findings', 'Verification audit log'],
    iconName: 'Brain',
  },
];

export const IMPACT_POINTS: ImpactPoint[] = [
  {
    title: 'FASTER VERIFICATION',
    metric: 'Minutes, Not Days',
    description: 'Submit a document and receive a structured verification result with supporting findings in a fraction of the time manual review takes.',
  },
  {
    title: 'CLEARER FINDINGS',
    metric: 'Reason-Backed',
    description: 'Every result includes the specific checks performed and the reasons behind each finding, not just a pass or fail label.',
  },
  {
    title: 'REGISTRY CONFIDENCE',
    metric: 'Issuer-Linked',
    description: 'Registry-matched documents can be traced back to the registered issuer, providing an additional layer of authenticity evidence.',
  },
  {
    title: 'HONEST REPORTING',
    metric: 'No Overclaiming',
    description: 'Results use accurate language: "helps assess authenticity" and "detected potential inconsistencies," not guaranteed fraud detection.',
  },
  {
    title: 'FULL TRACEABILITY',
    metric: 'Audit Trail',
    description: 'Every verification event is logged in the immutable audit trail, supporting accountability and review for authorized users.',
  },
];

export const ROLE_PREVIEWS: RolePreview[] = [
  {
    roleId: 'analyst',
    name: 'Document Verifier',
    tagline: 'Submit documents, review findings, and assess authenticity for informed decisions.',
    capabilities: [
      'Upload documents or scan QR codes for verification',
      'Review multi-signal verification results and findings',
      'Inspect extracted field comparisons and metadata flags',
      'Access verification history and audit records',
    ],
    workspaceRoute: '/verifier',
    badge: 'Verification Role',
  },
  {
    roleId: 'investigator',
    name: 'Document Issuer',
    tagline: 'Register credentials, manage records, and deliver verified documents to recipients.',
    capabilities: [
      'Register documents in the trusted issuer registry',
      'Issue individual or bulk document credentials',
      'Download and email verified documents to recipients',
      'Manage and review issued document records',
    ],
    workspaceRoute: '/issuer',
    badge: 'Issuer Role',
  },
  {
    roleId: 'administrator',
    name: 'Platform Administrator',
    tagline: 'Oversee organizations, manage users, and maintain platform governance.',
    capabilities: [
      'Manage organization registrations and KYB verification',
      'Administer user accounts and role assignments',
      'Review platform audit trail and system reports',
      'Configure trusted registry and system settings',
    ],
    workspaceRoute: '/admin',
    badge: 'Admin Role',
  },
];

export const LIVE_DASHBOARD_PREVIEW = {
  activeInvestigations: '07',
  highRiskThreats: '04',
  evidenceRecords: '183',
  verifiedEvidencePercentage: '97%',
  recentIncident: {
    source: 'Verifier — Document Review',
    threat: 'Registry Field Mismatch Detected',
    severity: 'REVIEW',
    confidence: '87%',
    status: 'Findings Delivered',
    timestamp: 'Just now',
  },
};
