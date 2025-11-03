'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
    
    // Calculate P&L from completed trades
    const completedWithPnL = completed.filter((t) => {
      const tradePnL = (t.price || 0) * (t.quantity || 0) * (t.type === 'BUY' ? -1 : 1);
      return tradePnL > 0;
    });
    const winRate = completed.length > 0 ? (completedWithPnL.length / completed.length) * 100 : 0;

    const totalProfitLoss = (student.currentCapital || 0) - (student.initialCapital || 0);
    const averagePnL = completed.length > 0 ? totalProfitLoss / completed.length : 0;

    const buyTrades = trades.filter((t) => t.type === 'BUY');
    const sellTrades = trades.filter((t) => t.type === 'SELL');

    const totalBuyValue = buyTrades.reduce((sum, t) => sum + ((t.price || 0) * (t.quantity || 0)), 0);
    const totalSellValue = sellTrades.reduce((sum, t) => sum + ((t.price || 0) * (t.quantity || 0)), 0);

    const capitalGrowth = student.initialCapital > 0 
      ? ((student.currentCapital - student.initialCapital) / student.initialCapital) * 100 
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

          {/* Trade Breakdown */}
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Trade Breakdown</h3>
            <div className="grid gap-4 md:grid-cols-4">
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

