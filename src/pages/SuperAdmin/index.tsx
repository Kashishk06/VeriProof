import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { OverviewPage } from './OverviewPage';
import { IssuersPage } from './IssuersPage';
import { UsersPage } from './UsersPage';
import { OrganizationVerificationPage } from './OrganizationVerificationPage';
import { AccessPermissionsPage } from './AccessPermissionsPage';
import { TrustedRegistryPage } from './TrustedRegistryPage';
import { DocumentOversightPage } from './DocumentOversightPage';
import { AuditTrailPage } from './AuditTrailPage';
import { ReportsAnalyticsPage } from './ReportsAnalyticsPage';
import { SystemSettingsPage } from './SystemSettingsPage';

export const SuperAdminDashboard: React.FC = () => {
  const location = useLocation();
  const path = location.pathname.toLowerCase();

  // Route dispatch based on exact sidebar path
  if (path.includes('/admin/overview') || path.endsWith('/overview')) {
    return <OverviewPage />;
  }
  if (path.includes('/admin/issuers') || path.endsWith('/issuers')) {
    return <IssuersPage />;
  }
  if (path.includes('/admin/users') || path.endsWith('/users')) {
    return <UsersPage />;
  }
  if (path.includes('/admin/organization-verification') || path.endsWith('/organization-verification')) {
    return <OrganizationVerificationPage />;
  }
  if (path.includes('/admin/access-permissions') || path.endsWith('/access-permissions')) {
    return <AccessPermissionsPage />;
  }
  if (path.includes('/admin/trusted-registry') || path.endsWith('/trusted-registry')) {
    return <TrustedRegistryPage />;
  }
  if (path.includes('/admin/document-oversight') || path.endsWith('/document-oversight')) {
    return <DocumentOversightPage />;
  }
  if (path.includes('/admin/audit-trail') || path.endsWith('/audit-trail')) {
    return <AuditTrailPage />;
  }
  if (path.includes('/admin/reports') || path.endsWith('/reports')) {
    return <ReportsAnalyticsPage />;
  }
  if (path.includes('/admin/settings') || path.endsWith('/settings')) {
    return <SystemSettingsPage />;
  }

  if (path === '/admin' || path === '/admin/' || path.endsWith('/admin')) {
    return <Navigate to="/admin/overview" replace />;
  }

  return <OverviewPage />;
};

export default SuperAdminDashboard;
