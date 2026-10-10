import React from 'react';

interface IssuerHeaderProps {
  title: string;
  description: string;
  badge?: string;
  badgeColor?: string;
  actions?: React.ReactNode;
}

export const IssuerHeader: React.FC<IssuerHeaderProps> = ({
  title,
  description,
  badge = 'AUTHORIZED ISSUER AUTHORITY',
  badgeColor = 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  actions
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
      <div>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${badgeColor}`}>
            {badge}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1.5 font-sans">
          {title}
        </h1>
        <p className="text-xs text-slate-400 mt-0.5 max-w-3xl leading-relaxed">
          {description}
        </p>
      </div>
      {actions && (
        <div className="flex items-center gap-2.5 flex-shrink-0 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
};
