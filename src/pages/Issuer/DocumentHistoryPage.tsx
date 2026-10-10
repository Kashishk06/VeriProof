import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  History, Clock, CheckCircle2, ShieldAlert,
  Search, Shield, FileText, ArrowRight, User,
  Calendar, Key, Lock, Database, Info, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { IssuerHeader } from './components/IssuerHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { apiRequest, type DocumentHistoryResponse, type IssuerDocumentView } from '../../utils/documentRegistryApi';
import { useIssuerDocuments } from '../../hooks/useIssuerDocuments';

interface DocumentLifecycleEvent {
  id: string;
  eventName: string;
  timestamp: string;
  status: 'SUCCESS' | 'WARNING' | 'REVOKED' | 'INFO';
  actor: string;
  actorRole: string;
  description: string;
  technicalDetails?: Record<string, string>;
}

export const DocumentHistoryPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { documents: issuerDocs } = useIssuerDocuments(user);

  const queryDocId = searchParams.get('id') || searchParams.get('docId') || '';
  const [selectedDocId, setSelectedDocId] = useState<string>(queryDocId);
  const [selectedEvent, setSelectedEvent] = useState<DocumentLifecycleEvent | null>(null);
  const [history, setHistory] = useState<DocumentHistoryResponse | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (queryDocId) {
      setSelectedDocId(queryDocId);
    } else if (issuerDocs.length > 0 && !selectedDocId) {
      setSelectedDocId(issuerDocs[0].id);
    }
  }, [queryDocId, issuerDocs]);

  const currentDoc = useMemo<IssuerDocumentView | null>(() => {
    return issuerDocs.find((d) => d.id === selectedDocId) || null;
  }, [issuerDocs, selectedDocId]);

  useEffect(() => {
    if (!currentDoc) {
      setHistory(null);
      return;
    }
    let isCurrent = true;
    setHistoryLoading(true);
    setHistoryError(null);
    apiRequest<DocumentHistoryResponse>(`/documents/${encodeURIComponent(currentDoc.id)}/history`)
      .then(response => { if (isCurrent) setHistory(response); })
      .catch(requestError => { if (isCurrent) setHistoryError(requestError instanceof Error ? requestError.message : 'Unable to load document history.'); })
      .finally(() => { if (isCurrent) setHistoryLoading(false); });
    return () => { isCurrent = false; };
  }, [currentDoc?.id]);

  // Render only events persisted by the registry and audit service.
  const timelineEvents = useMemo(() => {
    return (history?.events || []).map(event => {
      const metadata = Object.fromEntries(Object.entries(event.metadata).map(([key, value]) => [key, String(value)]));
      const revoked = event.event_type === 'DOCUMENT_REVOKED';
      const warning = event.event_type.includes('FAILED');
      return {
        id: String(event.id),
        eventName: event.event_type.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase()),
        timestamp: event.created_at,
        status: (revoked ? 'REVOKED' : warning ? 'WARNING' : 'SUCCESS') as DocumentLifecycleEvent['status'],
        actor: event.actor_name || `User ${event.actor_id ?? 'System'}`,
        actorRole: event.actor_id ? 'Authenticated actor' : 'System',
        description: `${event.event_type.replaceAll('_', ' ')} recorded for ${currentDoc?.id || 'document'}.`,
        technicalDetails: metadata,
      };
    });
  }, [history, currentDoc?.id]);

  return (
    <div className="space-y-6">
      <IssuerHeader
        title="Document Lifecycle History"
        description="Comprehensive chronological timeline of events for a specific issued credential, spanning validation, cryptographic signature, registry commitment, and verification queries."
        badge="DOCUMENT-CENTRIC TIMELINE"
        badgeColor="bg-violet-500/10 text-violet-400 border-violet-500/20"
      />
      {historyError && <div role="alert" className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">{historyError}</div>}
      {historyLoading && <div role="status" className="text-xs text-slate-400">Loading registry audit history...</div>}

      {/* SECTION A: SELECT DOCUMENT */}
      <div className="bg-[#0B1020]/90 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
            Select Credential to Inspect
          </label>
          <select
            value={selectedDocId}
            onChange={(e) => {
              setSelectedDocId(e.target.value);
              setSelectedEvent(null);
            }}
            className="w-full px-3 py-2 bg-[#050816] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500/50 cursor-pointer font-mono"
          >
            {issuerDocs.map((doc) => (
              <option key={doc.id} value={doc.id} className="bg-[#0B1020]">
                {doc.id} — {doc.recipientName} ({doc.title})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {currentDoc && (
            <button
              onClick={() => navigate(`/issuer/protection?id=${currentDoc.id}`)}
              className="px-3.5 py-2 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 border border-violet-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Shield size={14} />
              <span>Document Protection</span>
            </button>
          )}
        </div>
      </div>

      {!currentDoc ? (
        <div className="bg-[#0B1020]/90 border border-white/10 rounded-2xl p-12 text-center space-y-3">
          <History size={32} className="mx-auto text-slate-500" />
          <h3 className="text-sm font-bold text-white">No Document Selected</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Please select an issued document from the dropdown above to view its chronological event history.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Document Summary Pill */}
          <div className="p-4 rounded-xl bg-[#0B1020]/90 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-violet-300">{currentDoc.id}</span>
                <StatusBadge status={currentDoc.status.toUpperCase()} />
              </div>
              <h3 className="text-sm font-bold text-white mt-1">{currentDoc.title}</h3>
              <p className="text-xs text-slate-400">
                Recipient: <strong className="text-slate-200">{currentDoc.recipientName}</strong> (ID: {currentDoc.recipientId})
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-500 self-start sm:self-center">
              {timelineEvents.length} Recorded Lifecycle Event{timelineEvents.length === 1 ? '' : 's'}
            </span>
          </div>

          {/* SECTION B: TIMELINE */}
          <div className="bg-[#0B1020]/90 border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Clock size={14} className="text-violet-400" />
              Chronological Audit Trail
            </h3>

            <div className="relative pl-6 sm:pl-8 space-y-6 before:content-[''] before:absolute before:left-2.5 sm:before:left-3.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-white/10">
              {timelineEvents.map((evt, idx) => {
                let badgeClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                let dotClass = 'bg-emerald-400';

                if (evt.status === 'REVOKED') {
                  badgeClass = 'bg-red-500/10 text-red-400 border-red-500/30';
                  dotClass = 'bg-red-400';
                } else if (evt.status === 'WARNING') {
                  badgeClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                  dotClass = 'bg-amber-400';
                }

                return (
                  <div
                    key={evt.id}
                    onClick={() => setSelectedEvent(evt)}
                    className="relative group cursor-pointer"
                  >
                    {/* Node Dot */}
                    <div
                      className={`absolute -left-[27px] sm:-left-[31px] top-1.5 w-3 h-3 rounded-full border-2 border-[#0B1020] ${dotClass} group-hover:scale-125 transition-transform`}
                    />

                    {/* Event Card */}
                    <div className="p-4 rounded-xl bg-[#070B19] border border-white/5 hover:border-violet-500/40 hover:bg-violet-500/5 transition-all space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white group-hover:text-violet-300 transition-colors">
                            {evt.eventName}
                          </h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${badgeClass}`}>
                            {evt.status}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500">
                          {evt.timestamp}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {evt.description}
                      </p>

                      <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px] text-slate-500">
                        <span>
                          Responsible Actor: <strong className="text-slate-400">{evt.actor}</strong> ({evt.actorRole})
                        </span>
                        <span className="text-violet-400 group-hover:underline text-[10px] font-mono">
                          View Details →
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SECTION C: EVENT DETAILS MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1020] border border-white/15 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Event Detail</span>
                <h3 className="text-sm font-bold text-white mt-0.5">{selectedEvent.eventName}</h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-[#070B19] rounded-xl border border-white/5">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 block">Event Identifier</span>
                  <span className="font-mono text-violet-300 font-bold">{selectedEvent.id}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-500 block">Recorded Timestamp</span>
                  <span className="font-mono text-slate-300">{selectedEvent.timestamp}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono text-slate-500 block">Actor & Authorization</span>
                <p className="text-slate-200 font-semibold mt-0.5">{selectedEvent.actor}</p>
                <span className="text-[11px] text-slate-400">{selectedEvent.actorRole}</span>
              </div>

              <div>
                <span className="text-[10px] font-mono text-slate-500 block">Recorded Narrative</span>
                <p className="text-slate-300 mt-0.5 leading-relaxed bg-[#070B19] p-2.5 rounded-lg border border-white/5">
                  {selectedEvent.description}
                </p>
              </div>

              {selectedEvent.technicalDetails && (
                <div className="space-y-1.5 pt-2 border-t border-white/5">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">
                    Cryptographic & Technical Artifacts
                  </span>
                  <div className="space-y-1 bg-[#050816] p-3 rounded-xl border border-white/5 font-mono text-[11px]">
                    {Object.entries(selectedEvent.technicalDetails).map(([key, val]) => (
                      <div key={key} className="flex justify-between gap-2">
                        <span className="text-slate-500">{key}:</span>
                        <span className="text-slate-200 text-right truncate max-w-[240px]">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentHistoryPage;
