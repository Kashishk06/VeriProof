import os

data_path = 'src/data/landingData.ts'

# The file contains exports like HERO_CAPABILITIES, VALUE_PROPOSITIONS, WORKFLOW_STEPS, CORE_FEATURES, INNOVATIONS, CHALLENGE_QUESTIONS, PROBLEM_FLOW_STEPS
# I'll create the new definitions based on the user's prompt and rewrite the file keeping interfaces the same.
# Since we need to keep the typescript interfaces the same to prevent compilation errors, we will just change the contents of the exported constants.

with open(data_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Instead of parsing everything, I'll just write a script that replaces the constants entirely using string manipulation or simply provide the entire file content.
new_content = """// ============================================================
// VERIPROOF — Centralized Landing Page Demo Data Layer
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
  howNetproofImplements: string;
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
    netproof: string;
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
  { id: 'packets', value: 18, suffix: 'K+', label: 'Documents Verified', iconName: 'Activity' },
  { id: 'evidence', value: 183, suffix: '', label: 'Trusted Issuers', iconName: 'FileText' },
  { id: 'integrity', value: 100, suffix: '%', label: 'Authenticity Guarantee', iconName: 'Shield' },
  { id: 'monitoring', value: 24, suffix: '/7', label: 'Real-time Forensics', iconName: 'Clock' },
];

export const HERO_STATUS_DATA: StatusCardData = {
  threat: {
    title: 'FORGERY DETECTED',
    description: 'Possible Image Manipulation',
    confidence: 94,
    severity: 'CRITICAL',
  },
  evidence: {
    id: 'VP-2026-00981',
    status: 'VERIFIED',
    verified: true,
  },
  blockchain: {
    status: 'Registry Confirmed',
    blockNumber: 18421,
    txHash: '0x7A91C28B...82FD91A4',
  },
};

export const HERO_CAPABILITIES: CapabilityItem[] = [
  { id: 'ai-detection', title: 'Cryptographic Protection', iconName: 'Brain', tooltip: 'SHA-256 hashing and ECDSA digital signatures create a tamper-evident identity for every issued document.' },
  { id: 'xai', title: 'Intelligent Verification', iconName: 'Activity', tooltip: 'Cross-check document integrity, issuer records, QR codes, extracted fields and digital signatures.' },
  { id: 'encryption', title: 'AI-Powered Forensics', iconName: 'Lock', tooltip: 'Detect suspicious edits, layout inconsistencies, visual anomalies and synthetic/AI-generated document risks.' },
  { id: 'blockchain', title: 'Evidence-Based TrustScore', iconName: 'Database', tooltip: 'Get a clear score, verdict and reasons instead of a simple real/fake answer.' },
  { id: 'threat-intel', title: 'Controlled Access', iconName: 'Shield', tooltip: 'Issuers decide which authorized verifiers can access their documents.' },
];

export const CHALLENGE_QUESTIONS: ChallengeItem[] = [
  { question: 'What happened?', context: 'Register: Organizations are verified and onboarded as trusted Issuers or Verifiers.', iconName: 'CheckCircle' },
  { question: 'Why was it suspicious?', context: 'Issue & Protect: The Issuer creates a document protected with hashing, digital signatures and a unique Document ID.', iconName: 'Shield' },
  { question: 'What evidence supports the finding?', context: 'Authorize: The Issuer chooses which Verifiers can access the document.', iconName: 'Lock' },
  { question: 'Has the evidence been modified?', context: 'Verify: The Verifier uploads the document or scans its QR code.', iconName: 'Search' },
  { question: 'Can it be securely shared?', context: 'Analyze & Prove: VERIPROOF checks cryptographic integrity, OCR fields, metadata, visual patterns and AI-forensic signals. A TrustScore, verdict and evidence-backed verification report are generated.', iconName: 'Brain' },
];

export const PROBLEM_FLOW_STEPS = [
  { step: '01', title: 'Register', desc: 'Organizations are verified and onboarded as trusted Issuers or Verifiers.' },
  { step: '02', title: 'Issue & Protect', desc: 'The Issuer creates a document protected with hashing, digital signatures and a unique Document ID.' },
  { step: '03', title: 'Authorize', desc: 'The Issuer chooses which Verifiers can access the document.' },
  { step: '04', title: 'Verify', desc: 'The Verifier uploads the document or scans its QR code.' },
  { step: '05', title: 'Analyze', desc: 'VERIPROOF checks cryptographic integrity, OCR fields, metadata, visual patterns and AI-forensic signals.' },
  { step: '06', title: 'Prove', desc: 'A TrustScore, verdict and evidence-backed verification report are generated.' },
];

export const VALUE_PROPOSITIONS: ValuePropItem[] = [
  {
    id: 'detect',
    concept: 'DETECT',
    tagline: 'Intelligent Verification.',
    shortDesc: 'Cross-check document integrity, issuer records, QR codes, extracted fields and digital signatures.',
    fullDesc: 'VERIPROOF continuously analyzes uploaded documents using automated feature extractors. Machine learning models detect anomalies such as tampered text, layout inconsistencies, and signature mismatches.',
    keyOutputs: ['Automated OCR parser', 'Signature verification', 'Temporal anomaly scoring'],
    color: 'from-purple-500 to-pink-500',
    accentBorder: 'border-purple-500/40',
  },
  {
    id: 'protect',
    concept: 'PROTECT',
    tagline: 'Cryptographic Protection & Controlled Access.',
    shortDesc: 'SHA-256 hashing and ECDSA digital signatures create a tamper-evident identity for every issued document.',
    fullDesc: 'Documents often contain sensitive personal information. VERIPROOF applies strict data minimization and ensures Issuers decide which authorized verifiers can access their documents.',
    keyOutputs: ['Zero-knowledge metadata', 'AES-256 encryption', 'Granular RBAC access controls'],
    color: 'from-blue-500 to-violet-500',
    accentBorder: 'border-blue-500/40',
  },
  {
    id: 'prove',
    concept: 'PROVE',
    tagline: 'Evidence-Based TrustScore.',
    shortDesc: 'Get a clear score, verdict and reasons instead of a simple real/fake answer.',
    fullDesc: 'Traditional verification lacks explainability. VERIPROOF generates an irreversible cryptographic digest and explains exactly why a document is suspicious and which checks failed.',
    keyOutputs: ['SHA-256 root fingerprinting', 'Complete Audit Trail', 'Automated TrustScore'],
    color: 'from-purple-500 to-pink-500',
    accentBorder: 'border-purple-500/40',
  },
  {
    id: 'trust',
    concept: 'TRUST',
    tagline: 'QR & Link Verification.',
    shortDesc: 'Verify a document instantly through a secure QR code or verification link.',
    fullDesc: 'Any authorized verifier can independently re-hash the document and query the registry to confirm absolute integrity without requiring complex manual processes.',
    keyOutputs: ['Instant hash comparison', 'Cryptographic proof certificates', 'Public/Private verification portal'],
    color: 'from-emerald-500 to-teal-500',
    accentBorder: 'border-emerald-500/40',
  },
];

export const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    step: 'STEP 01',
    title: 'AI Document Forensics',
    shortDesc: 'Combines traditional verification with AI-assisted visual and structural analysis to identify suspicious alterations.',
    fullDesc: 'Incorporate live scans or uploaded documents. Deep inspection processes headers, formatting, pixels, and metadata.',
    iconName: 'Search',
    deliverables: ['Visual forensics', 'Metadata telemetry', 'Format classification'],
    techUsed: 'OpenCV, Tesseract, Neural Analysis',
  },
  {
    step: 'STEP 02',
    title: 'Evidence-Based TrustScore',
    shortDesc: 'Instead of simply saying Fake, VERIPROOF explains why a document is suspicious and which checks failed.',
    fullDesc: 'Neural classifiers evaluate document anomalies against learned baselines. Every high-risk detection produces an explicit factor contribution breakdown.',
    iconName: 'Brain',
    deliverables: ['Factor contribution graph', 'Confidence rating', 'Signal mapping'],
    techUsed: 'Isolation Forests, Transformer Anomaly Engine, SHAP',
  },
  {
    step: 'STEP 03',
    title: 'Issuer-Controlled Verification',
    shortDesc: 'Documents are not universally exposed. Issuers control which verified organizations can access their credentials.',
    fullDesc: 'Identified evidence segments are sanitized. The bundle is encrypted using AES-256-GCM, ensuring sensitive payload contents remain shielded.',
    iconName: 'Lock',
    deliverables: ['Data minimization', 'AES-256-GCM envelope', 'Access controls'],
    techUsed: 'WebCrypto API, AES-256-GCM, Zero-Trust Enclaves',
  },
  {
    step: 'STEP 04',
    title: 'Synthetic Document Detection',
    shortDesc: 'Identifies signals associated with digitally generated or heavily manipulated certificate images.',
    fullDesc: 'The platform identifies signals associated with digitally generated or heavily manipulated certificate images. The hash, document ID, and timestamp are notarized directly.',
    iconName: 'Shield',
    deliverables: ['SHA-256 digest', 'Proof receipt', 'Cryptographic stamp'],
    techUsed: 'SHA-256, PoA Ledger, Smart Contract Registry',
  },
  {
    step: 'STEP 05',
    title: 'Multi-Layer Verification',
    shortDesc: 'Combines cryptography, registry matching, OCR, QR, metadata and visual forensics instead of relying on one signal.',
    fullDesc: 'Investigators run zero-trust integrity audits. The platform computes the active file hash in real time and checks it against the registry.',
    iconName: 'CheckCircle',
    deliverables: ['Real-time hash reconciliation', 'Chain of custody certificate', 'Tamper detection alert'],
    techUsed: 'Cryptographic Ledger Verifier, Audit Trail Engine',
  },
];

export const CORE_FEATURES: FeatureItem[] = [
  {
    id: 'feat-1',
    title: 'USER LAYER',
    shortDesc: 'Super Admin • Issuer • Verifier',
    whatItDoes: 'Provides distinct roles for platform management, credential issuance, and document verification.',
    whyItMatters: 'Ensures accountability and controlled access across the platform ecosystem.',
    howNetproofImplements: 'Role-Based Access Control (RBAC) securely separates user capabilities.',
    iconName: 'Activity',
    badge: 'Access',
  },
  {
    id: 'feat-2',
    title: 'APPLICATION LAYER',
    shortDesc: 'React • FastAPI • RBAC',
    whatItDoes: 'The core interface and API services that power the VERIPROOF platform.',
    whyItMatters: 'Delivers a responsive, scalable, and secure user experience.',
    howNetproofImplements: 'Modern web technologies combined with robust backend API services.',
    iconName: 'Brain',
    badge: 'Application',
  },
  {
    id: 'feat-3',
    title: 'TRUST LAYER',
    shortDesc: 'SHA-256 • ECDSA • QR • Document Registry',
    whatItDoes: 'The cryptographic foundation that guarantees document authenticity.',
    whyItMatters: 'Eliminates the possibility of silent tampering or forged digital identities.',
    howNetproofImplements: 'Generates immutable cryptographic proofs for every issued document.',
    iconName: 'Clock',
    badge: 'Integrity',
  },
  {
    id: 'feat-4',
    title: 'INTELLIGENCE LAYER',
    shortDesc: 'OCR • OpenCV • AI Forensics • Evidence Engine',
    whatItDoes: 'Advanced analysis pipeline that inspects documents for visual anomalies and inconsistencies.',
    whyItMatters: 'Detects sophisticated forgeries that bypass simple visual inspection.',
    howNetproofImplements: 'Employs ensemble neural networks and computer vision algorithms.',
    iconName: 'Shield',
    badge: 'Intelligence',
  },
  {
    id: 'feat-5',
    title: 'DATA LAYER',
    shortDesc: 'PostgreSQL • Secure Document Storage • Audit Logs',
    whatItDoes: 'Secure persistence for platform data, configurations, and historical audit trails.',
    whyItMatters: 'Maintains system state and provides the historical context required for auditing.',
    howNetproofImplements: 'Relational databases and encrypted object storage with complete audit tracking.',
    iconName: 'Database',
    badge: 'Storage',
  }
];

export const INNOVATIONS: InnovationItem[] = [
  {
    id: 'proof-carrying-ai',
    title: 'AI Document Forensics',
    summary: 'Combines traditional verification with AI-assisted visual and structural analysis to identify suspicious alterations.',
    details: [
      'Detection output accompanied by explainable feature reasoning',
      'Direct link to underlying cryptographic evidence',
      'Inspectable proof certificate for peer review',
    ],
    comparison: {
      traditional: 'Opaque manual visual checks with no supporting evidence.',
      netproof: 'Every verification score carries the exact cryptographically sealed data that triggered it.',
    },
  },
  {
    id: 'store-proof-not-packet',
    title: 'Evidence-Based TrustScore',
    summary: 'Instead of simply saying Fake, VERIPROOF explains why a document is suspicious and which checks failed.',
    details: [
      'Raw documents remain in high-speed, encrypted local storage',
      'Only lightweight SHA-256 digests and provenance records are checked',
      'Zero storage bloat, zero confidential data exposure',
    ],
    comparison: {
      traditional: 'Attempting to manually check every field against disjointed databases.',
      netproof: 'Separation of concerns: encrypted storage + clear analytical explanation.',
    },
  },
  {
    id: 'privacy-preserving-evidence',
    title: 'Issuer-Controlled Verification',
    summary: 'Documents are not universally exposed. Issuers control which verified organizations can access their credentials.',
    details: [
      'Automatic stripping of internal sensitive data',
      'Controlled disclosure of verification metadata',
      'Compliance with GDPR and privacy standards',
    ],
    comparison: {
      traditional: 'Exporting raw documents that expose customer passwords and PII.',
      netproof: 'Cryptographic envelopes that expose only mathematically verifiable indicators.',
    },
  },
  {
    id: 'attack-story',
    title: 'Synthetic Document Detection',
    summary: 'Identifies signals associated with digitally generated or heavily manipulated certificate images.',
    details: [
      'Visual footprint sequence analysis',
      'Multi-source event correlation',
      'Automated executive summaries generated in seconds',
    ],
    comparison: {
      traditional: 'Sifting through images manually to find the manipulation root cause.',
      netproof: 'Interactive visual narrative pinpointing the exact anomaly.',
    },
  },
  {
    id: 'evidence-lineage',
    title: 'Multi-Layer Verification',
    summary: 'Combines cryptography, registry matching, OCR, QR, metadata and visual forensics instead of relying on one signal.',
    details: [
      'Created → Analyzed → Protected → Hashed → Registered → Reviewed → Verified',
      'Cryptographically signed by each entity at every stage',
      'Irrefutable chain of custody eliminating claims of tampering',
    ],
    comparison: {
      traditional: 'Manual paper logs and simple stamps easily misplaced or forged.',
      netproof: 'Continuous cryptographic lineage verifiable by any third party in milliseconds.',
    },
  },
];

export const EXPLAINABILITY_DEMO = {
  threatTitle: 'Possible Document Manipulation',
  confidenceScore: 94,
  severity: 'CRITICAL',
  factors: [
    { factor: 'Font Inconsistency', strength: 91, description: 'Multiple font kerning mismatches detected in name field.', indicatorType: 'Visual Anomaly' },
    { factor: 'Unknown Signature Hash', strength: 86, description: 'Digital signature does not match issuer registry.', indicatorType: 'Cryptographic Anomaly' },
    { factor: 'Metadata Modification', strength: 88, description: 'PDF created date is later than issuance date.', indicatorType: 'Metadata Deviation' },
    { factor: 'AI Generation Signal', strength: 78, description: 'High-frequency noise patterns resembling synthetic image generation.', indicatorType: 'Generative Pattern' },
  ] as ExplainabilityFactor[],
};

export const ATTACK_TIMELINE_EVENTS: TimelineEventItem[] = [
  { time: '09:41:02', title: 'Document Issued', eventType: 'Baseline Flow', source: 'University Issuer', destination: 'Student Wallet', protocol: 'TCP/HTTPS', risk: 'LOW', details: 'Original legitimate document issued and hashed.' },
  { time: '09:43:18', title: 'Suspicious Edit Detected', eventType: 'Image Manipulation', source: 'External Editor', destination: 'Local System', protocol: 'Local', risk: 'MEDIUM', details: 'Document opened in image editing software.' },
  { time: '09:44:07', title: 'Verification Request', eventType: 'Verification', source: 'Employer Verifier', destination: 'VERIPROOF Portal', protocol: 'TCP/443', risk: 'HIGH', details: 'Modified document uploaded for verification.' },
  { time: '09:45:21', title: 'Signature Mismatch', eventType: 'Cryptographic Check', source: 'VERIPROOF Engine', destination: 'Registry', protocol: 'Encrypted Stream', risk: 'CRITICAL', details: 'SHA-256 hash does not match original ledger entry.' },
  { time: '09:46:13', title: 'Forensic Analysis Complete', eventType: 'AI Analysis', source: 'VERIPROOF AI', destination: 'Report Generator', protocol: 'Internal API', risk: 'HIGH', details: 'Visual anomalies detected in text fields.' },
  { time: '09:47:04', title: 'TrustScore Generated', eventType: 'Verdict', source: 'VERIPROOF Engine', destination: 'Employer Verifier', protocol: 'TCP FIN/ACK', risk: 'LOW', details: 'Detailed failure report delivered.' },
];

export const EVIDENCE_SAMPLE = {
  evidenceId: 'VP-2026-00981',
  threat: 'Possible Document Manipulation',
  source: 'University Issuer',
  status: 'VERIFIED',
  registeredHash: 'A8F91D2C4E9102BF8791002DA71B209E48201C7A91283B41CD12C98F10482B19',
  currentHash: 'A8F91D2C4E9102BF8791002DA71B209E48201C7A91283B41CD12C98F10482B19',
  tamperedHash: '91C72AB409F1288B87102919FA821102482910BB7192003881029381AC01289A',
  blockchain: 'REGISTERED',
  blockNumber: 18421,
  txHash: '0x7A91C28B490128410298A19028472910482FD91A4',
  timestamp: '2026-09-23 09:48:15 UTC',
};

export const ARCHITECTURE_PIPELINE: ArchitectureNode[] = [
  { id: 'node-1', name: 'DOCUMENT INGESTION', category: 'INGESTION', purpose: 'Capture uploaded files or scan QR codes.', input: 'PDF, Image, or QR', output: 'Raw Document Bytes', tech: 'Web Uploader, QR Scanner' },
  { id: 'node-2', name: 'OCR & PARSING', category: 'INGESTION', purpose: 'Extract text fields and layout data.', input: 'Raw Bytes', output: 'Structured Text', tech: 'Tesseract, Layout Parser' },
  { id: 'node-3', name: 'FEATURE EXTRACTION', category: 'ANALYSIS', purpose: 'Compute visual noise, metadata features.', input: 'Structured Text & Images', output: 'Feature vectors', tech: 'OpenCV, Pillow' },
  { id: 'node-4', name: 'AI ANALYSIS', category: 'ANALYSIS', purpose: 'Run neural inference for tampering detection.', input: 'Feature vectors', output: 'Anomaly scores & decision factors', tech: 'Isolation Forest, PyTorch' },
  { id: 'node-5', name: 'CRYPTOGRAPHIC CHECK', category: 'ANALYSIS', purpose: 'Verify SHA-256 and ECDSA signatures.', input: 'Raw Bytes & Registry', output: 'Integrity Status', tech: 'Crypto API, Registry Service' },
  { id: 'node-6', name: 'EVIDENCE ENGINE', category: 'PROOF', purpose: 'Compile verification checks into a detailed report.', input: 'Analysis Results', output: 'Verification Report', tech: 'Report Generator' },
  { id: 'node-7', name: 'ENCRYPTION', category: 'PROOF', purpose: 'Encrypt sensitive report data with AES-256.', input: 'Verification Report', output: 'Encrypted Report', tech: 'AES-256-GCM, WebCrypto' },
  { id: 'node-8', name: 'TRUSTSCORE', category: 'PROOF', purpose: 'Calculate final TrustScore based on all layers.', input: 'Encrypted Report', output: 'TrustScore Metric', tech: 'Scoring Engine' },
  { id: 'node-9', name: 'REGISTRY PROOF', category: 'PROOF', purpose: 'Record verification attempt on audit log.', input: 'TrustScore & Hash', output: 'Audit Trail Entry', tech: 'PostgreSQL, Logging' },
  { id: 'node-10', name: 'VERIFICATION', category: 'VERIFICATION', purpose: 'Present explainable proof to the user.', input: 'Audit Trail & Score', output: 'Final Verdict Dashboard', tech: 'React Portal' },
];

export const TECH_CAPABILITIES: TechnologyCategory[] = [
  {
    category: 'VERIFICATION LAYER',
    iconName: 'Activity',
    items: ['Multi-format Support', 'QR Code Integration', 'Automated OCR', 'Signature Validation'],
  },
  {
    category: 'AI FORENSICS',
    iconName: 'Brain',
    items: ['Visual Anomaly Detection', 'Explainable TrustScore', 'Synthetic Image Flagging', 'Layout Consistency Checks'],
  },
  {
    category: 'DATA SECURITY',
    iconName: 'Lock',
    items: ['AES-256 Encryption', 'Data Minimization', 'Zero-Knowledge Metadata Separation', 'Secure Vault Storage'],
  },
  {
    category: 'DIGITAL TRUST',
    iconName: 'Shield',
    items: ['SHA-256 Root Fingerprinting', 'Immutable Registry', 'Document Authenticity Proof', 'Mathematical Tamper Detection'],
  },
  {
    category: 'APPLICATION SECURITY',
    iconName: 'Database',
    items: ['Role-Based Access Control (RBAC)', 'Cryptographic Audit Logging', 'Time-Bound Evidence Sharing', 'End-to-End Session Sealing'],
  },
];

export const USE_CASES: UseCaseItem[] = [
  {
    id: 'forensics',
    title: 'Education',
    audience: 'Universities & Students',
    description: 'Reduce fake certificates, marksheets and academic credential fraud.',
    keyBenefits: ['Tamper-proof certificates', 'Instant verification', 'Immutable records'],
    iconName: 'FileText',
  },
  {
    id: 'enterprise-ir',
    title: 'Recruitment',
    audience: 'HR & Employers',
    description: 'Help organizations verify certificates, internships and offer letters before making hiring decisions.',
    keyBenefits: ['Clear candidate screening', 'Verified offer letters', 'Hiring confidence'],
    iconName: 'Shield',
  },
  {
    id: 'secure-sharing',
    title: 'Organizations',
    audience: 'Enterprises & Agencies',
    description: 'Give issuers a secure way to create and manage trusted digital documents.',
    keyBenefits: ['Secure issuance', 'Controlled access', 'Brand protection'],
    iconName: 'Share2',
  },
  {
    id: 'ai-trust',
    title: 'Digital Verification',
    audience: 'Third-Party Verifiers',
    description: 'Enable fast third-party verification through QR codes and secure links.',
    keyBenefits: ['Eliminates manual checks', 'Instant feedback', 'Transparent TrustScore'],
    iconName: 'Brain',
  },
];

export const IMPACT_POINTS: ImpactPoint[] = [
  {
    title: 'EDUCATION',
    metric: 'Zero Fake Degrees',
    description: 'Reduce fake certificates, marksheets and academic credential fraud.',
  },
  {
    title: 'RECRUITMENT',
    metric: '100% Verified',
    description: 'Help organizations verify certificates, internships and offer letters before making hiring decisions.',
  },
  {
    title: 'ORGANIZATIONS',
    metric: 'Secure Issuance',
    description: 'Give issuers a secure way to create and manage trusted digital documents.',
  },
  {
    title: 'DIGITAL VERIFICATION',
    metric: 'Instant Checks',
    description: 'Enable fast third-party verification through QR codes and secure links.',
  },
  {
    title: 'TRUST & TRANSPARENCY',
    metric: 'Evidence-Backed',
    description: 'Replace blind trust with evidence-backed verification.',
  },
];

export const ROLE_PREVIEWS: RolePreview[] = [
  {
    roleId: 'analyst',
    name: 'Verifier',
    tagline: 'Upload documents and instantly check authenticity.',
    capabilities: [
      'Upload PDFs and Images',
      'Scan QR Codes for instant checks',
      'Inspect explainable TrustScore factors',
      'Download verification reports',
    ],
    workspaceRoute: '/dashboard',
    badge: 'Verification Tier',
  },
  {
    roleId: 'investigator',
    name: 'Issuer',
    tagline: 'Create and secure digital credentials.',
    capabilities: [
      'Issue digitally signed documents',
      'Manage access permissions',
      'Revoke compromised credentials',
      'View issuance audit logs',
    ],
    workspaceRoute: '/investigations',
    badge: 'Issuer Tier',
  },
  {
    roleId: 'administrator',
    name: 'Super Admin',
    tagline: 'Platform governance and organization management.',
    capabilities: [
      'Manage multi-tenant RBAC policies',
      'Review platform-wide audit logs',
      'Onboard trusted issuing organizations',
      'Configure system parameters',
    ],
    workspaceRoute: '/settings',
    badge: 'Root Access',
  },
];

export const LIVE_DASHBOARD_PREVIEW = {
  activeInvestigations: '42',
  highRiskThreats: '03',
  evidenceRecords: '1,204',
  verifiedEvidencePercentage: '99%',
  recentIncident: {
    source: 'Issuer Portal',
    threat: 'Document Tampering Attempt',
    severity: 'HIGH',
    confidence: '98%',
    status: 'Verification Failed',
    timestamp: 'Just now',
  },
};
"""

with open(data_path, 'w', encoding='utf-8') as f:
    f.write(new_content)
    
print("Updated src/data/landingData.ts successfully.")
