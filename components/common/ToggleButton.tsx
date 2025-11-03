'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type ToggleButtonVariant = 'primary' | 'success' | 'danger' | 'neutral';

interface ToggleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  selected: boolean;
  onClick: () => void;
  variant?: ToggleButtonVariant;
  children: React.ReactNode;
}

export function ToggleButton({
  value,
  selected,
  onClick,
  variant = 'primary',
  children,
  className,
  disabled,
  ...props
}: ToggleButtonProps) {
  const variantStyles = {
    primary: {
      selected: 'bg-primary-600 text-white border-primary-600',
      unselected: 'bg-neutral-100 text-neutral-700 border-neutral-300 hover:bg-neutral-200',
    },
    success: {
      selected: 'bg-success-600 text-white border-success-600',
      unselected: 'bg-neutral-100 text-neutral-700 border-neutral-300 hover:bg-neutral-200',
    },
    danger: {
      selected: 'bg-danger-600 text-white border-danger-600',
      unselected: 'bg-neutral-100 text-neutral-700 border-neutral-300 hover:bg-neutral-200',
    },
    neutral: {
      selected: 'bg-neutral-600 text-white border-neutral-600',
      unselected: 'bg-neutral-100 text-neutral-700 border-neutral-300 hover:bg-neutral-200',
    },
  };

  const styles = variantStyles[variant];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        selected
          ? cn(styles.selected, 'focus:ring-primary-500')
          : cn(styles.unselected, 'focus:ring-neutral-400'),
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && !selected && 'hover:border-neutral-400',
        !disabled && selected && 'hover:opacity-90',
        className
      )}
      aria-pressed={selected}
      aria-label={`Toggle ${value}`}
      {...props}
    >
      {children}
    </button>
  );
}

