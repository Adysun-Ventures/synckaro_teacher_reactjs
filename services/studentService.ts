import { storage } from '@/lib/storage';
import { Student, BrokerConfig } from '@/types';
// import apiClient from '@/lib/api'; // TODO: Uncomment when integrating with API

/**
 * Student Service for SyncKaro Teacher
 * Handles CRUD operations for students with localStorage
 * All operations are teacher-scoped (only access teacher's students)
 * 
 * TODO: API Integration
 * - Replace getStudents with API call to /teacher/student/list
 * - Replace getStudent with API call to /teacher/student/view
 * - Replace createStudent with API call to /teacher/student/create
 * - Replace updateStudent with API call to /teacher/student/update
 * - Replace deleteStudent with API call to /teacher/student/delete
 * - Replace bulkCreateStudents with API call to /teacher/student/bulk-create
 * - Add error handling and fallback to localStorage
 */

/**
 * Generate unique ID for new student
 */
function generateId(): string {
  return `student-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get all students for a specific teacher
 * @param teacherId - Teacher ID
 * @returns Array of students
 */
export function getStudents(teacherId: string): Student[] {
  // TODO: API Integration - Replace with actual API call
  // const response = await apiClient.post<Student[]>(
  //   '/teacher/student/list',
  //   { teacherId }
  // );
  
  const allStudents = (storage.getItem('students') || []) as Student[];
  return allStudents.filter((s) => s.teacherId === teacherId);
}

/**
 * Get a single student by ID (teacher-scoped)
 * @param id - Student ID
 * @param teacherId - Teacher ID
 * @returns Student or null
 */
export function getStudent(id: string, teacherId: string): Student | null {
  const allStudents = (storage.getItem('students') || []) as Student[];
  const student = allStudents.find((s) => s.id === id && s.teacherId === teacherId);
  return student || null;
}

/**
 * Create a new student
 * @param data - Student data (must include teacherId)
 * @returns Created student
 */
export function createStudent(data: Omit<Student, 'id' | 'joinedDate'> & { teacherId: string }): Student {
  // TODO: API Integration - Replace with actual API call
  // const response = await apiClient.post<Student>(
  //   '/teacher/student/create',
  //   data
  // );
  
  const allStudents = (storage.getItem('students') || []) as Student[];
  
  const newStudent: Student = {
    id: generateId(),
    name: data.name,
    email: data.email,
    mobile: data.mobile,
    teacherId: data.teacherId,
    teacherName: data.teacherName,
    status: data.status || 'active',
    initialCapital: data.initialCapital || 0,
    currentCapital: data.initialCapital || data.currentCapital || 0,
    profitLoss: data.profitLoss || 0,
    riskPercentage: data.riskPercentage || 10,
    strategy: data.strategy || '',
    joinedDate: new Date().toISOString(),
  };

  allStudents.push(newStudent);
  storage.setItem('students', allStudents);

  return newStudent;
}

/**
 * Update a student (teacher-scoped)
 * @param id - Student ID
 * @param data - Updated student data
 * @param teacherId - Teacher ID
 * @returns Updated student or null
 */
export function updateStudent(
  id: string,
  data: Partial<Omit<Student, 'id' | 'teacherId' | 'joinedDate'>>,
  teacherId: string
): Student | null {
  const allStudents = (storage.getItem('students') || []) as Student[];
  const index = allStudents.findIndex((s) => s.id === id && s.teacherId === teacherId);

  if (index === -1) {
    return null;
  }

  const updatedStudent: Student = {
    ...allStudents[index],
    ...data,
  };

  allStudents[index] = updatedStudent;
  storage.setItem('students', allStudents);

  return updatedStudent;
}

/**
 * Delete a student (teacher-scoped)
 * @param id - Student ID
 * @param teacherId - Teacher ID
 * @returns true if deleted, false if not found
 */
export function deleteStudent(id: string, teacherId: string): boolean {
  // TODO: API Integration - Replace with actual API call
  // const response = await apiClient.delete(
  //   '/teacher/student/delete',
  //   { data: { id, teacherId } }
  // );
  
  const allStudents = (storage.getItem('students') || []) as Student[];
  const filtered = allStudents.filter((s) => !(s.id === id && s.teacherId === teacherId));

  if (filtered.length === allStudents.length) {
    return false; // Student not found
  }

  storage.setItem('students', filtered);
  return true;
}

/**
 * Bulk create students from CSV data
 * @param students - Array of student data
 * @param teacherId - Teacher ID
 * @returns Created students and errors
 */
export function bulkCreateStudents(
  students: Array<Omit<Student, 'id' | 'joinedDate' | 'teacherId'>>,
  teacherId: string
): { created: Student[]; errors: Array<{ row: number; error: string }> } {
  const allStudents = (storage.getItem('students') || []) as Student[];
  const created: Student[] = [];
  const errors: Array<{ row: number; error: string }> = [];

  students.forEach((studentData, index) => {
    try {
      // Validate required fields
      if (!studentData.name || !studentData.email || !studentData.mobile) {
        errors.push({
          row: index + 1,
          error: 'Missing required fields: name, email, or mobile',
        });
        return;
      }

      // Check for duplicate email
      const emailExists = allStudents.some((s) => s.email === studentData.email);
      if (emailExists) {
        errors.push({
          row: index + 1,
          error: `Email ${studentData.email} already exists`,
        });
        return;
      }

      const newStudent: Student = {
        id: generateId(),
        name: studentData.name,
        email: studentData.email,
        mobile: studentData.mobile,
        teacherId,
        status: studentData.status || 'active',
        initialCapital: studentData.initialCapital || 0,
        currentCapital: studentData.initialCapital || studentData.currentCapital || 0,
        profitLoss: studentData.profitLoss || 0,
        riskPercentage: studentData.riskPercentage || 10,
        strategy: studentData.strategy || '',
        joinedDate: new Date().toISOString(),
      };

      created.push(newStudent);
      allStudents.push(newStudent);
    } catch (error) {
      errors.push({
        row: index + 1,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  if (created.length > 0) {
    storage.setItem('students', allStudents);
  }

  return { created, errors };
}

/**
 * Toggle student status (active/inactive)
 * @param id - Student ID
 * @param isActive - New status
 * @param teacherId - Teacher ID
 * @returns Updated student or null
 */
export function toggleStudentStatus(id: string, isActive: boolean, teacherId: string): Student | null {
  return updateStudent(id, { status: isActive ? 'active' : 'inactive' }, teacherId);
}

/**
 * Update broker configuration for a student
 * @param studentId - Student ID
 * @param config - Broker configuration
 * @param teacherId - Teacher ID
 * @returns Updated broker config or null
 */
export function updateBrokerConfig(
  studentId: string,
  config: Omit<BrokerConfig, 'userId'>,
  teacherId: string
): BrokerConfig | null {
  // Verify student exists and belongs to teacher
  const student = getStudent(studentId, teacherId);
  if (!student) {
    return null;
  }

  // Get all broker configs
  const allConfigs = (storage.getItem('brokerConfigs') || []) as BrokerConfig[];
  
  // Find existing config or create new
  const existingIndex = allConfigs.findIndex((c) => c.userId === studentId);
  
  const brokerConfig: BrokerConfig = {
    userId: studentId,
    brokerProvider: config.brokerProvider,
    apiKey: config.apiKey,
    apiSecret: config.apiSecret,
    accessToken: config.accessToken,
    isConnected: config.isConnected,
    lastChecked: config.lastChecked || new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    allConfigs[existingIndex] = brokerConfig;
  } else {
    allConfigs.push(brokerConfig);
  }

  storage.setItem('brokerConfigs', allConfigs);
  return brokerConfig;
}

/**
 * Get broker configuration for a student
 * @param studentId - Student ID
 * @param teacherId - Teacher ID
 * @returns Broker config or null
 */
export function getBrokerConfig(studentId: string, teacherId: string): BrokerConfig | null {
  // Verify student exists and belongs to teacher
  const student = getStudent(studentId, teacherId);
  if (!student) {
    return null;
  }

  const allConfigs = (storage.getItem('brokerConfigs') || []) as BrokerConfig[];
  return allConfigs.find((c) => c.userId === studentId) || null;
}

