'use client';

import { useEffect, useMemo, useState, useCallback, useRef, type ChangeEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  UserGroupIcon,
  ChartBarIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { Avatar } from '@/components/common/Avatar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Toggle } from '@/components/common/Toggle';
import { EmptyState } from '@/components/common/EmptyState';
import { PaginationFooter } from '@/components/common/PaginationFooter';
import { TradeListHeader } from '@/components/teachers/TradeListHeader';
import { CompactTradeRow } from '@/components/teachers/CompactTradeRow';
import { cn } from '@/lib/utils';
import { isAuthenticated, getCurrentUser } from '@/services/authService';
import { Student, Trade } from '@/types';
import apiClient from '@/lib/api';

interface StudentDetailApiResponse {
  id: number;
  name: string;
  status: 'active' | 'inactive';
  email: string;
  phone: string;
  joined_on: string | null;
  initial_capital: number;
  current_capital: number;
  pnl: number;
  pnl_formatted: string;
  strategy: string;
  recent_trades_count: number;
  recent_trades: Array<{
    stock: string;
    type: 'BUY' | 'SELL';
    qty: number;
    price: number;
    price_formatted: string;
    exchange: 'NSE' | 'BSE';
    status: string;
    date: string;
  }>;
  last_updated: string;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const PAGE_SIZE_OPTIONS = [50, 100, 200, 300];

export default function StudentProfilePage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;
  const user = getCurrentUser();
  const teacherIdNum = user?.id ? parseInt(user.id, 10) : null;
  const studentIdNum = parseInt(studentId, 10);

  const [student, setStudent] = useState<Student | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pnlFormatted, setPnlFormatted] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  // Fetch student details from API
  const fetchStudentData = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (hasFetchedRef.current) {
      return;
    }

    if (!teacherIdNum || isNaN(teacherIdNum) || isNaN(studentIdNum)) {
      setError('Invalid teacher or student ID');
      setLoading(false);
      return;
    }

    try {
      hasFetchedRef.current = true;
      setLoading(true);
      setError(null);

      const response = await apiClient.post<{
        success: boolean;
        data: StudentDetailApiResponse;
      }>('/teacher/view_student', {
        teacher_id: teacherIdNum,
        student_id: studentIdNum,
      });

      if (response.data && response.data.success && response.data.data) {
        const apiData = response.data.data;

        // Map API response to Student type
        const mappedStudent: Student = {
          id: String(apiData.id),
          name: apiData.name,
          email: apiData.email,
          mobile: apiData.phone,
          teacherId: user?.id || '',
          status: apiData.status,
          initialCapital: apiData.initial_capital,
          currentCapital: apiData.current_capital,
          profitLoss: apiData.pnl,
          riskPercentage: 10, // Not provided by API
          strategy: apiData.strategy || '',
          joinedDate: apiData.joined_on || apiData.last_updated || new Date().toISOString(),
        };

        setStudent(mappedStudent);
        setPnlFormatted(apiData.pnl_formatted);

        // Map recent trades from API
        const mappedTrades: Trade[] = apiData.recent_trades.map((apiTrade, index) => ({
          id: `trade-${apiData.id}-${index}`,
          teacherId: user?.id || '',
          studentId: String(apiData.id),
          stock: apiTrade.stock,
          quantity: apiTrade.qty,
          price: apiTrade.price,
          type: apiTrade.type,
          exchange: apiTrade.exchange,
          status: apiTrade.status as Trade['status'],
          createdAt: apiTrade.date,
          timestamp: apiTrade.date,
        }));

        setTrades(mappedTrades);
        setCurrentPage(1);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      console.error('Error fetching student data:', err);
      setError(err?.error || err?.message || 'Failed to load student data');
      hasFetchedRef.current = false; // Allow retry on error
      
      // Redirect to students list if student not found
      if (err?.statusCode === 404 || err?.message?.includes('not found')) {
        router.push('/students');
      }
    } finally {
      setLoading(false);
    }
  }, [teacherIdNum, studentIdNum, user?.id, router]);

  // Load student data on mount
  useEffect(() => {
    if (isAuthenticated() && teacherIdNum && !isNaN(studentIdNum)) {
      fetchStudentData();
    }
  }, [teacherIdNum, studentIdNum, fetchStudentData]);

  const pnl = useMemo(() => {
    if (!student) return 0;
    // Use profitLoss from API if available, otherwise calculate
    return student.profitLoss ?? ((student.currentCapital || 0) - (student.initialCapital || 0));
  }, [student]);

  const isPositive = pnl >= 0;

  const handleStatusToggle = async (enabled: boolean) => {
    if (!student) return;

    // TODO: Implement API call to update student status
    // For now, just update local state optimistically
    setStudent({
      ...student,
      status: enabled ? 'active' : 'inactive',
    });
  };

  const totalTrades = trades.length;
  const totalPages = Math.max(1, Math.ceil(totalTrades / pageSize));

  const handlePageSizeChange = (nextSize: number) => {
    setPageSize(nextSize);
    setCurrentPage(1);
  };

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(totalTrades / pageSize));
    setCurrentPage((prev) => (prev > maxPage ? maxPage : prev));
  }, [totalTrades, pageSize]);

  const paginatedTrades = useMemo(() => {
    if (totalTrades === 0) {
      return [];
    }

    const startIndex = (currentPage - 1) * pageSize;
    return trades.slice(startIndex, startIndex + pageSize);
  }, [currentPage, trades, totalTrades, pageSize]);


  if (!isAuthenticated()) {
    return null;
  }

  if (loading) {
    return (
      <DashboardLayout title="Student Profile">
        <div className="flex items-center justify-center h-64">
          <p className="text-neutral-500">Loading student data...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !student) {
    return (
      <DashboardLayout title="Student Profile">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-danger-600 mb-2">{error || 'Failed to load student data'}</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => {
                  hasFetchedRef.current = false;
                  fetchStudentData();
                }}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                Retry
              </button>
              <button
                onClick={() => router.push('/students')}
                className="text-neutral-600 hover:text-neutral-700 text-sm font-medium"
              >
                Back to Students
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Student Profile">
      <div className="space-y-6">
        <Card padding="lg" className="border border-neutral-200 bg-white">
          <div className="space-y-6">
            {/* Page Header with Back Button and Centered Title */}
            <PageHeader
              title="Student Details"
              rightContent={
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => router.push(`/students/${studentId}/stats`)}
                    className="inline-flex items-center gap-2 rounded-lg border border-primary-300 bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-100 hover:border-primary-400"
                  >
                    <ChartBarIcon className="h-4 w-4" />
                    Stats
                  </button>
          <button
            type="button"
                    onClick={() => router.push(`/students/${studentId}/logs`)}
                    className="inline-flex items-center gap-2 rounded-lg border border-primary-300 bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-100 hover:border-primary-400"
          >
                    <DocumentTextIcon className="h-4 w-4" />
                    Logs
          </button>
        </div>
              }
            />

            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <Avatar name={student.name} size="2xl" showStatus statusColor={student.status === 'active' ? 'success' : 'danger'} />
              <div>
                <div className="mb-2 flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-neutral-900">{student.name}</h1>
                    <StatusBadge status={student.status} />
                </div>
                  <div className="flex flex-wrap items-center gap-4 text-neutral-600">
                  <div className="flex items-center gap-2">
                      <EnvelopeIcon className="h-4 w-4 text-neutral-500" />
                    <span>{student.email || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                      <DevicePhoneMobileIcon className="h-4 w-4 text-neutral-500" />
                    <span>{student.mobile || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                      <ChartBarIcon className="h-4 w-4 text-neutral-500" />
                    <span>Joined {formatDate(student.joinedDate)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start gap-2 md:items-end">
              <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-neutral-700">Status</span>
                <Toggle enabled={student.status === 'active'} onChange={handleStatusToggle} />
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
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
            <p
              className={cn(
                'text-3xl font-semibold mb-1',
                isPositive ? 'text-success-600' : 'text-danger-600'
              )}
            >
              {pnlFormatted || formatCurrency(pnl)}
            </p>
            <p className="text-xs uppercase tracking-wide text-neutral-500">P&amp;L</p>
          </Card>
          <Card padding="lg">
            <p className="text-3xl font-semibold text-neutral-900 mb-1">
              {student.strategy || 'No strategy documented yet.'}
            </p>
            <p className="text-xs uppercase tracking-wide text-neutral-500">Strategy</p>
          </Card>
        </div>



        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-neutral-900">Recent Trades</h2>
            <span className="text-sm text-neutral-500">{trades.length} total</span>
          </div>

          {trades.length === 0 ? (
            <Card>
              <EmptyState
                title="No trades yet"
                description="This student hasn't executed any trades."
              />
            </Card>
          ) : (
            <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
              <TradeListHeader />
              <div className="divide-y divide-neutral-100">
                {paginatedTrades.map((trade) => (
                  <CompactTradeRow key={trade.id} trade={trade} />
                ))}
              </div>
              <PaginationFooter
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalTrades}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={handlePageSizeChange}
              />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

