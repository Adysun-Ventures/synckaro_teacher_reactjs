import { storage } from '@/lib/storage';
import { Trade, Student } from '@/types';
import { getCurrentUser } from './authService';

/**
 * Trade Service for SyncKaro Teacher
 * Handles trade operations including panic button functionality
 */

/**
 * Close all open trades for teacher and their students (Panic Button)
 * @param teacherId - Teacher ID
 * @returns Number of trades closed
 */
export function closeAllTrades(teacherId: string): number {
  const allTrades = (storage.getItem('trades') || []) as Trade[];
  const allStudents = (storage.getItem('students') || []) as Student[];

  const teacherStudentIds = allStudents
    .filter((s) => s.teacherId === teacherId)
    .map((s) => s.id);

  const tradesToClose = allTrades.filter(
    (t) =>
      (t.teacherId === teacherId || (t.studentId && teacherStudentIds.includes(t.studentId))) &&
      (t.status === 'pending' || t.status === 'executed')
  );

  const updatedTrades = allTrades.map((t) => {
    if (
      (t.teacherId === teacherId || (t.studentId && teacherStudentIds.includes(t.studentId))) &&
      (t.status === 'pending' || t.status === 'executed')
    ) {
      return { ...t, status: 'completed' as const };
    }
    return t;
  });

  storage.setItem('trades', updatedTrades);

  return tradesToClose.length;
}

/**
 * Get panic handler for current teacher
 * @returns Function that closes all trades and returns count
 */
export function getPanicHandler() {
  const user = getCurrentUser();
  const teacherId = user?.id || '';
  
  return () => {
    if (!teacherId) {
      return 0;
    }
    return closeAllTrades(teacherId);
  };
}

