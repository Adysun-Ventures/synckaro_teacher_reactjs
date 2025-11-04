'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { storage } from '@/lib/storage';
import { cn } from '@/lib/utils';
import { isAuthenticated } from '@/services/authService';
import { Student, Trade } from '@/types';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

// Custom Tooltip Components
function EquityTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) {
    return null;
  }

  const [{ value }] = payload;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-neutral-700">{formatCurrency(value)}</p>
      <p className="text-neutral-500">{label}</p>
    </div>
  );
}

function PnLTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) {
    return null;
  }

  const [{ value }] = payload;
  const isPositive = value >= 0;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-neutral-700">{label}</p>
      <p className={cn('font-semibold', isPositive ? 'text-success-600' : 'text-danger-600')}>
        {formatCurrency(value)}
      </p>
    </div>
  );
}

function StatusTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const [{ name, value }] = payload;
  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-neutral-700">{name}</p>
      <p className="text-neutral-500">{value} trades</p>
    </div>
  );
}

function BuySellTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const buyValue = payload.find((item: any) => item.dataKey === 'Buy')?.value ?? 0;
  const sellValue = payload.find((item: any) => item.dataKey === 'Sell')?.value ?? 0;
  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-neutral-700">{label}</p>
      <p className="text-success-600">Buy: {buyValue}</p>
      <p className="text-danger-600">Sell: {sellValue}</p>
    </div>
  );
}

function WinRateTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const [{ name, value }] = payload;
  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-neutral-700">{name}</p>
      <p className="text-neutral-500">{value} trades</p>
    </div>
  );
}

