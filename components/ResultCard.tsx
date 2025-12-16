import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ResultCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: LucideIcon;
  variant?: 'neutral' | 'positive' | 'negative';
  tooltip?: string;
}

export const ResultCard: React.FC<ResultCardProps> = ({ 
  label, 
  value, 
  subValue, 
  icon: Icon, 
  variant = 'neutral' 
}) => {
  const getColors = () => {
    switch(variant) {
      case 'positive': return 'bg-[#39FF14]/10 border-[#39FF14]/50 text-[#39FF14]';
      case 'negative': return 'bg-rose-500/10 border-rose-500/50 text-rose-400';
      default: return 'bg-slate-800 border-slate-700 text-slate-100';
    }
  };

  return (
    <div className={`relative p-5 rounded-xl border ${getColors()} transition-all duration-300`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium opacity-80 uppercase tracking-wide">{label}</h3>
        <Icon size={20} className="opacity-70" />
      </div>
      <div className="mt-2">
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {subValue && <div className="text-xs mt-1 opacity-70 font-mono">{subValue}</div>}
      </div>
    </div>
  );
};