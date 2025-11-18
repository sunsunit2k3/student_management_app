import {
  ApiResponse,
  LoginRequest,
  AuthenticationResponse,
  RefreshRequest,
  RefreshResponse,
  LogoutRequest,
  RegisterRequest,
  UpdateProfileRequest,
} from '../types';
import apiService from './apiService';


export async function login(credentials: LoginRequest): Promise<ApiResponse<AuthenticationResponse>> {
  return apiService.post<AuthenticationResponse>('/auth/login', credentials);
}

export async function register(payload: RegisterRequest): Promise<ApiResponse<AuthenticationResponse>> {
  return apiService.post<AuthenticationResponse>('/auth/register', payload);
}

export async function logout(data?: LogoutRequest): Promise<ApiResponse<void>> {
  return apiService.post<void>('/auth/logout', data);
}

export async function refreshToken(
  data: RefreshRequest
): Promise<ApiResponse<RefreshResponse>> {
  return apiService.post<RefreshResponse>('/auth/refresh', data);
}

export async function getCurrentUser(): Promise<ApiResponse<AuthenticationResponse['user']>> {
  return apiService.get('/auth/me');
}

export async function updateMe(payload: UpdateProfileRequest): Promise<ApiResponse<AuthenticationResponse['user']>> {
  return apiService.put('/auth/me', payload);
}
