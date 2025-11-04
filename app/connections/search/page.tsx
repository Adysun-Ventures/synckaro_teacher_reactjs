'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlusIcon, EyeIcon } from '@heroicons/react/24/outline';
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
import { Student, ConnectionRequest } from '@/types';
import { cn } from '@/lib/utils';

export default function SearchZombieStudentsPage() {
  const router = useRouter();
  const user = getCurrentUser();
  const teacherId = user?.id || '';

  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sendConfirmOpen, setSendConfirmOpen] = useState(false);
  const [studentToRequest, setStudentToRequest] = useState<Student | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    // Load all students
    const students = (storage.getItem('students') || []) as Student[];
    setAllStudents(students);

    // Load connection requests
    const requests = (storage.getItem('connections') || []) as ConnectionRequest[];
    setConnectionRequests(requests);
  }, [teacherId]);

  // Get zombie students (not associated with any teacher)
  const zombieStudents = useMemo(() => {
    return allStudents.filter((student) => !student.teacherId || student.teacherId === '');
  }, [allStudents]);

  // Filter zombie students
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return zombieStudents;

    const query = searchQuery.toLowerCase();
    return zombieStudents.filter(
      (student) =>
        student.name.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query) ||
        student.mobile.toLowerCase().includes(query)
    );
  }, [zombieStudents, searchQuery]);

  // Check if request already exists
  const hasRequest = (studentId: string): boolean => {
    return connectionRequests.some(
      (r) => r.studentId === studentId && r.teacherId === teacherId
    );
  };

  const handleSendRequest = (student: Student) => {
    setStudentToRequest(student);
    setSendConfirmOpen(true);
  };

  const confirmSendRequest = () => {
    if (studentToRequest && teacherId) {
      const allRequests = (storage.getItem('connections') || []) as ConnectionRequest[];
      const newRequest: ConnectionRequest = {
        id: `connection-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        studentId: studentToRequest.id,
        teacherId,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      allRequests.push(newRequest);
      storage.setItem('connections', allRequests);
      setConnectionRequests(allRequests);

      setSendConfirmOpen(false);
      setStudentToRequest(null);

      alert(`Connection request sent to ${studentToRequest.name}`);
    }
  };

  if (!isAuthenticated() || !teacherId) {
    return null;
  }

  return (
    <DashboardLayout title="Search Students">
      <div className="space-y-6">
        {/* Search with Title */}
        <Card 
          padding="lg"
          className="border border-neutral-200 bg-white shadow-sm"
        >
          <div className="space-y-4">
            {/* Page Header with Back Button and Centered Title */}
            <PageHeader title="Search Students" />
            
            {/* Search Controls */}
            <div className="pt-2">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by name, email, or mobile..."
            className="w-full"
          />
            </div>
          </div>
        </Card>

        {/* Students List */}
        {filteredStudents.length === 0 ? (
          <Card padding="lg">
            <EmptyState
              title="No zombie students found"
              description={
                searchQuery
                  ? 'Try adjusting your search criteria'
                  : 'No unassociated students available'
              }
            />
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredStudents.map((student) => {
              const hasPendingRequest = hasRequest(student.id);

              return (
                <Card 
                  key={student.id} 
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
                        statusColor={student.status === 'active' ? 'success' : 'danger'}
                      />
                    </div>
                    
                    {/* Student Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-sm font-semibold text-neutral-900 truncate">
                          {student.name}
                        </h3>
                        {hasPendingRequest && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 bg-warning-100 text-warning-700">
                            Sent
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-1 text-xs text-neutral-600 mb-3">
                        <p className="truncate" title={student.email}>
                          {student.email}
                        </p>
                        <p className="truncate" title={student.mobile}>
                          {student.mobile}
                        </p>
                      </div>

                      {/* Action Buttons - Icon Only */}
                      <div className={cn(
                        "grid place-items-center gap-3 pt-2 border-t border-neutral-100 w-full",
                        hasPendingRequest ? "grid-cols-1" : "grid-cols-2"
                      )}>
                        <button
                          type="button"
                          onClick={() => router.push(`/students/${student.id}`)}
                          className="h-10 w-10 rounded-full bg-primary-600 text-white hover:bg-primary-700 hover:scale-110 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 flex items-center justify-center"
                          aria-label="View profile"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        {!hasPendingRequest && (
                          <button
                            type="button"
                            onClick={() => handleSendRequest(student)}
                            className="h-10 w-10 rounded-full bg-success-600 text-white hover:bg-success-700 hover:scale-110 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-success-500 focus:ring-offset-2 flex items-center justify-center"
                            aria-label="Send request"
                          >
                            <UserPlusIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Send Request Confirmation Dialog */}
        <ConfirmDialog
          open={sendConfirmOpen}
          onClose={() => {
            setSendConfirmOpen(false);
            setStudentToRequest(null);
          }}
          onConfirm={confirmSendRequest}
          title="Send Connection Request"
          message={`Are you sure you want to send a connection request to ${studentToRequest?.name || 'this student'}?`}
        />
      </div>
    </DashboardLayout>
  );
}

