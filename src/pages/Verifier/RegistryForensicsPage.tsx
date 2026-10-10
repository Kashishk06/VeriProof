import React, { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Activity, AlertTriangle, Cpu, FileSearch, LoaderCircle, Play, ShieldCheck } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import {
  createForensicAnalysis,
  getForensicAnalysisHistory,
  getForensicModelRegistry,
} from '../../utils/documentRegistryApi';
import type { ForensicAnalysis, ForensicModelRegistry } from '../../utils/documentRegistryApi';

function riskTone(level: ForensicAnalysis['risk_level']): string {
  if (level === 'CRITICAL' || level === 'HIGH') return 'text-rose-300 border-rose-400/40 bg-rose-500/10';
  if (level === 'MEDIUM') return 'text-amber-200 border-amber-400/40 bg-amber-500/10';
  return 'text-emerald-200 border-emerald-400/40 bg-emerald-500/10';
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined) return 'Unavailable';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export const RegistryForensicsPage: React.FC = () => {
  const location = useLocation();
  const [documentId, setDocumentId] = useState('');
  const [analysis, setAnalysis] = useState<ForensicAnalysis | null>(null);
  const [history, setHistory] = useState<ForensicAnalysis[]>([]);
  const [registry, setRegistry] = useState<ForensicModelRegistry | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const requestedId = new URLSearchParams(location.search).get('id')
      || new URLSearchParams(location.search).get('docId')
      || '';
    setDocumentId(requestedId);
    setAnalysis(null);
    setHistory([]);
    setError('');
    let cancelled = false;

    getForensicModelRegistry()
      .then((result) => { if (!cancelled) setRegistry(result); })
      .catch((cause: unknown) => { if (!cancelled) setError(cause instanceof Error ? cause.message : 'Model registry is unavailable.'); });

    if (requestedId) {
      getForensicAnalysisHistory(requestedId)
        .then((result) => {
          if (cancelled) return;
          setHistory(result.items);
          setAnalysis(result.items[0] || null);
        })
        .catch((cause: unknown) => { if (!cancelled) setError(cause instanceof Error ? cause.message : 'Analysis history is unavailable.'); });
    }

    return () => { cancelled = true; };
  }, [location.search]);

  const handleAnalyze = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const target = documentId.trim();
    if (!target) return;
    setBusy(true);
    setError('');
    try {
      const result = await createForensicAnalysis(target);
      setAnalysis(result);
      const prior = await getForensicAnalysisHistory(target);
      setHistory(prior.items);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Forensic analysis could not be completed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="space-y-6 text-slate-100">
      <header className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center border border-cyan-400/30 bg-cyan-400/10 text-cyan-200">
            <FileSearch size={20} />
          </span>
          <div>
            <h1 className="text-2xl font-semibold">Forensic Analysis</h1>
            <p className="mt-1 text-sm text-slate-400">Structural and registry signals supplement cryptographic verification; they do not replace it.</p>
          </div>
        </div>
      </header>

      <form onSubmit={handleAnalyze} className="flex flex-col gap-3 border-b border-slate-800 pb-5 sm:flex-row">
        <label className="flex-1">
          <span className="mb-1 block text-xs font-medium text-slate-400">Registered document ID</span>
          <input
            value={documentId}
            onChange={(event) => setDocumentId(event.target.value)}
            placeholder="Paste a registry document ID"
            className="w-full border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-400"
          />
        </label>
        <button
          type="submit"
          disabled={busy || !documentId.trim()}
          className="inline-flex items-center justify-center gap-2 self-end border border-cyan-300/40 bg-cyan-300/10 px-4 py-2.5 text-sm font-semibold text-cyan-100 hover:bg-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? <LoaderCircle className="animate-spin" size={16} /> : <Play size={16} />}
          {busy ? 'Analyzing' : 'Run analysis'}
        </button>
      </form>

      {error && (
        <div role="alert" className="flex items-start gap-2 border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-100">
          <AlertTriangle size={17} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <section aria-labelledby="model-registry-title" className="border-b border-slate-800 pb-5">
        <div className="mb-3 flex items-center gap-2">
          <Cpu size={17} className="text-cyan-200" />
          <h2 id="model-registry-title" className="text-sm font-semibold">Model registry</h2>
        </div>
        {!registry?.models.length ? (
          <p className="text-sm text-slate-400">No trained ML artifacts are registered. The explainable rules baseline remains available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead className="text-slate-500">
                <tr><th className="pb-2 font-medium">Algorithm</th><th className="pb-2 font-medium">Version</th><th className="pb-2 font-medium">Evaluation</th><th className="pb-2 font-medium">Registered</th></tr>
              </thead>
              <tbody>
                {registry.models.map((model) => (
                  <tr key={model.model_id} className="border-t border-slate-800 text-slate-300">
                    <td className="py-2">{model.algorithm}</td>
                    <td className="py-2 font-mono">{model.version}</td>
                    <td className="py-2">{typeof model.metrics.f1 === 'number' ? `F1 ${(model.metrics.f1 * 100).toFixed(1)}%` : 'Unsupervised diagnostics'}</td>
                    <td className="py-2">{new Date(model.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {analysis ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <section className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <p className="text-xs text-slate-500">Document {analysis.document_id}</p>
                <p className="mt-1 text-xs text-slate-400">Analysis {analysis.id} · {new Date(analysis.created_at).toLocaleString()}</p>
              </div>
              <span className={`border px-3 py-1.5 text-xs font-semibold ${riskTone(analysis.risk_level)}`}>
                {analysis.risk_level} · {analysis.risk_score}/100 index
              </span>
            </div>

            <section aria-labelledby="integrity-title">
              <h2 id="integrity-title" className="mb-3 text-sm font-semibold">Cryptographic checks</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 border border-slate-800 bg-slate-950 p-3">
                  <ShieldCheck size={18} className={analysis.hash_matches ? 'text-emerald-300' : 'text-amber-300'} />
                  <div><p className="text-xs text-slate-400">SHA-256 registry match</p><p className="mt-1 text-sm">{displayValue(analysis.hash_matches)}</p></div>
                </div>
                <div className="flex items-center gap-3 border border-slate-800 bg-slate-950 p-3">
                  <ShieldCheck size={18} className={analysis.signature_valid ? 'text-emerald-300' : 'text-amber-300'} />
                  <div><p className="text-xs text-slate-400">ECDSA signature</p><p className="mt-1 text-sm">{displayValue(analysis.signature_valid)}</p></div>
                </div>
              </div>
            </section>

            <section aria-labelledby="findings-title">
              <h2 id="findings-title" className="mb-3 text-sm font-semibold">Explainable findings</h2>
              {analysis.reason_codes.length ? (
                <ul className="divide-y divide-slate-800 border-y border-slate-800">
                  {analysis.reason_codes.map((code) => <li key={code} className="py-2.5 font-mono text-xs text-amber-100">{code}</li>)}
                </ul>
              ) : <p className="text-sm text-slate-400">No rule-based structural risk signals were detected.</p>}
            </section>

            <section aria-labelledby="features-title">
              <h2 id="features-title" className="mb-3 text-sm font-semibold">Extracted features</h2>
              <dl className="grid gap-x-5 sm:grid-cols-2">
                {Object.entries(analysis.features).map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-3 border-b border-slate-800 py-2 text-xs">
                    <dt className="break-all text-slate-400">{key.replaceAll('_', ' ')}</dt>
                    <dd className="break-all text-right text-slate-200">{displayValue(value)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </section>

          <aside className="space-y-5">
            <section aria-labelledby="ml-signals-title" className="border-l-2 border-cyan-400/50 pl-4">
              <div className="mb-3 flex items-center gap-2"><Activity size={16} className="text-cyan-200" /><h2 id="ml-signals-title" className="text-sm font-semibold">ML signals</h2></div>
              {Object.keys(analysis.ml_signals).length ? Object.entries(analysis.ml_signals).map(([name, signal]) => (
                <div key={name} className="mb-3 border-b border-slate-800 pb-3">
                  <p className="text-xs font-medium text-slate-200">{name}</p>
                  <p className="mt-1 break-all font-mono text-[11px] text-slate-400">{String(signal.model_id || 'Unknown model')}</p>
                  {Object.entries(signal).filter(([key]) => key !== 'model_id' && key !== 'interpretation').map(([key, value]) => (
                    <p key={key} className="mt-1 text-xs text-cyan-100">{key.replaceAll('_', ' ')}: {displayValue(value)}</p>
                  ))}
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{String(signal.interpretation || '')}</p>
                </div>
              )) : <p className="text-xs leading-relaxed text-slate-400">No ML artifact was available for this run. The risk index is rules-based and is not a probability.</p>}
              <p className="text-[11px] text-slate-500">Baseline version: {analysis.model_version}</p>
            </section>

            <section aria-labelledby="history-title">
              <h2 id="history-title" className="mb-2 text-sm font-semibold">Analysis history ({history.length})</h2>
              <div className="max-h-72 divide-y divide-slate-800 overflow-y-auto">
                {history.map((item) => (
                  <button key={item.id} type="button" onClick={() => setAnalysis(item)} className="flex w-full items-center justify-between gap-3 py-2 text-left hover:bg-slate-900">
                    <span><span className="block text-xs text-slate-200">Run {item.id} · {item.risk_level}</span><span className="mt-1 block text-[10px] text-slate-500">{new Date(item.created_at).toLocaleString()}</span></span>
                    <span className="text-xs text-slate-400">{item.risk_score}</span>
                  </button>
                ))}
              </div>
            </section>
          </aside>
        </div>
      ) : (
        <div className="flex min-h-48 items-center justify-center border-y border-slate-800 text-center">
          <div><FileSearch size={22} className="mx-auto mb-2 text-slate-500" /><p className="text-sm text-slate-300">No analysis selected</p><p className="mt-1 text-xs text-slate-500">Enter a registered document ID to inspect its forensic signals.</p></div>
        </div>
      )}
    </main>
  );
};

export default RegistryForensicsPage;