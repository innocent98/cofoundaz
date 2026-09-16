import { apiClient } from './client';

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}

export interface VerifyTokenPayload {
  token: string;
}

export interface ResendVerificationPayload {
  email: string;
}

export const authApi = {
  forgotPassword: (data: ForgotPasswordPayload) =>
    apiClient<{ message?: string }>('/auth/password/forgot', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  resetPassword: (data: ResetPasswordPayload) =>
    apiClient<{ message?: string }>('/auth/password/reset', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  verifyEmail: (data: VerifyTokenPayload) =>
    apiClient<{ message?: string; user?: any }>('/auth/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  resendVerification: (data: ResendVerificationPayload) =>
    apiClient<{ message?: string }>('/auth/verify/resend', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};