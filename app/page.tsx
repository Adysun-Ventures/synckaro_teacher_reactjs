'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserGroupIcon,
  ChartBarIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  TrophyIcon,
  ShieldExclamationIcon,
} from '@heroicons/react/24/outline';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/common/Card';
import { isAuthenticated, getCurrentUser } from '@/services/authService';
import apiClient from '@/lib/api';
import { cn } from '@/lib/utils';

interface DashboardData {
  summary: {
    total_students: { count: number; change_percentage: number };
    total_trades: { count: number; change_percentage: number };
    total_capital: { amount: string; change_percentage: number };
    net_pnl: { amount: string; change_percentage: number };
  };
  reports_overview: {
    daily_volume: { amount: string; change_percentage: number };
    net_pnl_7d: { amount: string; change_percentage: number };
    total_capital: { amount: string; change_percentage: number };
    orders_pending: number;
  };
  strategy_desk: Array<{
    strategy: string;
    trades: number;
    win_rate: string;
    net_pnl: string;
  }>;
  trading_insights: {
    win_rate: { percentage: number; details: string };
    active_students: { count: number; total: number };
    net_pnl_today: { amount: string; trades: number };
  };
  last_updated: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const user = getCurrentUser();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  // Extract teacher ID to avoid dependency on entire user object
  const teacherId = user?.id ? parseInt(user.id, 10) : null;

  const fetchDashboardData = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (hasFetchedRef.current) {
      return;
    }

    try {
      hasFetchedRef.current = true;
      setLoading(true);
      setError(null);
      
      if (!teacherId || isNaN(teacherId)) {
        throw new Error('Invalid teacher ID');
      }

      const response = await apiClient.post<{ status: boolean; data: DashboardData }>(
        '/teacher/home',
        {
          teacher_id: teacherId,
        }
      );
      
      if (response.data && response.data.status && response.data.data) {
        setDashboardData(response.data.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err?.error || err?.message || 'Failed to load dashboard data');
      hasFetchedRef.current = false; // Allow retry on error
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    if (teacherId && !hasFetchedRef.current) {
      fetchDashboardData();
    }
  }, [router, teacherId, fetchDashboardData]);

