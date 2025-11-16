import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input: React.FC<InputProps> = ({ className, ...props }) => {
  return (
    <input
      className={`w-full bg-slate-900/70 border border-purple-500/30 rounded-md px-3 py-2 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 transition disabled:bg-slate-700/50 disabled:cursor-not-allowed ${className}`}
      {...props}
    />
  );
};