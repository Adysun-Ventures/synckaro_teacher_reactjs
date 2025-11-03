'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  UserPlusIcon,
  ChartBarIcon,
  SparklesIcon,
  PencilSquareIcon,
  DocumentArrowUpIcon,
} from '@heroicons/react/24/outline';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { SearchBar } from '@/components/common/SearchBar';
import { EmptyState } from '@/components/common/EmptyState';
import { PaginationFooter } from '@/components/common/PaginationFooter';
import { storage } from '@/lib/storage';
import { cn } from '@/lib/utils';
import { isAuthenticated, getCurrentUser } from '@/services/authService';
import { Student, ActivityLog, Trade } from '@/types';

const PAGE_SIZE_OPTIONS = [50, 100, 200, 300];

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

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  return formatDate(dateString);
};

const getActionIcon = (action: string) => {
  const actionLower = action.toLowerCase();
  if (actionLower.includes('student_added') || actionLower.includes('student')) {
    return UserPlusIcon;
  }
  if (actionLower.includes('trade_executed') || actionLower.includes('trade')) {
    return ChartBarIcon;
  }
  if (actionLower.includes('profile_created') || actionLower.includes('created')) {
    return SparklesIcon;
  }
  if (actionLower.includes('profile_updated') || actionLower.includes('updated')) {
    return PencilSquareIcon;
  }
  return DocumentArrowUpIcon;
};

const getActionColor = (action: string) => {
  if (action.includes('trade')) return 'bg-primary-100 text-primary-600';
  if (action.includes('student')) return 'bg-success-100 text-success-600';
  if (action.includes('profile')) return 'bg-warning-100 text-warning-600';
  return 'bg-neutral-100 text-neutral-600';
};

export default function StudentLogsPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;
  const user = getCurrentUser();
  const teacherId = user?.id || '';

  const [student, setStudent] = useState<Student | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

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

    // Load activity logs
    const allLogs = (storage.getItem('activityLogs') || []) as ActivityLog[];
    const allTrades = (storage.getItem('trades') || []) as Trade[];

    // Get teacher's logs and student-specific trade logs
    const teacherLogs = allLogs.filter((log) => log.teacherId === teacherId);
    
    // Create student-specific logs from trades
    const studentTradeLogs: ActivityLog[] = allTrades
      .filter((trade) => trade.studentId === studentId)
      .map((trade) => ({
        id: `trade-log-${trade.id}`,
        teacherId: teacherId,
        action: 'trade_executed',
        timestamp: trade.timestamp || trade.createdAt,
        details: `${trade.type} ${trade.quantity} ${trade.stock} @ ₹${(trade.price || 0).toFixed(2)} (${trade.status})`,
      }));

    // Filter teacher logs that mention this student
    const studentMentionedLogs = teacherLogs.filter((log) =>
      log.details.toLowerCase().includes(foundStudent.name.toLowerCase())
    );

    // Combine and sort by timestamp
    const combinedLogs = [...studentTradeLogs, ...studentMentionedLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    setLogs(combinedLogs);
    setCurrentPage(1);
  }, [studentId, teacherId, router]);

  // Filter logs based on search
  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return logs;

    const query = searchQuery.toLowerCase();
    return logs.filter(
      (log) =>
        log.action.toLowerCase().includes(query) ||
        log.details.toLowerCase().includes(query)
    );
  }, [logs, searchQuery]);

  // Paginate logs
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredLogs.slice(startIndex, startIndex + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));

  const handlePageSizeChange = (nextSize: number) => {
    setPageSize(nextSize);
    setCurrentPage(1);
  };

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
    setCurrentPage((prev) => (prev > maxPage ? maxPage : prev));
  }, [filteredLogs.length, pageSize]);

  if (!student || !isAuthenticated()) {
    return null;
  }

  return (
    <DashboardLayout title="Student Activity Logs">
      <Card padding="lg" className="border border-neutral-200 bg-white">
        <div className="space-y-6">
          <div className="space-y-3">
            <PageHeader title={`${student.name} - Activity Logs`} />

            {/* Search Bar - Aligned to Right */}
            <div className="flex justify-end">
              <div className="w-full max-w-md">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search activity logs..."
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Logs List */}
          {filteredLogs.length === 0 ? (
            <EmptyState
              title="No activity logs found"
              description={
                searchQuery
                  ? 'Try adjusting your search criteria'
                  : 'No activity logs available for this student'
              }
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
              <div className="divide-y divide-neutral-100">
                {paginatedLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex gap-4">
                      {/* Icon */}
                      <div
                        className={cn(
                          'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
                          getActionColor(log.action)
                        )}
                      >
                        {(() => {
                          const IconComponent = getActionIcon(log.action);
                          return <IconComponent className="h-5 w-5" />;
                        })()}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-neutral-900 capitalize mb-1">
                              {log.action.replace(/_/g, ' ')}
                            </p>
                            <p className="text-sm text-neutral-600">{log.details}</p>
                          </div>
                          <span className="flex-shrink-0 text-xs text-neutral-500 whitespace-nowrap">
                            {formatRelativeTime(log.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 mt-1">
                          {formatDate(log.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <PaginationFooter
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredLogs.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={handlePageSizeChange}
              />
            </div>
          )}
        </div>
      </Card>
    </DashboardLayout>
  );
}

