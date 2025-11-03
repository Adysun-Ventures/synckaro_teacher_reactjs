'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CheckIcon, XMarkIcon, UserIcon } from '@heroicons/react/24/outline';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { SearchBar } from '@/components/common/SearchBar';
import { Avatar } from '@/components/common/Avatar';
import { EmptyState } from '@/components/common/EmptyState';
import { isAuthenticated, getCurrentUser } from '@/services/authService';
import { storage } from '@/lib/storage';
import { ConnectionRequest, Student } from '@/types';
import { cn } from '@/lib/utils';

export default function IncomingRequestsPage() {
  const router = useRouter();
  const user = getCurrentUser();
  const teacherId = user?.id || '';

  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ConnectionRequest['status']>('all');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    if (teacherId) {
      // Load incoming connection requests
      const allRequests = (storage.getItem('connections') || []) as ConnectionRequest[];
      const incomingRequests = allRequests.filter(
        (r) => r.teacherId === teacherId && r.status !== 'rejected'
      );
      setRequests(incomingRequests);

      // Load students for student info
      const allStudents = (storage.getItem('students') || []) as Student[];
      setStudents(allStudents);
    }
  }, [teacherId]);

  // Filter requests
  const filteredRequests = useMemo(() => {
    let filtered = requests;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((r) => {
        const student = students.find((s) => s.id === r.studentId);
        return (
          student?.name.toLowerCase().includes(query) ||
          student?.email.toLowerCase().includes(query) ||
          student?.mobile.toLowerCase().includes(query)
        );
      });
    }

    return filtered;
  }, [requests, students, searchQuery, statusFilter]);

  const handleAccept = (requestId: string) => {
    const allRequests = (storage.getItem('connections') || []) as ConnectionRequest[];
    const updatedRequests = allRequests.map((r) =>
      r.id === requestId
        ? { ...r, status: 'accepted' as const, respondedAt: new Date().toISOString() }
        : r
    );

    // Update student to link to teacher
    const request = requests.find((r) => r.id === requestId);
    if (request) {
      const allStudents = (storage.getItem('students') || []) as Student[];
      const updatedStudents = allStudents.map((s) =>
        s.id === request.studentId ? { ...s, teacherId, teacherName: user?.name } : s
      );
      storage.setItem('students', updatedStudents);
    }

    storage.setItem('connections', updatedRequests);
    setRequests(updatedRequests.filter((r) => r.teacherId === teacherId));
  };

  const handleReject = (requestId: string) => {
    const allRequests = (storage.getItem('connections') || []) as ConnectionRequest[];
    const updatedRequests = allRequests.map((r) =>
      r.id === requestId
        ? { ...r, status: 'rejected' as const, respondedAt: new Date().toISOString() }
        : r
    );
    storage.setItem('connections', updatedRequests);
    setRequests(updatedRequests.filter((r) => r.teacherId === teacherId && r.status !== 'rejected'));
  };

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

  const getStudentInfo = (studentId: string) => {
    return students.find((s) => s.id === studentId);
  };

  return (
    <DashboardLayout title="Incoming Connection Requests">
      <div className="space-y-6">
        {/* Filters */}
        <Card padding="lg">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-64">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search students..."
                className="w-full"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | ConnectionRequest['status'])}
              className="px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
            </select>
          </div>
        </Card>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <Card padding="lg">
            <EmptyState
              title="No incoming requests"
              description={
                searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No connection requests from students yet'
              }
            />
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredRequests.map((request) => {
              const student = getStudentInfo(request.studentId);
              if (!student) return null;

              return (
                <Card key={request.id} padding="lg">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <Avatar
                        name={student.name}
                        size="lg"
                        showStatus
                        statusColor={request.status === 'accepted' ? 'success' : 'warning'}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                          {student.name}
                        </h3>
                        <div className="space-y-1 text-sm text-neutral-600">
                          <p>{student.email}</p>
                          <p>{student.mobile}</p>
                          <p className="text-xs text-neutral-500">
                            Requested: {formatDate(request.createdAt)}
                          </p>
                          {request.respondedAt && (
                            <p className="text-xs text-neutral-500">
                              Responded: {formatDate(request.respondedAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'px-3 py-1 rounded-full text-xs font-medium',
                          request.status === 'pending'
                            ? 'bg-warning-100 text-warning-700'
                            : request.status === 'accepted'
                            ? 'bg-success-100 text-success-700'
                            : 'bg-neutral-100 text-neutral-700'
                        )}
                      >
                        {request.status}
                      </span>
                      {request.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleAccept(request.id)}
                            icon={<CheckIcon className="h-4 w-4" />}
                          >
                            Accept
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleReject(request.id)}
                            icon={<XMarkIcon className="h-4 w-4" />}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

