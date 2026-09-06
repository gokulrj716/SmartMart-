import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'brand',
  size = 'md',
  ...props
}) => {
  const base = 'inline-flex items-center font-medium rounded-full';

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1'
  };

  const variants = {
    brand: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
    success: 'bg-teal-50 text-teal-700 border border-teal-200/60',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200/60',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200/60',
    info: 'bg-sky-50 text-sky-700 border border-sky-200/60',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200/60',
    purple: 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
  };

  return (
    <span className={twMerge(clsx(base, sizes[size], variants[variant], className))} {...props}>
      {children}
    </span>
  );
};
