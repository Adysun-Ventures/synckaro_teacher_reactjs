import { storage } from '@/lib/storage';
import { AuthData, OTPVerifyData } from '@/types';
import apiClient from '@/lib/api';

/**
 * Authentication Service for SyncKaro Teacher
 * Handles mobile + OTP authentication with API integration
 * 
 * API Endpoints:
 * - POST /common/login - Send OTP to mobile (role: teacher)
 * - POST /common/verify - Verify OTP and get access token
 */

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
  // Validate mobile number
  if (!isValidMobile(mobile)) {
    return {
      success: false,
      error: 'Please enter a valid 10-digit mobile number',
    };
  }

  try {
    // Call the login API endpoint
    const response = await apiClient.post<{ message: string; otp: string }>(
      '/common/login',
      {
        mobile,
        role: 'teacher',
      },
      {
        skipAuth: true, // Skip auth token for login endpoint
      }
    );

    // API returns { message: string, otp: string }
    if (response.data && response.data.message) {
      return { success: true };
    }

    return {
      success: false,
      error: 'Failed to send OTP. Please try again.',
    };
  } catch (error: any) {
    // Handle API errors (transformed by axios interceptor)
    // Error can be ApiErrorResponse from interceptor or raw axios error
    const errorMessage =
      error?.error || error?.message || 'Failed to send OTP. Please try again.';
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Verify OTP for given mobile number
 * @param data - Mobile and OTP
 * @returns Promise with auth data or error
 */
export async function verifyOTP(data: OTPVerifyData): Promise<{ success: boolean; error?: string; data?: AuthData }> {
  const { mobile, otp } = data;

  try {
    // Call the verify API endpoint
    const response = await apiClient.post<{
      access_token: string;
      token_type: string;
      id: number;
      role: string;
    }>(
      '/common/verify',
      {
        mobile,
        otp,
      },
      {
        skipAuth: true, // Skip auth token for verify endpoint
      }
    );

    // Map API response to AuthData structure
    const apiResponse = response.data;
    
    if (apiResponse && apiResponse.access_token) {
      const authData: AuthData = {
        user: {
          id: String(apiResponse.id),
          name: mobile, // Use mobile as name fallback (can be updated from profile later)
          mobile: mobile,
          role: apiResponse.role as 'admin' | 'teacher' | 'student',
        },
        token: apiResponse.access_token,
        isAuthenticated: true,
      };

      // Store in localStorage
      storage.setAuth(authData);

      return {
        success: true,
        data: authData,
      };
    }

    return {
      success: false,
      error: 'Invalid response from server. Please try again.',
    };
  } catch (error: any) {
    // Handle API errors (transformed by axios interceptor)
    // Error can be ApiErrorResponse from interceptor or raw axios error
    const errorMessage =
      error?.error || error?.message || 'Invalid OTP. Please try again.';
    
    return {
      success: false,
      error: errorMessage,
    };
  }
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

