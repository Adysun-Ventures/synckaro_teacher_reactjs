'use client';

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface PanicButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export function PanicButton({ onClick, label = 'Panic Button', className }: PanicButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border-2 border-danger-500',
        'bg-danger-50 px-4 py-2 text-base font-semibold text-danger-700',
        'transition-all duration-200 focus:outline-none focus:ring-2',
        'focus:ring-danger-500 focus:ring-offset-2 active:scale-[0.98]',
        className
      )}
    >
      <ExclamationTriangleIcon className="h-5 w-5 text-danger-600" />
      <span>{label}</span>
    </button>
  );
}

