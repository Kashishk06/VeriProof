import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const s = (status || '').toUpperCase();
  
  let colorClass = 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  
  if (['VERIFIED', 'APPROVED', 'ACTIVE', 'SUCCESS', 'MATCHED'].includes(s)) {
    colorClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  } else if (['PENDING', 'MANUAL REVIEW', 'UNDER REVIEW', 'WARNING', 'INVESTIGATING'].includes(s)) {
    colorClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  } else if (['REJECTED', 'SUSPENDED', 'CRITICAL', 'TAMPERED', 'REVOKED', 'FAILED', 'MISMATCH', 'MISMATCHED', 'INVALID'].includes(s)) {
    colorClass = 'bg-red-500/10 text-red-400 border-red-500/20';
  } else if (['SUSPICIOUS', 'FLAGGED'].includes(s)) {
    colorClass = 'bg-orange-500/10 text-orange-400 border-orange-500/20';
  } else if (['SUPER ADMIN', 'ADMIN'].includes(s)) {
    colorClass = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
  } else if (['ISSUER'].includes(s)) {
    colorClass = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  } else if (['VERIFIER'].includes(s)) {
    colorClass = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider border ${colorClass}`}>
      {s}
    </span>
  );
};
