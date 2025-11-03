'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ScaleIcon,
  PresentationChartLineIcon,
  AdjustmentsHorizontalIcon,
  ShieldCheckIcon,
  FireIcon,
} from '@heroicons/react/24/outline';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ReferenceLine,
} from 'recharts';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/common/Card';
import { isAuthenticated, getCurrentUser } from '@/services/authService';
import { storage } from '@/lib/storage';
import { Trade, Student } from '@/types';
import { cn } from '@/lib/utils';

const deskContribution = [
  { desk: 'Momentum', weight: 32, color: '#16a34a' },
  { desk: 'Arbitrage', weight: 24, color: '#2563eb' },
  { desk: 'Options', weight: 18, color: '#f59e0b' },
  { desk: 'Swing', weight: 14, color: '#6366f1' },
  { desk: 'Discretionary', weight: 12, color: '#64748b' },
];

const sectorExposure = [
  { sector: 'Banks', change: 3.2 },
  { sector: 'IT', change: -1.4 },
  { sector: 'Pharma', change: 2.1 },
  { sector: 'Energy', change: 1.6 },
  { sector: 'Auto', change: -0.8 },
  { sector: 'Metals', change: 0.9 },
];

const profitDistribution = [
  { label: 'Alpha Desks', value: 2.6, display: '+₹ 2.6Cr', delta: '+7.6%', positive: true },
  { label: 'Market Making', value: 1.3, display: '+₹ 1.3Cr', delta: '+3.1%', positive: true },
  { label: 'Advisory', value: 0.8, display: '+₹ 0.8Cr', delta: '-1.4%', positive: false },
];

const profitPieData = profitDistribution.map(({ label, value }) => ({ name: label, value }));
const pieColors = ['#16a34a', '#2563eb', '#f59e0b'];

function EquityTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) {
    return null;
  }

  const [{ value }] = payload;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-neutral-700">₹ {value.toFixed(1)}Cr</p>
      <p className="text-neutral-500">{label}</p>
    </div>
  );
}

function DeskContributionTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const [{ value, payload: data }] = payload;
  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-neutral-700">{data.desk}</p>
      <p className="text-neutral-500">Contribution: {value}%</p>
    </div>
  );
}

function OrderFlowTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const buys = payload.find((item: any) => item.dataKey === 'Buys')?.value ?? 0;
  const sells = payload.find((item: any) => item.dataKey === 'Sells')?.value ?? 0;
  // For diverging chart, Sells will be negative, so take absolute value
  const sellsAbsolute = Math.abs(sells);
  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-neutral-700">{label}</p>
      <p className="text-success-600">Buys: {buys}%</p>
      <p className="text-danger-600">Sells: {sellsAbsolute}%</p>
    </div>
  );
}

function ProfitTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const [{ name, value }] = payload;
  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-neutral-700">{name}</p>
      <p className="text-neutral-500">₹ {Number(value).toFixed(2)}Cr</p>
    </div>
  );
}

