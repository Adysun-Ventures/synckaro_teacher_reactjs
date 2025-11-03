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
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
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
          <Card padding="sm" className="border border-neutral-200 bg-white hover:shadow-md transition-all duration-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1.5">Incoming Requests</p>
                <p className="text-2xl font-bold text-neutral-900 mb-1">{stats.incomingPending}</p>
                <p className="text-xs text-neutral-400">Pending approval</p>
              </div>
              <div className="flex-shrink-0 ml-3">
                <div className="bg-primary-50 p-2.5 rounded-lg">
                  <ArrowDownLeftIcon className="h-5 w-5 text-primary-600" />
                </div>
              </div>
            </div>
          </Card>

          <Card padding="sm" className="border border-neutral-200 bg-white hover:shadow-md transition-all duration-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1.5">Outgoing Requests</p>
                <p className="text-2xl font-bold text-neutral-900 mb-1">{stats.outgoingPending}</p>
                <p className="text-xs text-neutral-400">Awaiting response</p>
              </div>
              <div className="flex-shrink-0 ml-3">
                <div className="bg-warning-50 p-2.5 rounded-lg">
                  <ArrowUpRightIcon className="h-5 w-5 text-warning-600" />
                </div>
              </div>
            </div>
          </Card>

          <Card padding="sm" className="border border-neutral-200 bg-white hover:shadow-md transition-all duration-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1.5">Zombie Students</p>
                <p className="text-2xl font-bold text-neutral-900 mb-1">{stats.zombieStudents}</p>
                <p className="text-xs text-neutral-400">Available to connect</p>
              </div>
              <div className="flex-shrink-0 ml-3">
                <div className="bg-success-50 p-2.5 rounded-lg">
                  <UserGroupIcon className="h-5 w-5 text-success-600" />
                </div>
              </div>
            </div>
          </Card>

          <Card padding="sm" className="border border-neutral-200 bg-white hover:shadow-md transition-all duration-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1.5">Connected Students</p>
                <p className="text-2xl font-bold text-neutral-900 mb-1">{stats.connectedStudents}</p>
                <p className="text-xs text-neutral-400">Active connections</p>
              </div>
              <div className="flex-shrink-0 ml-3">
                <div className="bg-success-50 p-2.5 rounded-lg">
                  <CheckCircleIcon className="h-5 w-5 text-success-600" />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-neutral-900">Quick Actions</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <Link href="/connections/incoming">
              <Card padding="sm" className="border border-neutral-200 bg-white hover:shadow-md hover:border-primary-300 transition-all duration-200 cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="bg-primary-50 p-2 rounded-lg flex-shrink-0">
                      <ArrowDownLeftIcon className="h-5 w-5 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-neutral-900 mb-0.5 leading-tight">Incoming Requests</h3>
                      <p className="text-xs text-neutral-500 leading-tight truncate">Review and manage</p>
                    </div>
                  </div>
                  <ArrowRightIcon className="h-4 w-4 text-neutral-400 group-hover:text-primary-600 transition-colors flex-shrink-0 ml-2" />
                </div>
              </Card>
            </Link>

            <Link href="/connections/outgoing">
              <Card padding="sm" className="border border-neutral-200 bg-white hover:shadow-md hover:border-warning-300 transition-all duration-200 cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="bg-warning-50 p-2 rounded-lg flex-shrink-0">
                      <ArrowUpRightIcon className="h-5 w-5 text-warning-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-neutral-900 mb-0.5 leading-tight">Outgoing Requests</h3>
                      <p className="text-xs text-neutral-500 leading-tight truncate">Track your sent requests</p>
                    </div>
                  </div>
                  <ArrowRightIcon className="h-4 w-4 text-neutral-400 group-hover:text-warning-600 transition-colors flex-shrink-0 ml-2" />
                </div>
              </Card>
            </Link>

            <Link href="/connections/search">
              <Card padding="sm" className="border border-neutral-200 bg-white hover:shadow-md hover:border-success-300 transition-all duration-200 cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="bg-success-50 p-2 rounded-lg flex-shrink-0">
                      <MagnifyingGlassIcon className="h-5 w-5 text-success-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-neutral-900 mb-0.5 leading-tight">Search Students</h3>
                      <p className="text-xs text-neutral-500 leading-tight truncate">Find zombie students</p>
                    </div>
                  </div>
                  <ArrowRightIcon className="h-4 w-4 text-neutral-400 group-hover:text-success-600 transition-colors flex-shrink-0 ml-2" />
                </div>
              </Card>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Recent Incoming Requests */}
          <Card padding="sm" className="border border-neutral-200 bg-white">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-neutral-900">Recent Incoming</h2>
              <Link 
                href="/connections/incoming"
                className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
              >
                View All
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </Link>
            </div>
            {recentIncoming.length === 0 ? (
              <div className="text-center py-6 text-xs text-neutral-500">
                <p>No incoming requests</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-2">
                {recentIncoming.map((req) => {
                  if (!req.student) return null;
                  return (
                    <div
                      key={req.id}
                      onClick={() => {
                        if (req.student) {
                          router.push(`/students/${req.student.id}`);
                        }
                      }}
                      className="flex items-center gap-2.5 p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 hover:border-primary-200 transition-all duration-200 cursor-pointer"
                    >
                      <Avatar
                        name={req.student.name}
                        size="sm"
                        showStatus
                        statusColor="warning"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 truncate leading-tight">{req.student.name}</p>
                        <p className="text-xs text-neutral-500 leading-tight">{formatDate(req.createdAt)}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-warning-100 text-warning-700 border border-warning-200 flex-shrink-0">
                        Pending
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Recent Outgoing Requests */}
          <Card padding="sm" className="border border-neutral-200 bg-white">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-neutral-900">Recent Outgoing</h2>
              <Link 
                href="/connections/outgoing"
                className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
              >
                View All
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </Link>
            </div>
            {recentOutgoing.length === 0 ? (
              <div className="text-center py-6 text-xs text-neutral-500">
                <p>No outgoing requests</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-2">
                {recentOutgoing.map((req) => {
                  if (!req.student) return null;
                  return (
                    <div
                      key={req.id}
                      onClick={() => {
                        if (req.student) {
                          router.push(`/students/${req.student.id}`);
                        }
                      }}
                      className="flex items-center gap-2.5 p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 hover:border-warning-200 transition-all duration-200 cursor-pointer"
                    >
                      <Avatar
                        name={req.student.name}
                        size="sm"
                        showStatus
                        statusColor="warning"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 truncate leading-tight">{req.student.name}</p>
                        <p className="text-xs text-neutral-500 leading-tight">{formatDate(req.createdAt)}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-warning-100 text-warning-700 border border-warning-200 flex-shrink-0">
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

