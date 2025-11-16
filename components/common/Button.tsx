import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ children, className, ...props }) => {
  return (
    <button
      className={`flex items-center justify-center gap-2 px-4 py-2 bg-fuchsia-600 text-white font-semibold rounded-lg shadow-md hover:bg-fuchsia-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-fuchsia-500 shadow-fuchsia-500/20 hover:shadow-fuchsia-500/40 hover:shadow-lg ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};