export default function ReportsPage() {
  const router = useRouter();
  const user = getCurrentUser();
  const teacherId = user?.id || '';

  const [trades, setTrades] = useState<Trade[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    if (teacherId) {
      // Load teacher's trades
      const allTrades = (storage.getItem('trades') || []) as Trade[];
      const teacherTrades = allTrades
        .filter((t) => t.teacherId === teacherId)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setTrades(teacherTrades);

      // Load teacher's students
      const allStudents = (storage.getItem('students') || []) as Student[];
      const teacherStudents = allStudents.filter((s) => s.teacherId === teacherId);
      setStudents(teacherStudents);
    }
  }, [teacherId]);

  if (!isAuthenticated() || !teacherId) {
    return null;
  }

  // Calculate teacher's metrics
  const formatCurrency = (value: number, fractionDigits = 0) => {
    if (value >= 10000000) {
      return `₹ ${(value / 10000000).toFixed(fractionDigits)}Cr`;
    } else if (value >= 100000) {
      return `₹ ${(value / 100000).toFixed(fractionDigits)}L`;
    }
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

  // Calculate metrics
  const totalVolume = useMemo(() => {
    return trades.reduce((sum, t) => sum + ((t.price || 0) * t.quantity), 0);
  }, [trades]);

  const totalPnL = useMemo(() => {
    return trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  }, [trades]);

  const wins = trades.filter((t) => (t.pnl || 0) > 0).length;
  const winRate = trades.length > 0 ? Math.round((wins / trades.length) * 100) : 0;

  const totalCapital = useMemo(() => {
    return students.reduce((sum, s) => sum + (s.currentCapital || s.initialCapital || 0), 0);
  }, [students]);

  // Calculate MTD volume (this month)
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const mtdTrades = useMemo(() => {
    return trades.filter((t) => new Date(t.createdAt) >= firstDayOfMonth);
  }, [trades, firstDayOfMonth]);

  const mtdVolume = useMemo(() => {
    return mtdTrades.reduce((sum, t) => sum + ((t.price || 0) * t.quantity), 0);
  }, [mtdTrades]);

  const summaryMetrics = [
    {
      label: 'Gross Volume (MTD)',
      value: formatCurrency(mtdVolume, 1),
      delta: '+6.3%', // Placeholder
      positive: true,
      icon: BanknotesIcon,
    },
    {
      label: 'Net Realized P&L',
      value: formatCurrency(totalPnL, 1),
      delta: totalPnL >= 0 ? '+2.8%' : '-2.8%',
      positive: totalPnL >= 0,
      icon: PresentationChartLineIcon,
    },
    {
      label: 'Win Rate',
      value: `${winRate}%`,
      delta: winRate >= 50 ? '+1.7%' : '-1.7%',
      positive: winRate >= 50,
      icon: ArrowTrendingUpIcon,
    },
    {
      label: 'Total Capital',
      value: formatCurrency(totalCapital, 0),
      delta: '+4%', // Placeholder
      positive: true,
      icon: ScaleIcon,
    },
  ];

  // Calculate strategy performance from teacher's trades
  const strategyPerformance = useMemo(() => {
    // Group trades by stock (as proxy for strategy)
    const stockGroups: Record<string, { trades: Trade[] }> = {};
    trades.forEach((trade) => {
      if (!stockGroups[trade.stock]) {
        stockGroups[trade.stock] = { trades: [] };
      }
      stockGroups[trade.stock].trades.push(trade);
    });

    return Object.entries(stockGroups)
      .slice(0, 4)
      .map(([stock, group]) => {
        const stockTrades = group.trades;
        const wins = stockTrades.filter((t) => (t.pnl || 0) > 0).length;
        const hitRate = stockTrades.length > 0 ? Math.round((wins / stockTrades.length) * 100) : 0;
        const pnl = stockTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);

        // Calculate average holding time (simplified - using trade creation to execution)
        const avgHoldingMs = stockTrades.reduce((sum, t) => {
          if (t.executedAt && t.createdAt) {
            return sum + (new Date(t.executedAt).getTime() - new Date(t.createdAt).getTime());
          }
          return sum + 0;
        }, 0);
        const avgHoldingMinutes = stockTrades.length > 0 ? avgHoldingMs / stockTrades.length / 60000 : 0;
        const avgHolding =
          avgHoldingMinutes < 60
            ? `${Math.round(avgHoldingMinutes)}m`
            : avgHoldingMinutes < 1440
            ? `${Math.round(avgHoldingMinutes / 60)}h`
            : `${Math.round(avgHoldingMinutes / 1440)}d`;

        return {
          segment: stock,
          trades: stockTrades.length,
          pnl: formatCurrency(pnl),
          hitRate: `${hitRate}%`,
          avgHolding,
          positive: pnl >= 0,
        };
      });
  }, [trades]);

  // Calculate risk alerts based on teacher's data
  const riskAlerts = useMemo(() => {
    const alerts: Array<{
      title: string;
      detail: string;
      severity: 'warning' | 'critical' | 'info';
      owner: string;
      updated: string;
    }> = [];

    // Check for pending trades
    const pendingTrades = trades.filter((t) => t.status === 'pending').length;
    if (pendingTrades > 10) {
      alerts.push({
        title: 'High pending orders',
        detail: `${pendingTrades} orders pending execution`,
        severity: 'warning' as const,
        owner: 'Trading Desk',
        updated: 'Just now',
      });
    }

    // Check for drawdown
    if (totalPnL < -100000) {
      alerts.push({
        title: 'Drawdown threshold nearing',
        detail: `Current P&L: ${formatCurrency(totalPnL)}`,
        severity: 'critical' as const,
        owner: 'Risk Control',
        updated: 'Just now',
      });
    }

    // Check for inactive students
    const inactiveStudents = students.filter((s) => s.status === 'inactive').length;
    if (inactiveStudents > 0) {
      alerts.push({
        title: 'Inactive students',
        detail: `${inactiveStudents} student${inactiveStudents !== 1 ? 's' : ''} currently inactive`,
        severity: 'info' as const,
        owner: 'Student Management',
        updated: 'Just now',
      });
    }

    return alerts;
  }, [trades, students, totalPnL]);

  // Calculate equity curve from teacher's trades
  const equityChartData = useMemo(() => {
    // Group trades by date and calculate cumulative P&L
    const dailyPnL: Record<string, number> = {};
    trades.forEach((trade) => {
      const date = new Date(trade.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
      });
      if (!dailyPnL[date]) {
        dailyPnL[date] = 0;
      }
      dailyPnL[date] += trade.pnl || 0;
    });

    // Convert to array and calculate cumulative
    let cumulative = totalCapital || 0;
    return Object.entries(dailyPnL)
      .slice(0, 12)
      .map(([date, pnl]) => {
        cumulative += pnl;
        return {
          date,
          nav: cumulative / 1000000, // Convert to Cr for display
        };
      });
  }, [trades, totalCapital]);

  // Calculate order flow mix from teacher's trades
  const orderFlowSeries = useMemo(() => {
    // Group trades by exchange
    const exchangeGroups: Record<'NSE' | 'BSE', { buys: number; sells: number }> = {
      NSE: { buys: 0, sells: 0 },
      BSE: { buys: 0, sells: 0 },
    };

    trades.forEach((trade) => {
      if (trade.type === 'BUY') {
        exchangeGroups[trade.exchange].buys += 1;
      } else {
        exchangeGroups[trade.exchange].sells += 1;
      }
    });

    return Object.entries(exchangeGroups).map(([exchange, data]) => {
      const total = data.buys + data.sells;
      const buysPercent = total > 0 ? Math.round((data.buys / total) * 100) : 0;
      const sellsPercent = total > 0 ? Math.round((data.sells / total) * 100) : 0;
      return {
        label: exchange,
        Buys: buysPercent,
        Sells: sellsPercent,
      };
    });
  }, [trades]);

  // Transform data for diverging bar chart (Sells as negative values)
  const divergingOrderFlowData = useMemo(
    () =>
      orderFlowSeries.map((item) => ({
        label: item.label,
        Buys: item.Buys,
        Sells: -item.Sells, // Negative for diverging chart
      })),
    [orderFlowSeries]
  );

  return (
    <DashboardLayout title="Reports">
      <div className="space-y-6">
        <Card
          padding="lg"
          tone="neutral"
          hover
          header={
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-neutral-900">Executive Summary</h2>
              <span className="text-xs font-medium text-neutral-500">MTD snapshot • Refreshed 5 minutes ago</span>
            </div>
          }
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {summaryMetrics.map((metric) => (
              <div
                key={metric.label}
                className="flex items-start justify-between rounded-2xl border border-neutral-200 bg-white/80 px-4 py-3 shadow-sm"
              >
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{metric.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-neutral-900">{metric.value}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={cn(
                      'text-xs font-semibold',
                      metric.positive ? 'text-success-600' : 'text-danger-600'
                    )}
                  >
                    {metric.delta}
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50">
                    <metric.icon className="h-4 w-4 text-neutral-600" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <Card
              padding="lg"
              tone="neutral"
              className="bg-white/90"
              header={<h3 className="text-sm font-semibold text-neutral-800">Equity Curve (MTD)</h3>}
            >
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={equityChartData} margin={{ top: 10, right: 12, bottom: 0, left: -24 }}>
                  <defs>
                    <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                  />
                  <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <RechartsTooltip content={<EquityTooltip />} cursor={{ stroke: '#2563eb', strokeOpacity: 0.2 }} />
                  <Area
                    type="monotone"
                    dataKey="nav"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    fill="url(#equityGradient)"
                    dot={{ r: 2.5, strokeWidth: 1, stroke: '#2563eb' }}
                    activeDot={{ r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            <Card
              padding="lg"
              tone="neutral"
              className="bg-white/90"
              header={<h3 className="text-sm font-semibold text-neutral-800">Desk Contribution</h3>}
            >
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={deskContribution}
                  layout="vertical"
                  margin={{ top: 10, right: 16, bottom: 0, left: 0 }}
                  barSize={16}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" domain={[0, 40]} hide />
                  <YAxis
                    type="category"
                    dataKey="desk"
                    axisLine={false}
                    tickLine={false}
                    width={110}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <RechartsTooltip content={<DeskContributionTooltip />} cursor={{ fill: '#e2e8f0', opacity: 0.4 }} />
                  <Bar dataKey="weight" radius={[12, 12, 12, 12]}>
                    {deskContribution.map((entry) => (
                      <Cell key={entry.desk} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card
            padding="lg"
            tone="neutral"
            hover
            header={<h3 className="text-lg font-semibold text-neutral-900">Strategy Performance</h3>}
            footer={<span className="text-xs text-neutral-400">Metrics evaluated across all desks this month.</span>}
          >
            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white/90">
              <div className="grid grid-cols-[1.5fr_repeat(4,1fr)] gap-3 border-b border-neutral-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                <span>Strategy</span>
                <span className="text-right">Trades</span>
                <span className="text-right">Hit Rate</span>
                <span className="text-right">Avg Holding</span>
                <span className="text-right">Net P&L</span>
              </div>
              <div className="divide-y divide-neutral-100">
                {strategyPerformance.map((row) => (
                  <div key={row.segment} className="grid grid-cols-[1.5fr_repeat(4,1fr)] items-center gap-3 px-4 py-3 text-sm">
                    <span className="font-medium text-neutral-800">{row.segment}</span>
                    <span className="justify-self-end text-neutral-700">{row.trades}</span>
                    <span className="justify-self-end text-neutral-700">{row.hitRate}</span>
                    <span className="justify-self-end text-neutral-700">{row.avgHolding}</span>
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
            header={<h3 className="text-lg font-semibold text-neutral-900">Risk & Compliance</h3>}
          >
            <div className="flex flex-col gap-3">
              {riskAlerts.map((alert) => {
                const badgeStyles = {
                  info: 'text-neutral-600 bg-neutral-100 border-neutral-200',
                  warning: 'text-warning-700 bg-warning-50 border-warning-200',
                  critical: 'text-danger-700 bg-danger-50 border-danger-200',
                } as const;

                const iconMap = {
                  info: ShieldCheckIcon,
                  warning: AdjustmentsHorizontalIcon,
                  critical: FireIcon,
                };

                const Icon = iconMap[alert.severity];

                return (
                  <div
                    key={alert.title}
                    className="flex items-start justify-between rounded-xl border border-neutral-200 bg-white/80 px-4 py-3 shadow-sm"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-neutral-900">{alert.title}</span>
                        <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium', badgeStyles[alert.severity])}>
                          <Icon className="h-3.5 w-3.5" />
                          {alert.severity === 'critical' ? 'Critical' : alert.severity === 'warning' ? 'Warning' : 'Info'}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-600">{alert.detail}</p>
                    </div>
                    <div className="text-right text-xs text-neutral-400">
                      <p>{alert.owner}</p>
                      <p>{alert.updated}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.8fr)]">
          <Card
            padding="lg"
            tone="neutral"
            hover
            header={<h3 className="text-sm font-semibold text-neutral-800">Order Flow Mix</h3>}
          >
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={divergingOrderFlowData} layout="vertical" margin={{ top: 16, right: 20, left: 85, bottom: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  domain={[-70, 70]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickCount={5}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  width={80}
                />
                <ReferenceLine x={0} stroke="#64748b" strokeWidth={1.5} strokeDasharray="2 2" />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12 }}
                  formatter={(value) => <span className="text-neutral-500 capitalize">{value}</span>}
                />
                <RechartsTooltip content={<OrderFlowTooltip />} cursor={{ fill: '#e2e8f0', opacity: 0.3 }} />
                <Bar dataKey="Buys" fill="#16a34a" radius={[0, 8, 8, 0]} />
                <Bar dataKey="Sells" fill="#dc2626" radius={[8, 0, 0, 8]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card
            padding="lg"
            tone="neutral"
            hover
            header={<h3 className="text-sm font-semibold text-neutral-800">Exposure Heatmap</h3>}
          >
            <div className="grid grid-cols-3 gap-3">
              {sectorExposure.map(({ sector, change }) => (
                <div
                  key={sector}
                  className={cn(
                    'rounded-xl border border-neutral-200 px-3 py-4 text-center shadow-sm transition-colors',
                    change >= 0 ? 'bg-success-50/70 text-success-700' : 'bg-danger-50/70 text-danger-700'
                  )}
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-500/90">{sector}</p>
                  <p className="mt-1 text-lg font-semibold">
                    {change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`}
                  </p>
                  <p className="text-[11px] text-neutral-500/80">vs prev. week</p>
                </div>
              ))}
            </div>
          </Card>

          <Card
            padding="lg"
            tone="neutral"
            hover
            header={<h3 className="text-sm font-semibold text-neutral-800">Profit Distribution</h3>}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="md:w-1/2">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={profitPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={4}
                    >
                      {profitPieData.map((entry, index) => (
                        <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<ProfitTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-3">
                {profitDistribution.map((line) => (
                  <div
                    key={line.label}
                    className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white/80 px-3 py-2 shadow-sm"
                  >
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{line.label}</p>
                      <p className="text-sm font-semibold text-neutral-900">{line.display}</p>
                    </div>
                    <span className={cn('text-xs font-semibold', line.positive ? 'text-success-600' : 'text-danger-600')}>
                      {line.delta}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

