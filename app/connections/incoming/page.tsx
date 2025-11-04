'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CheckIcon, XMarkIcon, EyeIcon } from '@heroicons/react/24/outline';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
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

  const getStudentInfo = (studentId: string) => {
    return students.find((s) => s.id === studentId);
  };

  return (
    <DashboardLayout title="Incoming Connection Requests">
      <div className="space-y-6">
        {/* Filters with Title */}
        <Card 
          padding="lg"
          className="border border-neutral-200 bg-white shadow-sm"
        >
          <div className="space-y-4">
            {/* Page Header with Back Button and Centered Title */}
            <PageHeader title="Incoming Connection Requests" />
            
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
              </select>
            </div>
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
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredRequests.map((request) => {
              const student = getStudentInfo(request.studentId);
              if (!student) return null;

              const requestDate = new Date(request.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });

              return (
                <Card 
                  key={request.id} 
                  padding="md"
                  className="border border-neutral-200 bg-white shadow-sm hover:shadow-md hover:border-primary-200 transition-all duration-200"
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <Avatar
                        name={student.name}
                        size="md"
                        showStatus
                        statusColor={request.status === 'accepted' ? 'success' : 'warning'}
                      />
                    </div>
                    
                    {/* Student Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-sm font-semibold text-neutral-900 truncate">
                          {student.name}
                        </h3>
                        <span className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0",
                          request.status === 'accepted' 
                            ? "bg-success-100 text-success-700" 
                            : "bg-warning-100 text-warning-700"
                        )}>
                          {request.status}
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-xs text-neutral-600 mb-3">
                        <p className="truncate" title={student.email}>
                          {student.email}
                        </p>
                        <p className="truncate" title={student.mobile}>
                          {student.mobile}
                        </p>
                        <p className="text-neutral-500">
                          Requested: {requestDate}
                        </p>
                      </div>

                      {/* Action Buttons - Icon Only */}
                      <div className={cn(
                        "grid place-items-center gap-3 pt-2 border-t border-neutral-100 w-full",
                        request.status === 'pending' ? "grid-cols-3" : "grid-cols-1"
                      )}>
                        <button
                          type="button"
                          onClick={() => router.push(`/students/${student.id}`)}
                          className="h-10 w-10 rounded-full bg-primary-600 text-white hover:bg-primary-700 hover:scale-110 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 flex items-center justify-center"
                          aria-label="View profile"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        {request.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleAccept(request.id)}
                              className="h-10 w-10 rounded-full bg-success-600 text-white hover:bg-success-700 hover:scale-110 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-success-500 focus:ring-offset-2 flex items-center justify-center"
                              aria-label="Accept request"
                            >
                              <CheckIcon className="h-5 w-5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(request.id)}
                              className="h-10 w-10 rounded-full bg-danger-500 text-white hover:bg-danger-600 hover:scale-110 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-danger-500 focus:ring-offset-2 flex items-center justify-center"
                              aria-label="Reject request"
                            >
                              <XMarkIcon className="h-5 w-5" />
                            </button>
                          </>
                        )}
                      </div>
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

