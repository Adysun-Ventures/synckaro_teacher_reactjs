'use client';

import { useEffect } from 'react';
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
// import apiClient from '@/lib/api'; // TODO: Uncomment when integrating with API
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const router = useRouter();
  const user = getCurrentUser();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  if (!isAuthenticated()) {
    return null;
  }

  // TODO: Replace hardcoded data with API calls
  // Example: const response = await apiClient.get('/teacher/dashboard/stats');
  
  // Hardcoded dashboard data - Replace with API response
  const totalStudents = 25;
  const activeStudents = 18;
  const totalTrades = 342;
  const totalCapital = 2500000; // ₹25 Lakhs
  const totalPnL = 125000; // ₹1.25 Lakhs profit
  const wins = 198;
  const winRate = 58; // 58% win rate
  const todayTradesCount = 12;
  const todayPnL = 8500; // ₹8,500 profit today
  const pnl7d = 45000; // ₹45,000 profit in last 7 days
  const dailyVolume = 1250000; // ₹12.5 Lakhs
  const pendingOrders = 3;

  const formatCurrency = (value: number, fractionDigits = 2) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-IN').format(value);
  };

  const stats = [
    {
      name: 'Total Students',
      value: formatNumber(totalStudents),
      change: Math.round((activeStudents / totalStudents) * 100), // 72% active
      icon: UserGroupIcon,
      bgColor: 'bg-success-100',
      iconColor: 'text-success-600',
    },
    {
      name: 'Total Trades',
      value: formatNumber(totalTrades),
      change: 5, // +5% from last period
      icon: ChartBarIcon,
      bgColor: 'bg-primary-100',
      iconColor: 'text-primary-600',
    },
    {
      name: 'Total Capital',
      value: formatCurrency(totalCapital, 0),
      change: 8, // +8% growth
      icon: BanknotesIcon,
      bgColor: 'bg-warning-100',
      iconColor: 'text-warning-600',
    },
    {
      name: 'Net P&L',
      value: formatCurrency(totalPnL),
      change: 12, // +12% profit
      icon: BanknotesIcon,
      bgColor: totalPnL >= 0 ? 'bg-success-100' : 'bg-danger-100',
      iconColor: totalPnL >= 0 ? 'text-success-600' : 'text-danger-600',
    },
  ];

  const insightCards = [
    {
      title: 'Win Rate',
      description: 'Across all trades',
      value: `${winRate}%`,
      meta: `${wins} wins out of ${totalTrades}`,
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
      value: formatCurrency(todayPnL),
      meta: todayPnL >= 0 ? 'Profit today' : 'Loss today',
      tone: todayPnL >= 0 ? ('success' as const) : ('warning' as const),
      icon: BanknotesIcon,
    },
  ];

  // Hardcoded report highlights - Replace with API response
  const reportHighlights = [
    {
      label: 'Daily Volume',
      value: formatCurrency(dailyVolume, 0),
      delta: '+4.3%',
      positive: true,
    },
    {
      label: 'Net P&L (7d)',
      value: formatCurrency(pnl7d),
      delta: '+1.8%',
      positive: true,
    },
    {
      label: 'Total Capital',
      value: formatCurrency(totalCapital, 0),
      delta: '+2.1%',
      positive: true,
    },
    {
      label: 'Orders Pending',
      value: formatNumber(pendingOrders),
      delta: `+${pendingOrders}`,
      positive: false,
    },
  ];

  // Hardcoded report breakdown by stock/strategy - Replace with API response
  const reportBreakdown = [
    {
      segment: 'RELIANCE',
      trades: 45,
      winRate: '62%',
      pnl: formatCurrency(25000),
      positive: true,
    },
    {
      segment: 'TCS',
      trades: 38,
      winRate: '55%',
      pnl: formatCurrency(18000),
      positive: true,
    },
    {
      segment: 'INFY',
      trades: 32,
      winRate: '68%',
      pnl: formatCurrency(22000),
      positive: true,
    },
    {
      segment: 'HDFC',
      trades: 28,
      winRate: '50%',
      pnl: formatCurrency(-5000),
      positive: false,
    },
  ];

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
              <p className="text-xs font-medium text-neutral-500">Updated 5 minutes ago</p>
            </div>
          }
          footer={<span className="text-xs text-neutral-400">Synthetic data for demonstration purposes.</span>}
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
