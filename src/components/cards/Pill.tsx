import React from 'react';
import { cn } from '@/lib/utils';

interface PillProps {
  children: React.ReactNode;
  variant?: 'default' | 'accent' | 'secondary';
  className?: string;
}

export const Pill: React.FC<PillProps> = ({ 
  children, 
  variant = 'default',
  className 
}) => {
  const variants = {
    default: "parish-pill",
    accent: "bg-accent/10 text-accent border-accent/20",
    secondary: "bg-secondary/10 text-secondary border-secondary/20"
  };

  return (
    <span className={cn(
      "inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
};