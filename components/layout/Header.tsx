'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { UserCircleIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon, ChevronDownIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { storage } from '@/lib/storage';
import { PanicButton } from '@/components/common/PanicButton';
import { ConfirmDialog } from '@/components/common/Modal';
import { Toast } from '@/components/common/Toast';
import { getPanicHandler } from '@/services/tradeService';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title?: string;
}

export function Header({ title = 'Dashboard' }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [panicConfirmOpen, setPanicConfirmOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { toast, showToast, hideToast } = useToast();
  
  const auth = storage.getAuth();
  const userName = auth?.user?.name || 'Teacher';

  const isProfilePage = pathname === '/profile';
  const isSettingsPage = pathname === '/settings';

  const handlePanic = () => {
    setPanicConfirmOpen(true);
  };

  const confirmPanic = () => {
    const panicHandler = getPanicHandler();
    const closedCount = panicHandler();
    setPanicConfirmOpen(false);
    showToast(`Closed ${closedCount} trades successfully!`, 'success');
    // Reload the page to refresh trade data across all pages
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  // Add custom pulse animation
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse-scale {
        0% {
          transform: scale(1);
          opacity: 0.75;
        }
        100% {
          transform: scale(4);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Update current date and time every second
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      
      // Format date: "Monday, 3 June"
      const dateString = now.toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
      setCurrentDate(dateString);
      
      // Format time: "9:30 AM" (without seconds)
      const timeString = now.toLocaleTimeString('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).replace(/\b(am|pm)\b/gi, (match) => match.toUpperCase());
      setCurrentTime(timeString);
    };

    updateDateTime(); // Set initial date and time
    const interval = setInterval(updateDateTime, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleLogout = () => {
    storage.clearAuth();
    router.push('/login');
  };

  return (
    <>
      <header className="fixed top-0 right-0 left-64 z-40 h-16 border-b border-neutral-200 bg-white">
        <div className="flex h-full items-center justify-between px-6">
          {/* Panic Button */}
          <div className="flex items-center">
            <PanicButton onClick={handlePanic} label="Panic Button" />
          </div>

          {/* Current Date and Time */}
          <div className="flex items-center gap-10">
            <div className="text-center">
              <div className="text-sm text-neutral-500 mb-0.5">
                {currentDate}
              </div>
              <div className="text-base font-semibold text-neutral-700">
                {currentTime}
              </div>
            </div>
            {/* Pulse Indicator - Shows system is active/live */}
            <div className="relative flex items-center justify-center" aria-label="Active status indicator">
              {/* Expanding pulse ring with larger scale */}
              <div 
                className="absolute h-2 w-2 rounded-full bg-green-500"
                style={{
                  animation: 'pulse-scale 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  // To control speed: change '2s' above
                  // Faster: use smaller value (e.g., '1s', '1.5s')
                  // Slower: use larger value (e.g., '3s', '4s')
                }}
              ></div>
              {/* Solid center dot */}
              <div className="relative h-2 w-2 rounded-full bg-green-500"></div>
            </div>
          </div>

          {/* User Dropdown */}
          <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center space-x-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-neutral-100 focus:outline-none"
          >
            <UserCircleIcon className="h-8 w-8 text-neutral-400" />
            <span className="text-neutral-700 font-medium">{userName}</span>
            <ChevronDownIcon
              className={cn(
                'h-4 w-4 text-neutral-400 transition-transform duration-200',
                isOpen && 'rotate-180'
              )}
            />
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md border border-neutral-200 bg-white shadow-lg focus:outline-none animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="py-1">
                <button
                  onClick={() => {
                    router.push('/profile');
                    setIsOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center px-4 py-2 text-sm transition-colors',
                    isProfilePage
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  )}
                >
                  <UserCircleIcon
                    className={cn(
                      'mr-3 h-5 w-5',
                      isProfilePage ? 'text-primary-600' : 'text-neutral-400'
                    )}
                  />
                  Profile
                </button>
                <button
                  onClick={() => {
                    router.push('/settings');
                    setIsOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center px-4 py-2 text-sm transition-colors',
                    isSettingsPage
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  )}
                >
                  <Cog6ToothIcon
                    className={cn(
                      'mr-3 h-5 w-5',
                      isSettingsPage ? 'text-primary-600' : 'text-neutral-400'
                    )}
                  />
                  Settings
                </button>
                <div className="border-t border-neutral-200"></div>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center px-4 py-2 text-sm text-danger-700 hover:bg-danger-50 transition-colors"
                >
                  <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
        </div>
      </header>

      {/* Panic Confirmation Dialog */}
      <ConfirmDialog
        open={panicConfirmOpen}
        onClose={() => setPanicConfirmOpen(false)}
        onConfirm={confirmPanic}
        title="Close All Trades - Panic Button"
        message="Are you sure you want to close ALL open trades for you and all your students? This action cannot be undone and will execute immediately."
        danger
        icon={<ExclamationTriangleIcon className="h-6 w-6" />}
        iconWrapperClassName="bg-danger-100 text-danger-600"
      />

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </>
  );
}