export default function StudentStatsPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    const students = storage.getItem('students') || [];
    const foundStudent = students.find((s: Student) => s.id === studentId);

    if (!foundStudent) {
      router.push('/students');
      return;
    }

    setStudent(foundStudent);

    const allTrades = storage.getItem('trades') || [];
    const studentTrades = allTrades.filter((trade: Trade) => trade.studentId === studentId);
    setTrades(studentTrades);
  }, [studentId, router]);

  const stats = useMemo(() => {
    if (!student || trades.length === 0) {
      return {
        totalTrades: 0,
        completedTrades: 0,
        pendingTrades: 0,
        executedTrades: 0,
        winRate: 0,
        totalProfitLoss: 0,
        averagePnL: 0,
        totalBuyTrades: 0,
        totalSellTrades: 0,
        totalBuyValue: 0,
        totalSellValue: 0,
        capitalGrowth: 0,
      };
    }

    const completed = trades.filter((t) => t.status === 'completed');
    const pending = trades.filter((t) => t.status === 'pending');
    const executed = trades.filter((t) => t.status === 'executed');
    
    // Calculate P&L from completed trades with P&L
    const winningTrades = completed.filter((t) => (t.pnl || 0) > 0);
    const winRate = completed.length > 0 ? (winningTrades.length / completed.length) * 100 : 0;

    const totalProfitLoss = (student.currentCapital || 0) - (student.initialCapital || 0);
    const averagePnL = completed.length > 0 ? totalProfitLoss / completed.length : 0;

    const buyTrades = trades.filter((t) => t.type === 'BUY');
    const sellTrades = trades.filter((t) => t.type === 'SELL');

    const totalBuyValue = buyTrades.reduce((sum, t) => sum + ((t.price || 0) * (t.quantity || 0)), 0);
    const totalSellValue = sellTrades.reduce((sum, t) => sum + ((t.price || 0) * (t.quantity || 0)), 0);

    const initialCapital = student.initialCapital ?? 0;
    const currentCapital = student.currentCapital ?? 0;
    const capitalGrowth = initialCapital > 0 
      ? ((currentCapital - initialCapital) / initialCapital) * 100 
      : 0;

    return {
      totalTrades: trades.length,
      completedTrades: completed.length,
      pendingTrades: pending.length,
      executedTrades: executed.length,
      winRate: Number(winRate.toFixed(2)),
      totalProfitLoss,
      averagePnL: Number(averagePnL.toFixed(2)),
      totalBuyTrades: buyTrades.length,
      totalSellTrades: sellTrades.length,
      totalBuyValue,
      totalSellValue,
      capitalGrowth: Number(capitalGrowth.toFixed(2)),
    };
  }, [student, trades]);

  // Equity Curve Data - Capital growth over time
  const equityChartData = useMemo(() => {
    if (!student || trades.length === 0) return [];

    // Sort trades by date
    const sortedTrades = [...trades].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Group trades by date and calculate cumulative capital
    const dailyData: Record<string, number> = {};
    sortedTrades.forEach((trade) => {
      const date = new Date(trade.createdAt || trade.timestamp || trade.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
      });
      if (!dailyData[date]) {
        dailyData[date] = 0;
      }
      // Accumulate P&L for each day
      dailyData[date] += trade.pnl || 0;
    });

    // Calculate cumulative capital starting from initial capital
    let cumulative = student.initialCapital ?? 0;
    return Object.entries(dailyData)
      .map(([date, pnl]) => {
        cumulative += pnl;
        return {
          date,
          capital: cumulative,
        };
      })
      .slice(-12); // Last 12 data points
  }, [student, trades]);

  // Daily P&L Data
  const dailyPnLData = useMemo(() => {
    if (!trades.length) return [];

    const completedTrades = trades.filter((t) => t.status === 'completed');
    const dailyPnL: Record<string, number> = {};

    completedTrades.forEach((trade) => {
      const date = new Date(trade.createdAt || trade.timestamp || trade.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
      });
      if (!dailyPnL[date]) {
        dailyPnL[date] = 0;
      }
      dailyPnL[date] += trade.pnl || 0;
    });

    return Object.entries(dailyPnL)
      .map(([date, pnl]) => ({
        date,
        pnl: Number(pnl.toFixed(2)),
      }))
      .slice(-12)
      .sort((a, b) => {
        const dateA = new Date(a.date.split(' ').reverse().join(' '));
        const dateB = new Date(b.date.split(' ').reverse().join(' '));
        return dateA.getTime() - dateB.getTime();
      });
  }, [trades]);

  // Trade Status Distribution Data
  const statusDistributionData = useMemo(() => {
    if (!trades.length) return [];

    const statusCounts: Record<string, number> = {};
    trades.forEach((trade) => {
      statusCounts[trade.status] = (statusCounts[trade.status] || 0) + 1;
    });

    const statusColors: Record<string, string> = {
      completed: '#16a34a',
      executed: '#2563eb',
      pending: '#f59e0b',
      failed: '#dc2626',
      cancelled: '#64748b',
    };

    return Object.entries(statusCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: statusColors[name] || '#64748b',
    }));
  }, [trades]);

  // Buy vs Sell Comparison Data
  const buySellComparisonData = useMemo(() => {
    if (!trades.length) return [];

    const buyTrades = trades.filter((t) => t.type === 'BUY');
    const sellTrades = trades.filter((t) => t.type === 'SELL');

    return [
      {
        label: 'Count',
        Buy: buyTrades.length,
        Sell: sellTrades.length,
      },
      {
        label: 'Value',
        Buy: buyTrades.reduce((sum, t) => sum + ((t.price || 0) * (t.quantity || 0)), 0),
        Sell: sellTrades.reduce((sum, t) => sum + ((t.price || 0) * (t.quantity || 0)), 0),
      },
    ];
  }, [trades]);

  // Win Rate Data for Donut Chart
  const winRateData = useMemo(() => {
    const completedTrades = trades.filter((t) => t.status === 'completed');
    if (completedTrades.length === 0) return [];

    const winningTrades = completedTrades.filter((t) => (t.pnl || 0) > 0).length;
    const losingTrades = completedTrades.length - winningTrades;

    return [
      { name: 'Winning', value: winningTrades, color: '#16a34a' },
      { name: 'Losing', value: losingTrades, color: '#dc2626' },
    ];
  }, [trades]);

  if (!student || !isAuthenticated()) {
    return null;
  }

  return (
    <DashboardLayout title="Student Statistics">
      <Card padding="lg" className="border border-neutral-200 bg-white">
        <div className="space-y-6">
          <PageHeader title={`${student.name} - Statistics`} />

          {/* Trading Statistics */}
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Trading Statistics</h3>
            <div className="grid gap-4 md:grid-cols-4">
              <Card padding="lg">
                <p className="text-3xl font-semibold text-neutral-900 mb-1">{stats.totalTrades}</p>
                <p className="text-xs uppercase tracking-wide text-neutral-500">Total Trades</p>
              </Card>
              <Card padding="lg">
                <p className="text-3xl font-semibold text-neutral-900 mb-1">{stats.completedTrades}</p>
                <p className="text-xs uppercase tracking-wide text-neutral-500">Completed</p>
              </Card>
              <Card padding="lg">
                <p className="text-3xl font-semibold text-neutral-900 mb-1">{stats.pendingTrades}</p>
                <p className="text-xs uppercase tracking-wide text-neutral-500">Pending</p>
              </Card>
              <Card padding="lg">
                <p className="text-3xl font-semibold text-neutral-900 mb-1">{stats.executedTrades}</p>
                <p className="text-xs uppercase tracking-wide text-neutral-500">Executed</p>
              </Card>
            </div>
          </div>

          {/* Performance Metrics */}
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Performance Metrics</h3>
            <div className="grid gap-4 md:grid-cols-4">
              <Card padding="lg">
                <p className={cn(
                  'text-3xl font-semibold mb-1',
                  stats.winRate >= 50 ? 'text-success-600' : stats.winRate >= 30 ? 'text-warning-600' : 'text-danger-600'
                )}>
                  {stats.winRate}%
                </p>
                <p className="text-xs uppercase tracking-wide text-neutral-500">Win Rate</p>
              </Card>
              <Card padding="lg">
                <p className={cn(
                  'text-3xl font-semibold mb-1',
                  stats.totalProfitLoss >= 0 ? 'text-success-600' : 'text-danger-600'
                )}>
                  {formatCurrency(stats.totalProfitLoss)}
                </p>
                <p className="text-xs uppercase tracking-wide text-neutral-500">Total P&amp;L</p>
              </Card>
              <Card padding="lg">
                <p className={cn(
                  'text-3xl font-semibold mb-1',
                  stats.averagePnL >= 0 ? 'text-success-600' : 'text-danger-600'
                )}>
                  {formatCurrency(stats.averagePnL)}
                </p>
                <p className="text-xs uppercase tracking-wide text-neutral-500">Average P&amp;L</p>
              </Card>
              <Card padding="lg">
                <p className={cn(
                  'text-3xl font-semibold mb-1',
                  stats.capitalGrowth >= 0 ? 'text-success-600' : 'text-danger-600'
                )}>
                  {stats.capitalGrowth}%
                </p>
                <p className="text-xs uppercase tracking-wide text-neutral-500">Capital Growth</p>
              </Card>
            </div>
          </div>

          {/* Chart Section 1: Equity Curve and P&L Trend */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Equity Curve Chart */}
            <Card padding="lg" className="border border-neutral-200 bg-white">
              <h3 className="text-sm font-semibold text-neutral-800 mb-4">Equity Curve</h3>
              {equityChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={equityChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCapital" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <RechartsTooltip content={<EquityTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="capital"
                      stroke="#2563eb"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorCapital)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-sm text-neutral-500">
                  No data available
                </div>
              )}
            </Card>

            {/* P&L Over Time Chart */}
            <Card padding="lg" className="border border-neutral-200 bg-white">
              <h3 className="text-sm font-semibold text-neutral-800 mb-4">P&amp;L Over Time</h3>
              {dailyPnLData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyPnLData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <RechartsTooltip content={<PnLTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="pnl"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ fill: '#2563eb', r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <ReferenceLine y={0} stroke="#64748b" strokeDasharray="2 2" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-sm text-neutral-500">
                  No data available
                </div>
              )}
            </Card>
          </div>

          {/* Chart Section 2: Trade Status and Buy/Sell Comparison */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Trade Status Distribution Pie Chart */}
            <Card padding="lg" className="border border-neutral-200 bg-white">
              <h3 className="text-sm font-semibold text-neutral-800 mb-4">Trade Status Distribution</h3>
              {statusDistributionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(props: any) => `${props.name}: ${((props.percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<StatusTooltip />} />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ fontSize: 12 }}
                      formatter={(value) => <span className="text-neutral-500 capitalize">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-sm text-neutral-500">
                  No data available
                </div>
              )}
            </Card>

            {/* Buy vs Sell Comparison Bar Chart */}
            <Card padding="lg" className="border border-neutral-200 bg-white">
              <h3 className="text-sm font-semibold text-neutral-800 mb-4">Buy vs Sell Comparison</h3>
              {buySellComparisonData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={buySellComparisonData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      tickFormatter={(value) => {
                        if (value >= 1000000) return `₹${(value / 1000000).toFixed(1)}M`;
                        if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
                        return `₹${value}`;
                      }}
                    />
                    <RechartsTooltip content={<BuySellTooltip />} />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ fontSize: 12 }}
                      formatter={(value) => <span className="text-neutral-500 capitalize">{value}</span>}
                    />
                    <Bar dataKey="Buy" fill="#16a34a" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Sell" fill="#dc2626" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-sm text-neutral-500">
                  No data available
                </div>
              )}
            </Card>
          </div>

          {/* Win Rate Visualization and Trade Breakdown */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Win Rate Donut Chart */}
            {winRateData.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">Win Rate Visualization</h3>
                <Card padding="lg" className="border border-neutral-200 bg-white">
                  <div className="relative">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={winRateData}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={120}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {winRateData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip content={<WinRateTooltip />} />
                        <Legend
                          iconType="circle"
                          wrapperStyle={{ fontSize: 12 }}
                          formatter={(value) => <span className="text-neutral-500 capitalize">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <p className="text-3xl font-semibold text-neutral-900">{stats.winRate}%</p>
                        <p className="text-xs uppercase tracking-wide text-neutral-500">Win Rate</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Trade Breakdown */}
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Trade Breakdown</h3>
              <div className="grid gap-4 grid-cols-2">
                <Card padding="lg">
                  <p className="text-3xl font-semibold text-neutral-900 mb-1">{stats.totalBuyTrades}</p>
                  <p className="text-xs uppercase tracking-wide text-neutral-500">Buy Trades</p>
                </Card>
                <Card padding="lg">
                  <p className="text-3xl font-semibold text-neutral-900 mb-1">{stats.totalSellTrades}</p>
                  <p className="text-xs uppercase tracking-wide text-neutral-500">Sell Trades</p>
                </Card>
                <Card padding="lg">
                  <p className="text-3xl font-semibold text-neutral-900 mb-1">{formatCurrency(stats.totalBuyValue)}</p>
                  <p className="text-xs uppercase tracking-wide text-neutral-500">Total Buy Value</p>
                </Card>
                <Card padding="lg">
                  <p className="text-3xl font-semibold text-neutral-900 mb-1">{formatCurrency(stats.totalSellValue)}</p>
                  <p className="text-xs uppercase tracking-wide text-neutral-500">Total Sell Value</p>
                </Card>
              </div>
            </div>
          </div>

          {/* Capital Information */}
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Capital Information</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <Card padding="lg">
                <p className="text-3xl font-semibold text-neutral-900 mb-1">
                  {formatCurrency(student.initialCapital || 0)}
                </p>
                <p className="text-xs uppercase tracking-wide text-neutral-500">Initial Capital</p>
              </Card>
              <Card padding="lg">
                <p className="text-3xl font-semibold text-neutral-900 mb-1">
                  {formatCurrency(student.currentCapital || 0)}
                </p>
                <p className="text-xs uppercase tracking-wide text-neutral-500">Current Capital</p>
              </Card>
              <Card padding="lg">
                <p className="text-3xl font-semibold text-neutral-900 mb-1">
                  {student.riskPercentage || 0}%
                </p>
                <p className="text-xs uppercase tracking-wide text-neutral-500">Risk Percentage</p>
              </Card>
            </div>
          </div>
        </div>
      </Card>
    </DashboardLayout>
  );
}

