'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EnvelopeIcon, PhoneIcon, CalendarIcon, ClockIcon, ChartBarIcon, Cog6ToothIcon, ComputerDesktopIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Avatar } from '@/components/common/Avatar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { isAuthenticated, getCurrentUser } from '@/services/authService';

export default function ProfilePage() {
  const router = useRouter();
  const user = getCurrentUser();

  // Check auth
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  if (!isAuthenticated() || !user) {
    return null;
  }

  // Dummy recent activity
  const recentActivity = [
    { action: 'Logged in', timestamp: new Date().toISOString(), location: 'Mumbai, India' },
    { action: 'Viewed teacher details', timestamp: new Date(Date.now() - 3600000).toISOString(), location: 'Mumbai, India' },
    { action: 'Deleted teacher', timestamp: new Date(Date.now() - 7200000).toISOString(), location: 'Mumbai, India' },
    { action: 'Logged in', timestamp: new Date(Date.now() - 86400000).toISOString(), location: 'Mumbai, India' },
  ];

  // Login activity with devices
  const loginActivity = [
    {
      device: 'Chrome on Windows',
      browser: 'Chrome',
      os: 'Windows 11',
      location: 'Mumbai, India',
      ip: '192.168.1.100',
      timestamp: new Date().toISOString(),
      icon: ComputerDesktopIcon,
    },
    {
      device: 'Safari on macOS',
      browser: 'Safari',
      os: 'macOS Sonoma',
      location: 'Mumbai, India',
      ip: '192.168.1.101',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      icon: ComputerDesktopIcon,
    },
    {
      device: 'Mobile Browser',
      browser: 'Chrome Mobile',
      os: 'Android 13',
      location: 'Mumbai, India',
      ip: '192.168.1.102',
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      icon: DevicePhoneMobileIcon,
    },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  return (
    <DashboardLayout title="Profile">
      <div className="space-y-6">
        {/* Profile Card */}
        <Card gradient gradientFrom="from-indigo-900" gradientVia="via-indigo-600" gradientTo="to-purple-300" padding="lg">
          <div className="flex flex-col gap-6 text-white md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <Avatar name={user.name} size="2xl" showStatus statusColor="success" />
              <div>
                <div className="mb-2 flex items-center gap-3">
                  <h1 className="text-3xl font-bold">{user.name}</h1>
                  <StatusBadge status="active" className="border-white/40 bg-white/20 text-white" />
                </div>
                <div className="flex flex-wrap items-center gap-4 text-indigo-100">
                  <div className="flex items-center gap-2">
                    <EnvelopeIcon className="h-4 w-4" />
                    <span>{user.email || 'teacher@synckaro.com'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <PhoneIcon className="h-4 w-4" />
                    <span>{user.mobile}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ChartBarIcon className="h-4 w-4" />
                    <span>Teacher</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push('/settings')}
                className="border-white/40 bg-white/20 text-white hover:bg-white/30"
              >
                <Cog6ToothIcon className="h-4 w-4 mr-1.5" />
                Edit
              </Button>
            </div>
          </div>
        </Card>

        {/* Account Information */}
        <Card padding="lg">
          <h3 className="text-lg font-semibold text-neutral-900 mb-6">Account Information</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="bg-neutral-100 p-2 rounded-lg">
                  <EnvelopeIcon className="h-5 w-5 text-neutral-600" />
                </div>
                <div className="flex-1">
                  <p className="text-lg font-semibold text-neutral-900">{user.email || 'teacher@synckaro.com'}</p>
                  <p className="text-xs uppercase tracking-wide text-neutral-500 mt-1">Email Address</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="bg-neutral-100 p-2 rounded-lg">
                  <PhoneIcon className="h-5 w-5 text-neutral-600" />
                </div>
                <div className="flex-1">
                  <p className="text-lg font-semibold text-neutral-900">{user.mobile}</p>
                  <p className="text-xs uppercase tracking-wide text-neutral-500 mt-1">Mobile Number</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="bg-neutral-100 p-2 rounded-lg">
                  <CalendarIcon className="h-5 w-5 text-neutral-600" />
                </div>
                <div className="flex-1">
                  <p className="text-lg font-semibold text-neutral-900">{formatDate(new Date(2024, 0, 1).toISOString())}</p>
                  <p className="text-xs uppercase tracking-wide text-neutral-500 mt-1">Account Created</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="bg-neutral-100 p-2 rounded-lg">
                  <ChartBarIcon className="h-5 w-5 text-neutral-600" />
                </div>
                <div className="flex-1">
                  <p className="text-lg font-semibold text-neutral-900 capitalize">{user.role}</p>
                  <p className="text-xs uppercase tracking-wide text-neutral-500 mt-1">Role</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card padding="lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-neutral-900">Recent Activity</h3>
            <span className="text-sm text-neutral-500">Last 24 hours</span>
          </div>

          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-4 pb-4 border-b border-neutral-100 last:border-0">
                <div className="bg-primary-100 p-2 rounded-lg">
                  <ClockIcon className="h-5 w-5 text-primary-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-neutral-900">{activity.action}</p>
                  <p className="text-sm text-neutral-500">
                    {activity.location} • {formatDate(activity.timestamp)} at {formatTime(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Account Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Quick Stats */}
          <Card padding="sm">
            <div className="flex items-center gap-3">
              <div className="bg-primary-100 p-2 rounded-lg">
                <CalendarIcon className="h-4 w-4 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-semibold text-neutral-900">Jan 2024</p>
                <p className="text-[10px] uppercase tracking-wide text-neutral-500 mt-0.5">Platform Since</p>
              </div>
            </div>
          </Card>
          <Card padding="sm">
            <div className="flex items-center gap-3">
              <div className="bg-success-100 p-2 rounded-lg">
                <ChartBarIcon className="h-4 w-4 text-success-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-semibold text-neutral-900">127</p>
                <p className="text-[10px] uppercase tracking-wide text-neutral-500 mt-0.5">Total Logins</p>
              </div>
            </div>
          </Card>
          <Card padding="sm">
            <div className="flex items-center gap-3">
              <div className="bg-warning-100 p-2 rounded-lg">
                <ClockIcon className="h-4 w-4 text-warning-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-semibold text-neutral-900">Today</p>
                <p className="text-[10px] uppercase tracking-wide text-neutral-500 mt-0.5">Last Login</p>
              </div>
            </div>
          </Card>
          <Card padding="sm">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 p-2 rounded-lg">
                <DevicePhoneMobileIcon className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-semibold text-neutral-900">{loginActivity.length}</p>
                <p className="text-[10px] uppercase tracking-wide text-neutral-500 mt-0.5">Active Devices</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Login Devices */}
        <Card padding="md">
          <h3 className="text-sm font-semibold text-neutral-900 mb-4">Login Devices</h3>
          <div className="space-y-3">
            {loginActivity.map((activity, index) => {
              const IconComponent = activity.icon;
              return (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-100/50 transition-colors">
                  <div className="bg-primary-100 p-2 rounded-lg flex-shrink-0">
                    <IconComponent className="h-4 w-4 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-900 truncate">{activity.device}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                      <span>{activity.browser}</span>
                      <span>•</span>
                      <span>{activity.os}</span>
                      <span>•</span>
                      <span className="truncate">{activity.location}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-medium text-neutral-700">{formatRelativeTime(activity.timestamp)}</p>
                    <p className="text-[10px] text-neutral-500 mt-0.5">{activity.ip}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

