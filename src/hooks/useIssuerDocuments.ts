import { useEffect, useState } from 'react';
import type { AuthUser } from '../context/AuthContext';
import { apiRequest, toIssuerDocumentView, type IssuerDocumentView, type IssuerRegistryDocument, type RegistryDocumentList } from '../utils/documentRegistryApi';

export function useIssuerDocuments(user: AuthUser | null) {
  const [documents, setDocuments] = useState<IssuerDocumentView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadIndex, setReloadIndex] = useState(0);

  useEffect(() => {
    let isCurrent = true;
    if (!user?.organizationId || user.role !== 'issuer') {
      setDocuments([]);
      setIsLoading(false);
      setError(user?.role === 'issuer' ? 'Issuer organization is unavailable.' : null);
      return () => { isCurrent = false; };
    }

    setDocuments([]);
    setIsLoading(true);
    setError(null);
    const loadDocuments = async () => {
      try {
        const pageSize = 100;
        const firstPage = await apiRequest<RegistryDocumentList<IssuerRegistryDocument>>(`/documents/my?limit=${pageSize}`);
        const records = [...firstPage.items];
        for (let page = 2; page <= firstPage.total_pages; page += 1) {
          const nextPage = await apiRequest<RegistryDocumentList<IssuerRegistryDocument>>(`/documents/my?page=${page}&limit=${pageSize}`);
          records.push(...nextPage.items);
        }
        if (isCurrent) {
          setDocuments(records.map(document => toIssuerDocumentView(
            document,
            user.name,
            user.organization,
            String(user.organizationId),
          )));
        }
      } catch (requestError) {
        if (isCurrent) {
          setDocuments([]);
          setError(requestError instanceof Error ? requestError.message : 'Unable to load registered documents.');
        }
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };

    loadDocuments();

    return () => { isCurrent = false; };
  }, [user, reloadIndex]);

  return { documents, isLoading, error, refresh: () => setReloadIndex(value => value + 1) };
}
