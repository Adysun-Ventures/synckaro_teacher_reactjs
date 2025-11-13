import { storage } from '@/lib/storage';
import { Trade, Student } from '@/types';
import { getCurrentUser } from './authService';
// import apiClient from '@/lib/api'; // TODO: Uncomment when integrating with API

/**
 * Trade Service for SyncKaro Teacher
 * Handles trade operations including panic button functionality
 * 
 * TODO: API Integration
 * - Replace closeAllTrades with API call to /teacher/trade/close-all
 * - Add API calls for trade creation, updates, and history
 * - Add real-time trade status updates
 */

/**
 * Close all open trades for teacher and their students (Panic Button)
 * @param teacherId - Teacher ID
 * @returns Number of trades closed
 */
export function closeAllTrades(teacherId: string): number {
  // TODO: API Integration - Replace with actual API call
  // const response = await apiClient.post<{ closedCount: number }>(
  //   '/teacher/trade/close-all',
  //   { teacherId }
  // );
  
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

