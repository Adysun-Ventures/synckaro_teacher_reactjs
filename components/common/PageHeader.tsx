'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface PageHeaderProps {
  title: string;
  onBack?: () => void;
  rightContent?: ReactNode;
}

export function PageHeader({ title, onBack, rightContent }: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <div className="grid grid-cols-3 items-center mb-4 gap-4">
      {/* Back Button - Left */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex h-9 items-center gap-2 rounded-3xl border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back
        </button>
      </div>

      {/* Title - Center */}
      <div className="flex justify-center">
        <h2 className="text-xl font-semibold text-neutral-900">{title}</h2>
      </div>

      {/* Right Content - Optional */}
      <div className="flex items-center justify-end">
        {rightContent || null}
      </div>
    </div>
  );
}

