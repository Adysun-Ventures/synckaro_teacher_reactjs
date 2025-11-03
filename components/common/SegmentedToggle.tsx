'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type SegmentedToggleVariant = 'primary' | 'success' | 'danger' | 'warning';

interface SegmentedToggleOption {
  value: string;
  label: string;
}

interface SegmentedToggleProps {
  options: [SegmentedToggleOption, SegmentedToggleOption];
  value: string;
  onChange: (value: string) => void;
  variant?: SegmentedToggleVariant | ((value: string) => SegmentedToggleVariant);
  className?: string;
}

export function SegmentedToggle({
  options,
  value,
  onChange,
  variant = 'primary',
  className,
}: SegmentedToggleProps) {
  const [option1, option2] = options;
  const selectedIndex = value === option1.value ? 0 : 1;

  // Get variant based on value if variant is a function
  const getVariant = (): SegmentedToggleVariant => {
    if (typeof variant === 'function') {
      return variant(value);
    }
    return variant;
  };

  const currentVariant = getVariant();

  const variantStyles = {
    primary: 'bg-primary-600 text-white',
    success: 'bg-success-600 text-white',
    danger: 'bg-danger-600 text-white',
    warning: 'bg-warning-600 text-white',
  };

  const handleClick = (optionValue: string) => {
    if (optionValue !== value) {
      onChange(optionValue);
    }
  };

  return (
    <div
      className={cn(
        'relative flex rounded-full bg-neutral-200 p-1',
        'transition-all duration-200',
        className
      )}
      role="tablist"
      aria-label="Segmented toggle"
    >
      {/* Background indicator for selected option */}
      <div
        className={cn(
          'absolute top-1 bottom-1 rounded-full transition-all duration-200 ease-in-out',
          selectedIndex === 0 ? 'left-1 right-1/2' : 'left-1/2 right-1',
          variantStyles[currentVariant]
        )}
        aria-hidden="true"
      />

      {/* Option 1 */}
      <button
        type="button"
        onClick={() => handleClick(option1.value)}
        className={cn(
          'relative z-10 flex-1 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
          selectedIndex === 0
            ? 'text-white'
            : 'text-neutral-700 hover:text-neutral-900'
        )}
        role="tab"
        aria-selected={selectedIndex === 0}
        aria-controls={`segment-${option1.value}`}
        id={`segment-${option1.value}`}
      >
        {option1.label}
      </button>

      {/* Option 2 */}
      <button
        type="button"
        onClick={() => handleClick(option2.value)}
        className={cn(
          'relative z-10 flex-1 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
          selectedIndex === 1
            ? 'text-white'
            : 'text-neutral-700 hover:text-neutral-900'
        )}
        role="tab"
        aria-selected={selectedIndex === 1}
        aria-controls={`segment-${option2.value}`}
        id={`segment-${option2.value}`}
      >
        {option2.label}
      </button>
    </div>
  );
}

