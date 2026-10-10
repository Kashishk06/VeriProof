import React from 'react';
import StarBorder from './StarBorder';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  trendUp,
  color = '#8b5cf6'
}) => {
  return (
    <StarBorder
      as="div"
      className="w-full h-full"
      innerClassName="p-5 flex flex-col justify-between relative overflow-hidden group"
      color={color}
      speed="6s"
      thickness={1}
      backgroundColor="#0B1020"
      borderColor="rgba(255, 255, 255, 0.08)"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-bl-full pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
          {icon}
        </div>
        {trend && (
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${trendUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
            {trend}
          </span>
        )}
      </div>
      
      <div className="relative z-10">
        <h4 className="text-3xl font-black text-white font-mono tracking-tight">{value}</h4>
        <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">{title}</p>
      </div>
    </StarBorder>
  );
};

export default StatCard;
