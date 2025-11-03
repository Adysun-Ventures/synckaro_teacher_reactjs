'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  UserPlusIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Avatar } from '@/components/common/Avatar';
import { isAuthenticated, getCurrentUser } from '@/services/authService';
import { storage } from '@/lib/storage';
import { ConnectionRequest, Student } from '@/types';
import { cn } from '@/lib/utils';

export default function ConnectionsPage() {
  const router = useRouter();
  const user = getCurrentUser();
  const teacherId = user?.id || '';

  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    if (teacherId) {
      // Load connection requests
      const allRequests = (storage.getItem('connections') || []) as ConnectionRequest[];
      setConnectionRequests(allRequests);

      // Load students
      const allStudents = (storage.getItem('students') || []) as Student[];
      setStudents(allStudents);
    }
  }, [teacherId]);

  // Calculate statistics
  const stats = useMemo(() => {
    // Incoming: requests initiated by students (ID contains 'incoming')
    const incoming = connectionRequests.filter(
      (r) => r.teacherId === teacherId && r.status === 'pending' && r.id.includes('incoming')
    );
    // Outgoing: requests initiated by teacher (ID contains 'outgoing')
    const outgoing = connectionRequests.filter(
      (r) => r.teacherId === teacherId && r.status === 'pending' && r.id.includes('outgoing')
    );
    const zombieStudents = students.filter((s) => !s.teacherId || s.teacherId === '');
    const connectedStudents = students.filter((s) => s.teacherId === teacherId);

    return {
      incomingPending: incoming.length,
      outgoingPending: outgoing.length,
      zombieStudents: zombieStudents.length,
      connectedStudents: connectedStudents.length,
    };
  }, [connectionRequests, students, teacherId]);

  // Get recent incoming requests (last 5)
  const recentIncoming = useMemo(() => {
    const incoming = connectionRequests
      .filter((r) => r.teacherId === teacherId && r.status === 'pending' && r.id.includes('incoming'))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return incoming.map((req) => {
      const student = students.find((s) => s.id === req.studentId);
      return { ...req, student };
    });
  }, [connectionRequests, students, teacherId]);

  // Get recent outgoing requests (last 5)
  const recentOutgoing = useMemo(() => {
    const outgoing = connectionRequests
      .filter((r) => r.teacherId === teacherId && r.status === 'pending' && r.id.includes('outgoing'))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return outgoing.map((req) => {
      const student = students.find((s) => s.id === req.studentId);
      return { ...req, student };
    });
  }, [connectionRequests, students, teacherId]);

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

  if (!isAuthenticated() || !teacherId) {
    return null;
  }

  return (
    <DashboardLayout title="Connections">
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card padding="lg" className="hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="bg-primary-100 p-3 rounded-lg">
                <UserPlusIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-neutral-500 mb-1">Incoming Requests</p>
                <p className="text-2xl font-semibold text-neutral-900">{stats.incomingPending}</p>
                <p className="text-xs text-neutral-400 mt-1">Pending approval</p>
              </div>
            </div>
          </Card>

          <Card padding="lg" className="hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="bg-warning-100 p-3 rounded-lg">
                <UserPlusIcon className="h-6 w-6 text-warning-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-neutral-500 mb-1">Outgoing Requests</p>
                <p className="text-2xl font-semibold text-neutral-900">{stats.outgoingPending}</p>
                <p className="text-xs text-neutral-400 mt-1">Awaiting response</p>
              </div>
            </div>
          </Card>

          <Card padding="lg" className="hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="bg-success-100 p-3 rounded-lg">
                <UserGroupIcon className="h-6 w-6 text-success-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-neutral-500 mb-1">Zombie Students</p>
                <p className="text-2xl font-semibold text-neutral-900">{stats.zombieStudents}</p>
                <p className="text-xs text-neutral-400 mt-1">Available to connect</p>
              </div>
            </div>
          </Card>

          <Card padding="lg" className="hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="bg-success-100 p-3 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-success-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-neutral-500 mb-1">Connected Students</p>
                <p className="text-2xl font-semibold text-neutral-900">{stats.connectedStudents}</p>
                <p className="text-xs text-neutral-400 mt-1">Active connections</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card padding="lg">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/connections/incoming">
              <Card padding="md" className="hover:shadow-md transition-shadow cursor-pointer border-2 border-neutral-200 hover:border-primary-300">
                <div className="flex items-center gap-4">
                  <div className="bg-primary-100 p-3 rounded-lg">
                    <UserPlusIcon className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-neutral-900 mb-1">Incoming Requests</h3>
                    <p className="text-sm text-neutral-500">Review and manage incoming requests</p>
                  </div>
                  <ArrowRightIcon className="h-5 w-5 text-neutral-400" />
                </div>
              </Card>
            </Link>

            <Link href="/connections/outgoing">
              <Card padding="md" className="hover:shadow-md transition-shadow cursor-pointer border-2 border-neutral-200 hover:border-primary-300">
                <div className="flex items-center gap-4">
                  <div className="bg-warning-100 p-3 rounded-lg">
                    <UserPlusIcon className="h-6 w-6 text-warning-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-neutral-900 mb-1">Outgoing Requests</h3>
                    <p className="text-sm text-neutral-500">Track your sent requests</p>
                  </div>
                  <ArrowRightIcon className="h-5 w-5 text-neutral-400" />
                </div>
              </Card>
            </Link>

            <Link href="/connections/search">
              <Card padding="md" className="hover:shadow-md transition-shadow cursor-pointer border-2 border-neutral-200 hover:border-primary-300">
                <div className="flex items-center gap-4">
                  <div className="bg-success-100 p-3 rounded-lg">
                    <MagnifyingGlassIcon className="h-6 w-6 text-success-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-neutral-900 mb-1">Search Students</h3>
                    <p className="text-sm text-neutral-500">Find zombie students to connect</p>
                  </div>
                  <ArrowRightIcon className="h-5 w-5 text-neutral-400" />
                </div>
              </Card>
            </Link>
          </div>
        </Card>

        {/* Recent Activity */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Incoming Requests */}
          <Card padding="lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-neutral-900">Recent Incoming Requests</h2>
              <Link href="/connections/incoming">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRightIcon className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
            {recentIncoming.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                <p>No incoming requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentIncoming.map((req) => {
                  if (!req.student) return null;
                  return (
                    <div
                      key={req.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
                    >
                      <Avatar
                        name={req.student.name}
                        size="md"
                        showStatus
                        statusColor="warning"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-neutral-900 truncate">{req.student.name}</p>
                        <p className="text-xs text-neutral-500">{formatDate(req.createdAt)}</p>
                      </div>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-warning-100 text-warning-700">
                        Pending
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Recent Outgoing Requests */}
          <Card padding="lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-neutral-900">Recent Outgoing Requests</h2>
              <Link href="/connections/outgoing">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRightIcon className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
            {recentOutgoing.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                <p>No outgoing requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOutgoing.map((req) => {
                  if (!req.student) return null;
                  return (
                    <div
                      key={req.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
                    >
                      <Avatar
                        name={req.student.name}
                        size="md"
                        showStatus
                        statusColor="warning"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-neutral-900 truncate">{req.student.name}</p>
                        <p className="text-xs text-neutral-500">{formatDate(req.createdAt)}</p>
                      </div>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-warning-100 text-warning-700">
                        Pending
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

