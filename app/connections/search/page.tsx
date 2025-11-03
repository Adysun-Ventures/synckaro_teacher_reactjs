'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlusIcon, CheckIcon } from '@heroicons/react/24/outline';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
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
    <DashboardLayout title="Search Zombie Students">
      <div className="space-y-6">
        {/* Search */}
        <Card padding="lg">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              Search Zombie Students
            </h3>
            <p className="text-sm text-neutral-500">
              Find students who are not associated with any teacher. Send them connection requests.
            </p>
          </div>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by name, email, or mobile..."
            className="w-full"
          />
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredStudents.map((student) => {
              const hasPendingRequest = hasRequest(student.id);

              return (
                <Card key={student.id} padding="lg">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <Avatar
                      name={student.name}
                      size="xl"
                      showStatus
                      statusColor={student.status === 'active' ? 'success' : 'danger'}
                    />
                    <div className="w-full">
                      <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                        {student.name}
                      </h3>
                      <div className="space-y-1 text-sm text-neutral-600">
                        <p>{student.email}</p>
                        <p>{student.mobile}</p>
                        {student.initialCapital && (
                          <p className="text-xs text-neutral-500">
                            Capital: ₹{student.initialCapital.toLocaleString('en-IN')}
                          </p>
                        )}
                      </div>
                    </div>
                    {hasPendingRequest ? (
                      <div className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-warning-50 text-warning-700 rounded-lg">
                        <CheckIcon className="h-4 w-4" />
                        <span className="text-sm font-medium">Request Sent</span>
                      </div>
                    ) : (
                      <Button
                        variant="primary"
                        fullWidth
                        onClick={() => handleSendRequest(student)}
                        icon={<UserPlusIcon className="h-4 w-4" />}
                      >
                        Send Request
                      </Button>
                    )}
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

