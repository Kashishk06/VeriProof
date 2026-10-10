import React from 'react';
import { useLocation } from 'react-router-dom';
import { OverviewPage } from './OverviewPage';
import { VerifyDocumentPage } from './VerifyDocumentPage';
import { BulkVerificationPage } from './BulkVerificationPage';
import { DocumentDnaPage } from './DocumentDnaPage';
import { ForensicAnalysisPage } from './ForensicAnalysisPage';
import { VerificationHistoryPage } from './VerificationHistoryPage';
import { VerificationReportsPage } from './VerificationReportsPage';
import { SettingsPage } from './SettingsPage';

export const VerifierDashboard: React.FC = () => {
  const location = useLocation();
  const path = location.pathname.toLowerCase();

  // Route dispatch based on exact sidebar path
  if (path.includes('/verifier/verify') || path.endsWith('/verify')) {
    return <VerifyDocumentPage />;
  }
  if (path.includes('/verifier/bulk') || path.endsWith('/bulk')) {
    return <BulkVerificationPage />;
  }
  if (path.includes('/verifier/dna') || path.endsWith('/dna')) {
    return <DocumentDnaPage />;
  }
  if (path.includes('/verifier/forensics') || path.endsWith('/forensics')) {
    return <ForensicAnalysisPage />;
  }
  if (path.includes('/verifier/history') || path.endsWith('/history')) {
    return <VerificationHistoryPage />;
  }
  if (path.includes('/verifier/reports') || path.endsWith('/reports')) {
    return <VerificationReportsPage />;
  }
  if (path.includes('/verifier/settings') || path.endsWith('/settings')) {
    return <SettingsPage />;
  }

  // Default is Verifier Overview (/verifier, /verifier/overview)
  return <OverviewPage />;
};

export default VerifierDashboard;
