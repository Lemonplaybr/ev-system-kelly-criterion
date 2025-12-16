import React from 'react';

interface InputGroupProps {
  label: string;
  value: number | string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  step?: string;
  placeholder?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

export const InputGroup: React.FC<InputGroupProps> = ({ 
  label, 
  value, 
  onChange, 
  type = "number", 
  step = "0.01", 
  placeholder,
  prefix,
  suffix
}) => {
  return (
    <div className="flex flex-col space-y-2">
      <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">{label}</label>
      <div className="relative flex items-center">
        {prefix && (
          <div className="absolute left-3 text-slate-500 pointer-events-none">
            {prefix}
          </div>
        )}
        <input
          type={type}
          step={step}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full bg-slate-900 border border-slate-700 text-white rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#39FF14] focus:border-transparent transition-all font-mono text-lg ${prefix ? 'pl-10' : ''} ${suffix ? 'pr-10' : ''}`}
        />
        {suffix && (
          <div className="absolute right-3 text-slate-500 pointer-events-none">
            {suffix}
          </div>
        )}
      </div>
    </div>
  );
};