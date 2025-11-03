import { storage } from '@/lib/storage';
import { AuthData, OTPVerifyData } from '@/types';

/**
 * Authentication Service for SyncKaro Teacher
 * Handles mobile + OTP authentication with localStorage
 */

// Dummy teacher credentials (for development/testing)
const DUMMY_TEACHER = {
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
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const { mobile, otp } = data;

  // Check dummy teacher credentials (for development/testing)
  if (mobile === DUMMY_TEACHER.mobile && otp === DUMMY_TEACHER.otp) {
    const authData: AuthData = {
      user: DUMMY_TEACHER.user,
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