  if (!isAuthenticated()) {
    return null;
  }

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <p className="text-neutral-500">Loading dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !dashboardData) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-danger-600 mb-2">{error || 'Failed to load dashboard data'}</p>
            <button
              onClick={() => {
                hasFetchedRef.current = false;
                fetchDashboardData();
              }}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Helper function to parse currency string to number (for comparison)
  const parseCurrency = (formattedString: string): number => {
    return parseFloat(formattedString.replace(/[₹,\s]/g, '')) || 0;
  };

  // Helper function to format last updated time
  const formatLastUpdated = (isoString: string): string => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    return date.toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
  };

  // Extract data from API response
  const totalStudents = dashboardData.summary.total_students.count;
  const activeStudents = dashboardData.trading_insights.active_students.count;
  const totalTrades = dashboardData.summary.total_trades.count;
  const totalCapitalAmount = dashboardData.summary.total_capital.amount;
  const totalPnLAmount = dashboardData.summary.net_pnl.amount;
  const winRate = dashboardData.trading_insights.win_rate.percentage;
  const winRateDetails = dashboardData.trading_insights.win_rate.details;
  const todayTradesCount = dashboardData.trading_insights.net_pnl_today.trades;
  const todayPnLAmount = dashboardData.trading_insights.net_pnl_today.amount;
  const pnl7dAmount = dashboardData.reports_overview.net_pnl_7d.amount;
  const dailyVolumeAmount = dashboardData.reports_overview.daily_volume.amount;
  const pendingOrders = dashboardData.reports_overview.orders_pending;

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-IN').format(value);
  };

  // Parse P&L to determine if positive
  const totalPnLValue = parseCurrency(totalPnLAmount);
  const todayPnLValue = parseCurrency(todayPnLAmount);

  const stats = [
    {
      name: 'Total Students',
      value: formatNumber(totalStudents),
      change: dashboardData.summary.total_students.change_percentage,
      icon: UserGroupIcon,
      bgColor: 'bg-success-100',
      iconColor: 'text-success-600',
    },
    {
      name: 'Total Trades',
      value: formatNumber(totalTrades),
      change: dashboardData.summary.total_trades.change_percentage,
      icon: ChartBarIcon,
      bgColor: 'bg-primary-100',
      iconColor: 'text-primary-600',
    },
    {
      name: 'Total Capital',
      value: totalCapitalAmount,
      change: dashboardData.summary.total_capital.change_percentage,
      icon: BanknotesIcon,
      bgColor: 'bg-warning-100',
      iconColor: 'text-warning-600',
    },
    {
      name: 'Net P&L',
      value: totalPnLAmount,
      change: dashboardData.summary.net_pnl.change_percentage,
      icon: BanknotesIcon,
      bgColor: totalPnLValue >= 0 ? 'bg-success-100' : 'bg-danger-100',
      iconColor: totalPnLValue >= 0 ? 'text-success-600' : 'text-danger-600',
    },
  ];

  const insightCards = [
    {
      title: 'Win Rate',
      description: 'Across all trades',
      value: `${winRate}%`,
      meta: winRateDetails,
      tone: winRate >= 50 ? ('success' as const) : ('warning' as const),
      icon: TrophyIcon,
    },
    {
      title: 'Active Students',
      description: 'Currently active',
      value: formatNumber(activeStudents),
      meta: `out of ${totalStudents} total`,
      tone: 'success' as const,
      icon: UserGroupIcon,
    },
    {
      title: 'Net P&L (Today)',
      description: `Across ${todayTradesCount} trades`,
      value: todayPnLAmount,
      meta: todayPnLValue >= 0 ? 'Profit today' : 'Loss today',
      tone: todayPnLValue >= 0 ? ('success' as const) : ('warning' as const),
      icon: BanknotesIcon,
    },
  ];

  // Report highlights from API
  const reportHighlights = [
    {
      label: 'Daily Volume',
      value: dailyVolumeAmount,
      delta: `${dashboardData.reports_overview.daily_volume.change_percentage >= 0 ? '+' : ''}${dashboardData.reports_overview.daily_volume.change_percentage}%`,
      positive: dashboardData.reports_overview.daily_volume.change_percentage >= 0,
    },
    {
      label: 'Net P&L (7d)',
      value: pnl7dAmount,
      delta: `${dashboardData.reports_overview.net_pnl_7d.change_percentage >= 0 ? '+' : ''}${dashboardData.reports_overview.net_pnl_7d.change_percentage}%`,
      positive: dashboardData.reports_overview.net_pnl_7d.change_percentage >= 0,
    },
    {
      label: 'Total Capital',
      value: dashboardData.reports_overview.total_capital.amount,
      delta: `${dashboardData.reports_overview.total_capital.change_percentage >= 0 ? '+' : ''}${dashboardData.reports_overview.total_capital.change_percentage}%`,
      positive: dashboardData.reports_overview.total_capital.change_percentage >= 0,
    },
    {
      label: 'Orders Pending',
      value: formatNumber(pendingOrders),
      delta: pendingOrders > 0 ? `+${pendingOrders}` : '0',
      positive: false,
    },
  ];

  // Report breakdown from API (strategy_desk)
  const reportBreakdown = dashboardData.strategy_desk.map((item) => ({
    segment: item.strategy,
    trades: item.trades,
    winRate: item.win_rate,
    pnl: item.net_pnl,
    positive: !item.net_pnl.startsWith('-'),
  }));

  return (
    <DashboardLayout title="Dashboard">
      {/* Welcome Card */}
      <div className="bg-primary-600 rounded-xl p-6 mb-6 text-white">
        <h2 className="text-2xl font-semibold mb-2">
          Welcome back, {user?.name || 'Teacher'}! 👋
        </h2>
        <p className="text-primary-100">
          Here's what's happening with your trading dashboard today
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-xl border border-neutral-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
              {/* Percentage Change Indicator */}
              <div className={cn(
                'flex items-center gap-1 text-xs font-semibold',
                stat.change >= 0 ? 'text-success-600' : 'text-danger-600'
              )}>
                {stat.change >= 0 ? (
                  <ArrowTrendingUpIcon className="h-3.5 w-3.5" />
                ) : (
                  <ArrowTrendingDownIcon className="h-3.5 w-3.5" />
                )}
                <span>{Math.abs(stat.change)}%</span>
              </div>
            </div>
            <p className="text-xs text-neutral-500 mb-1 uppercase tracking-wide">{stat.name}</p>
            <p className="text-2xl font-semibold text-neutral-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
        <Card
          padding="lg"
          tone="neutral"
          hover
          header={
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">Reports Overview</h3>
              <p className="text-xs font-medium text-neutral-500">
                Updated {dashboardData ? formatLastUpdated(dashboardData.last_updated) : 'recently'}
              </p>
            </div>
          }
          footer={<span className="text-xs text-neutral-400">Data from API</span>}
        >
          <div className="grid gap-4 md:grid-cols-2">
            {reportHighlights.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-neutral-200 bg-white/80 px-4 py-3 shadow-sm"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{item.label}</p>
                <div className="mt-2 flex items-end justify-between">
                  <p className="text-2xl font-semibold text-neutral-900">{item.value}</p>
                  <span
                    className={cn(
                      'text-xs font-semibold',
                      item.positive ? 'text-success-600' : 'text-danger-600'
                    )}
                  >
                    {item.delta}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white/90">
            <div className="grid grid-cols-[1.5fr_repeat(3,1fr)] gap-3 border-b border-neutral-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
              <span>Strategy / Desk</span>
              <span className="text-right">Trades</span>
              <span className="text-right">Win Rate</span>
              <span className="text-right">Net P&L</span>
            </div>
            <div className="divide-y divide-neutral-100">
              {reportBreakdown.map((row) => (
                <div key={row.segment} className="grid grid-cols-[1.5fr_repeat(3,1fr)] items-center gap-3 px-4 py-3 text-sm">
                  <span className="font-medium text-neutral-800">{row.segment}</span>
                  <span className="justify-self-end text-neutral-700">{row.trades}</span>
                  <span className="justify-self-end text-neutral-700">{row.winRate}</span>
                  <span
                    className={cn(
                      'justify-self-end font-semibold',
                      row.positive ? 'text-success-600' : 'text-danger-600'
                    )}
                  >
                    {row.pnl}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card
          padding="lg"
          tone="neutral"
          hover
          header={<h3 className="text-lg font-semibold text-neutral-900">Trading Insights</h3>}
        >
          <div className="flex flex-col gap-3">
            {insightCards.map((card) => {
              const toneStyles = {
                success: {
                  iconBg: 'bg-success-50 text-success-700 border-success-200',
                  valueColor: 'text-success-600',
                },
                warning: {
                  iconBg: 'bg-warning-50 text-warning-700 border-warning-200',
                  valueColor: 'text-warning-700',
                },
                neutral: {
                  iconBg: 'bg-neutral-50 text-neutral-600 border-neutral-200',
                  valueColor: 'text-neutral-900',
                },
              } as const;

              const tone = toneStyles[card.tone] || toneStyles.neutral;

              return (
                <div
                  key={card.title}
                  className="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50/70 px-3.5 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg border', tone.iconBg)}>
                      <card.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                        {card.title}
                      </p>
                      <p className="text-sm font-semibold text-neutral-900">{card.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn('text-sm font-semibold', tone.valueColor)}>{card.value}</p>
                    <p className="text-[11px] text-neutral-400">{card.meta}</p>
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
