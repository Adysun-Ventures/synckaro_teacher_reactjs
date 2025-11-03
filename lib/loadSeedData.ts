import { storage } from './storage';
import { generateAllSeedData, createConnectionRequests, createZombieStudents } from './seedData';
import { Teacher, Student, ConnectionRequest } from '@/types';

/**
 * Load seed data into localStorage if not already present
 * Call this on app initialization
 */
export function loadSeedData() {
  // Check if data already exists
  const existingTeachers = storage.getItem('teachers');
  const existingStudents = storage.getItem('students');
  const existingConnections = storage.getItem('connections');
  
  if (existingTeachers && existingTeachers.length > 0) {
    console.log('Seed data already exists in localStorage');
    
    // Check if connection requests exist and have data
    if (!existingConnections || existingConnections.length === 0) {
      console.log('Connection requests missing, generating...');
      ensureConnectionRequests();
    } else {
      console.log('Connection requests already exist:', existingConnections.length);
    }
    
    return;
  }

  console.log('Generating seed data...');
  const seedData = generateAllSeedData();

  // Store in localStorage
  storage.setItem('teachers', seedData.teachers);
  storage.setItem('students', seedData.students);
  storage.setItem('trades', seedData.trades);
  storage.setItem('activityLogs', seedData.activityLogs);
  storage.setItem('connections', seedData.connectionRequests || []);
  storage.setItem('brokerConfigs', seedData.brokerConfigs || []);
  storage.setItem('stats', seedData.stats);
  storage.setItem('seedDataGeneratedAt', seedData.generatedAt);

  console.log('Seed data loaded successfully:', {
    teachers: seedData.teachers.length,
    students: seedData.students.length,
    trades: seedData.trades.length,
    activityLogs: seedData.activityLogs.length,
    connectionRequests: (seedData.connectionRequests || []).length,
    brokerConfigs: (seedData.brokerConfigs || []).length,
  });
}

/**
 * Ensure connection requests are generated and stored
 * Loads existing teachers and students, generates zombie students if needed,
 * and creates connection requests for teacher-1
 */
function ensureConnectionRequests() {
  const teachers = (storage.getItem('teachers') || []) as Teacher[];
  const allStudents = (storage.getItem('students') || []) as Student[];
  
  // Find teacher-1
  const teacher1 = teachers.find((t) => t.id === 'teacher-1');
  if (!teacher1) {
    console.warn('teacher-1 not found, cannot generate connection requests');
    return;
  }
  
  // Get teacher-1's students
  const teacher1Students = allStudents.filter((s) => s.teacherId === teacher1.id);
  
  // Get existing zombie students
  let zombieStudents = allStudents.filter((s) => !s.teacherId || s.teacherId === '');
  
  // If we don't have enough zombie students (need at least 10 for 5 incoming + 5 outgoing),
  // generate more zombie students
  if (zombieStudents.length < 10) {
    console.log('Not enough zombie students, generating more...');
    const newZombieStudents = createZombieStudents(15);
    
    // Add new zombie students to allStudents
    const updatedStudents = [...allStudents, ...newZombieStudents];
    storage.setItem('students', updatedStudents);
    
    // Use all zombie students (existing + new) for connection requests
    zombieStudents = [...zombieStudents, ...newZombieStudents];
  }
  
  // Generate connection requests for teacher-1
  const connectionRequests = createConnectionRequests(teacher1, teacher1Students, zombieStudents);
  
  // Store connection requests
  storage.setItem('connections', connectionRequests);
  
  console.log('Connection requests generated:', {
    incoming: connectionRequests.filter((r) => r.id.includes('incoming')).length,
    outgoing: connectionRequests.filter((r) => r.id.includes('outgoing')).length,
    total: connectionRequests.length,
  });
}

/**
 * Clear all seed data from localStorage
 * Useful for testing/development
 */
export function clearSeedData() {
  storage.removeItem('teachers');
  storage.removeItem('students');
  storage.removeItem('trades');
  storage.removeItem('activityLogs');
  storage.removeItem('connections');
  storage.removeItem('brokerConfigs');
  storage.removeItem('stats');
  storage.removeItem('seedDataGeneratedAt');
  console.log('Seed data cleared');
}

/**
 * Regenerate seed data
 * Clears existing and generates new
 */
export function regenerateSeedData() {
  clearSeedData();
  loadSeedData();
}

