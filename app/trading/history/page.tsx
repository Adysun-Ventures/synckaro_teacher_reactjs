'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { SearchBar } from '@/components/common/SearchBar';
import { PaginationFooter } from '@/components/common/PaginationFooter';
import { TradeListHeader } from '@/components/teachers/TradeListHeader';
import { CompactTradeRow } from '@/components/teachers/CompactTradeRow';
import { EmptyState } from '@/components/common/EmptyState';
import { isAuthenticated, getCurrentUser } from '@/services/authService';
import { storage } from '@/lib/storage';
import { Trade } from '@/types';
import { cn } from '@/lib/utils';

const PAGE_SIZE_OPTIONS = [50, 100, 200, 300];

export default function TradeHistoryPage() {
  const router = useRouter();
  const user = getCurrentUser();
  const teacherId = user?.id || '';

  const [trades, setTrades] = useState<Trade[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [exchangeFilter, setExchangeFilter] = useState<'all' | 'NSE' | 'BSE'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | Trade['status']>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

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
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTrades(teacherTrades);
    }
  }, [teacherId]);

  // Filter trades
  const filteredTrades = useMemo(() => {
    let filtered = trades;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.stock.toLowerCase().includes(query) ||
          t.type.toLowerCase().includes(query) ||
          (t.studentName && t.studentName.toLowerCase().includes(query))
      );
    }

    // Exchange filter
    if (exchangeFilter !== 'all') {
      filtered = filtered.filter((t) => t.exchange === exchangeFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    return filtered;
  }, [trades, searchQuery, exchangeFilter, statusFilter]);

  // Paginate trades
  const paginatedTrades = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredTrades.slice(startIndex, startIndex + pageSize);
  }, [filteredTrades, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredTrades.length / pageSize));

  const handlePageSizeChange = (nextSize: number) => {
    setPageSize(nextSize);
    setCurrentPage(1);
  };

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredTrades.length / pageSize));
    setCurrentPage((prev) => (prev > maxPage ? maxPage : prev));
  }, [filteredTrades.length, pageSize]);

  if (!isAuthenticated() || !teacherId) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <DashboardLayout title="Trade History">
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          icon={<ArrowLeftIcon className="h-4 w-4" />}
        >
          Back
        </Button>

        {/* Filters */}
        <Card padding="lg">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex-1 min-w-64">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search by stock, type, or student..."
                className="w-full"
              />
            </div>
            <div className="flex gap-3">
              {/* Exchange Filter */}
              <select
                value={exchangeFilter}
                onChange={(e) => setExchangeFilter(e.target.value as 'all' | 'NSE' | 'BSE')}
                className="px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
              >
                <option value="all">All Exchanges</option>
                <option value="NSE">NSE</option>
                <option value="BSE">BSE</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | Trade['status'])}
                className="px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="executed">Executed</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="text-sm text-neutral-500">
            Showing {filteredTrades.length} of {trades.length} trades
          </div>
        </Card>

        {/* Trades Table */}
        {filteredTrades.length === 0 ? (
          <Card padding="lg">
            <EmptyState
              title="No trades found"
              description={
                searchQuery || exchangeFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No trade history available'
              }
            />
          </Card>
        ) : (
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
            <TradeListHeader />
            <div className="divide-y divide-neutral-100">
              {paginatedTrades.map((trade) => (
                <CompactTradeRow key={trade.id} trade={trade} />
              ))}
            </div>
            <PaginationFooter
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredTrades.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

