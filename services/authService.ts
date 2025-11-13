import { storage } from '@/lib/storage';
import { AuthData, OTPVerifyData } from '@/types';
// import apiClient from '@/lib/api'; // TODO: Uncomment when integrating with API

/**
 * Authentication Service for SyncKaro Teacher
 * Handles mobile + OTP authentication with localStorage
 * 
 * TODO: API Integration
 * - Replace dummy login with API call to /common/login
 * - Replace dummy verify with API call to /common/verify
 * - Update sendOTP, verifyOTP, and resendOTP functions
 */

// Dummy teacher credentials (for development/testing)
const DUMMY_TEACHER = {
  mobile: '9999999999',
  otp: '1234',
  user: {
    id: 'teacher-1',
    name: 'Teacher',
    mobile: '9999999999',
    role: 'teacher' as const,
    email: 'teacher@synckaro.com',
  },
};

// Fallback credentials (legacy support)
const FALLBACK_TEACHER = {
  mobile: '8888888888',
  otp: '1234',
  user: {
    id: 'teacher-1',
    name: 'Teacher',
    mobile: '8888888888',
    role: 'teacher' as const,
    email: 'teacher@synckaro.com',
  },
};

/**
 * Validate Indian mobile number (10 digits)
 */
function isValidMobile(mobile: string): boolean {
  const mobileRegex = /^[6-9]\d{9}$/;
  return mobileRegex.test(mobile);
}

/**
 * Send OTP to mobile number
 * @param mobile - 10-digit Indian mobile number
 * @returns Promise with success status
 */
export async function sendOTP(mobile: string): Promise<{ success: boolean; error?: string }> {
  // TODO: API Integration - Replace with actual API call
  // const response = await apiClient.post<{ message: string; otp: string }>(
  //   '/common/login',
  //   {
  //     mobile,
  //     role: 'teacher',
  //   },
  //   {
  //     skipAuth: true, // Skip auth token for login endpoint
  //   }
  // );
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Validate mobile number
  if (!isValidMobile(mobile)) {
    return {
      success: false,
      error: 'Please enter a valid 10-digit mobile number',
    };
  }

  // In production, this would call the backend API
  // For now, we just return success for any valid mobile
  return { success: true };
}

/**
 * Verify OTP for given mobile number
 * @param data - Mobile and OTP
 * @returns Promise with auth data or error
 */
export async function verifyOTP(data: OTPVerifyData): Promise<{ success: boolean; error?: string; data?: AuthData }> {
  // TODO: API Integration - Replace with actual API call
  // const response = await apiClient.post<{
  //   access_token: string;
  //   token_type: string;
  //   id: number;
  //   role: string;
  // }>(
  //   '/common/verify',
  //   {
  //     mobile: data.mobile,
  //     otp: data.otp,
  //   },
  //   {
  //     skipAuth: true, // Skip auth token for verify endpoint
  //   }
  // );
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const { mobile, otp } = data;

  // Check dummy teacher credentials (for development/testing)
  if (mobile === DUMMY_TEACHER.mobile && otp === DUMMY_TEACHER.otp) {
    // Try to get teacher from seed data for accurate info
    const teachers = storage.getItem('teachers') || [];
    const seedTeacher = teachers.find((t: any) => t.id === 'teacher-1');
    
    const authData: AuthData = {
      user: seedTeacher ? {
        id: seedTeacher.id,
        name: seedTeacher.name,
        mobile: seedTeacher.mobile,
        role: 'teacher' as const,
        email: seedTeacher.email,
      } : DUMMY_TEACHER.user,
      token: `dummy-token-${Date.now()}`,
      isAuthenticated: true,
    };

    // Store in localStorage
    storage.setAuth(authData);

    return {
      success: true,
      data: authData,
    };
  }

  // Check fallback credentials (legacy support)
  if (mobile === FALLBACK_TEACHER.mobile && otp === FALLBACK_TEACHER.otp) {
    const authData: AuthData = {
      user: FALLBACK_TEACHER.user,
      token: `dummy-token-${Date.now()}`,
      isAuthenticated: true,
    };

    storage.setAuth(authData);

    return {
      success: true,
      data: authData,
    };
  }

  // In production, this would verify with backend for any valid teacher credentials
  // For now, we accept any valid mobile/OTP combination as teacher (for development)

  // In production, this would verify with backend
  // For now, reject any other credentials
  return {
    success: false,
    error: 'Invalid OTP. Please try again.',
  };
}

/**
 * Resend OTP to mobile number
 * @param mobile - 10-digit Indian mobile number
 * @returns Promise with success status
 */
export async function resendOTP(mobile: string): Promise<{ success: boolean; error?: string }> {
  // Reuse sendOTP logic
  return sendOTP(mobile);
}

/**
 * Logout current user
 */
export function logout(): void {
  storage.clearAuth();
}

/**
 * Check if user is authenticated
 * @returns boolean indicating auth status
 */
export function isAuthenticated(): boolean {
  const auth = storage.getAuth();
  return auth?.isAuthenticated || false;
}

/**
 * Get current authenticated user
 * @returns User object or null
 */
export function getCurrentUser() {
  const auth = storage.getAuth();
  return auth?.user || null;
}

