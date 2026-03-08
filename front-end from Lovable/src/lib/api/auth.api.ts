import { apiClient } from "@/lib/api/client";

export interface ApiSuccessResponse<T> {
  status: "success";
  statusCode: number;
  message: string;
  data: T;
  metadata?: {
    timestamp?: string;
    [key: string]: unknown;
  };
}

export interface AuthUser {
  id: number;
  email: string;
  role?: number | string;
  role_id?: number | string;
  roleId?: number | string;
  role_name?: string;
  roleName?: string;
  is_email_verified?: boolean;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other";
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponseData {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface VerifyEmailResponseData {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface RefreshTokenResponseData {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
}

export interface VerifyOtpResponseData {
  reset_token: string;
}

export interface ResetPasswordPayload {
  resetToken: string;
  newPassword: string;
}

export interface ResendOtpPayload {
  email: string;
}

export interface ResendVerificationPayload {
  email: string;
}

export interface GenericMessageData {
  message: string;
}

export const authApi = {
  register(payload: RegisterPayload) {
    return apiClient.post<ApiSuccessResponse<GenericMessageData>>("/auth/register", payload);
  },

  verifyEmail(token: string) {
    const query = encodeURIComponent(token);
    return apiClient.get<ApiSuccessResponse<VerifyEmailResponseData>>(
      `/auth/verify-email?token=${query}`,
    );
  },

  login(payload: LoginPayload) {
    return apiClient.post<ApiSuccessResponse<LoginResponseData>>("/auth/login", payload);
  },

  refreshToken(accessToken: string, refreshToken: string) {
    return apiClient.post<ApiSuccessResponse<RefreshTokenResponseData>>(
      "/auth/refresh-token",
      { refreshToken },
      { accessToken, retryOn401: false },
    );
  },

  logout(accessToken: string, refreshToken: string) {
    return apiClient.post<ApiSuccessResponse<GenericMessageData>>(
      "/auth/logout",
      { refreshToken },
      { accessToken, retryOn401: false },
    );
  },

  forgotPassword(payload: ForgotPasswordPayload) {
    return apiClient.post<ApiSuccessResponse<GenericMessageData>>(
      "/auth/forgot-password",
      payload,
    );
  },

  verifyOtp(payload: VerifyOtpPayload) {
    return apiClient.post<ApiSuccessResponse<VerifyOtpResponseData>>(
      "/auth/verify-otp",
      payload,
    );
  },

  resetPassword(payload: ResetPasswordPayload) {
    return apiClient.post<ApiSuccessResponse<GenericMessageData>>(
      "/auth/reset-password",
      { new_password: payload.newPassword },
      { accessToken: payload.resetToken },
    );
  },

  resendOtp(payload: ResendOtpPayload) {
    return apiClient.post<ApiSuccessResponse<GenericMessageData>>("/auth/resend-otp", payload);
  },

  resendVerification(payload: ResendVerificationPayload) {
    return apiClient.post<ApiSuccessResponse<GenericMessageData>>(
      "/auth/resend-verification",
      payload,
    );
  },
};
