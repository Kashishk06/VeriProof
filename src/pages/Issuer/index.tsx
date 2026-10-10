import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Upload, Files, Shield,
  History, ShieldAlert, ClipboardList, Settings
} from 'lucide-react';

// Import all Issuer pages
import { IssuerOverviewPage } from './OverviewPage';
import { IssueDocumentPage } from './IssueDocumentPage';
import { BulkRegistrationPage } from './BulkRegistrationPage';
import { MyDocumentsPage } from './MyDocumentsPage';
import { DocumentProtectionPage } from './DocumentProtectionPage';
import { DocumentHistoryPage } from './DocumentHistoryPage';
import { RevokeDocumentPage } from './RevokeDocumentPage';
import { IssuerAuditTrailPage } from './AuditTrailPage';
import { IssuerSettingsPage } from './SettingsPage';

export const IssuerDashboard: React.FC = () => {
  const location = useLocation();
  const path = location.pathname.toLowerCase();

  // Route dispatch
  if (path.includes('/issuer/issue') || path.endsWith('/issue') || path.includes('/issuer/create')) {
    return <IssueDocumentPage />;
  }
  if (path.includes('/issuer/bulk') || path.endsWith('/bulk')) {
    return <BulkRegistrationPage />;
  }
  if (path.includes('/issuer/documents') || path.endsWith('/documents')) {
    return <MyDocumentsPage />;
  }
  if (path.includes('/issuer/protection') || path.endsWith('/protection')) {
    return <DocumentProtectionPage />;
  }
  if (path.includes('/issuer/history') || path.endsWith('/history')) {
    return <DocumentHistoryPage />;
  }
  if (path.includes('/issuer/revoke') || path.endsWith('/revoke') || path.includes('/issuer/revocations')) {
    return <RevokeDocumentPage />;
  }
  if (path.includes('/issuer/audit') || path.endsWith('/audit')) {
    return <IssuerAuditTrailPage />;
  }
  if (path.includes('/issuer/settings') || path.endsWith('/settings')) {
    return <IssuerSettingsPage />;
  }

  // Default: Overview
  return <IssuerOverviewPage />;
};

export default IssuerDashboard;
