'use client';

import { useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type?: ToastType;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type = 'info', isVisible, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const icons = {
    success: CheckCircleIcon,
    error: XCircleIcon,
    info: InformationCircleIcon,
    warning: ExclamationTriangleIcon,
  };

  const styles = {
    success: {
      bg: 'bg-success-50',
      border: 'border-success-200',
      text: 'text-success-800',
      icon: 'text-success-600',
    },
    error: {
      bg: 'bg-danger-50',
      border: 'border-danger-200',
      text: 'text-danger-800',
      icon: 'text-danger-600',
    },
    info: {
      bg: 'bg-primary-50',
      border: 'border-primary-200',
      text: 'text-primary-800',
      icon: 'text-primary-600',
    },
    warning: {
      bg: 'bg-warning-50',
      border: 'border-warning-200',
      text: 'text-warning-800',
      icon: 'text-warning-600',
    },
  };

  const Icon = icons[type];
  const style = styles[type];

  return (
    <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
      <div
        className={cn(
          'flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg',
          'min-w-[300px] max-w-[400px]',
          style.bg,
          style.border
        )}
      >
        <Icon className={cn('h-5 w-5 flex-shrink-0', style.icon)} />
        <p className={cn('flex-1 text-sm font-medium', style.text)}>{message}</p>
        <button
          onClick={onClose}
          className={cn('flex-shrink-0 rounded-md p-1 transition-colors hover:bg-black/5', style.text)}
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

