import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div
      className={`bg-black/30 backdrop-blur-md border border-purple-500/30 rounded-xl shadow-lg shadow-purple-900/20 transition-all duration-300 hover:border-purple-500/50 ${className}`}
    >
      {children}
    </div>
  );
};