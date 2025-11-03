'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { XMarkIcon, UserIcon } from '@heroicons/react/24/outline';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { SearchBar } from '@/components/common/SearchBar';
import { Avatar } from '@/components/common/Avatar';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/Modal';
import { isAuthenticated, getCurrentUser } from '@/services/authService';
import { storage } from '@/lib/storage';
import { ConnectionRequest, Student } from '@/types';
import { cn } from '@/lib/utils';

export default function OutgoingRequestsPage() {
  const router = useRouter();
  const user = getCurrentUser();
  const teacherId = user?.id || '';

  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ConnectionRequest['status']>('all');
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [requestToCancel, setRequestToCancel] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    if (teacherId) {
      // Load outgoing connection requests
      const allRequests = (storage.getItem('connections') || []) as ConnectionRequest[];
      const outgoingRequests = allRequests.filter((r) => r.teacherId === teacherId);
      setRequests(outgoingRequests);

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

  const handleCancel = (requestId: string) => {
    setRequestToCancel(requestId);
    setCancelConfirmOpen(true);
  };

  const confirmCancel = () => {
    if (requestToCancel) {
      const allRequests = (storage.getItem('connections') || []) as ConnectionRequest[];
      const updatedRequests = allRequests.filter((r) => r.id !== requestToCancel);
      storage.setItem('connections', updatedRequests);
      setRequests(updatedRequests.filter((r) => r.teacherId === teacherId));
      setCancelConfirmOpen(false);
      setRequestToCancel(null);
    }
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

  const requestToCancelInfo = requestToCancel
    ? getStudentInfo(requests.find((r) => r.id === requestToCancel)?.studentId || '')
    : null;

  return (
    <DashboardLayout title="Outgoing Connection Requests">
      <div className="space-y-6">
        {/* Filters with Title */}
        <Card 
          padding="lg"
          className="border border-neutral-200 bg-white shadow-sm"
        >
          <div className="space-y-4">
            {/* Page Header with Back Button and Centered Title */}
            <PageHeader title="Outgoing Connection Requests" />
            
            {/* Search and Filter Controls */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
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
                className="px-4 py-2.5 text-sm text-neutral-700 bg-white border border-neutral-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600 transition-all duration-200 hover:border-neutral-400"
              >
                <option value="all" className="text-neutral-700">All Status</option>
                <option value="pending" className="text-neutral-700">Pending</option>
                <option value="accepted" className="text-neutral-700">Accepted</option>
                <option value="rejected" className="text-neutral-700">Rejected</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <Card padding="lg">
            <EmptyState
              title="No outgoing requests"
              description={
                searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No connection requests sent yet. Search for zombie students to send requests.'
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
                        statusColor={
                          request.status === 'accepted'
                            ? 'success'
                            : request.status === 'rejected'
                            ? 'danger'
                            : 'warning'
                        }
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                          {student.name}
                        </h3>
                        <div className="space-y-1 text-sm text-neutral-600">
                          <p>{student.email}</p>
                          <p>{student.mobile}</p>
                          <p className="text-xs text-neutral-500">
                            Sent: {formatDate(request.createdAt)}
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
                            : 'bg-danger-100 text-danger-700'
                        )}
                      >
                        {request.status}
                      </span>
                      {request.status === 'pending' && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleCancel(request.id)}
                          icon={<XMarkIcon className="h-4 w-4" />}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Cancel Confirmation Dialog */}
        <ConfirmDialog
          open={cancelConfirmOpen}
          onClose={() => {
            setCancelConfirmOpen(false);
            setRequestToCancel(null);
          }}
          onConfirm={confirmCancel}
          title="Cancel Connection Request"
          message={`Are you sure you want to cancel the connection request to ${requestToCancelInfo?.name || 'this student'}?`}
        />
      </div>
    </DashboardLayout>
  );
}

