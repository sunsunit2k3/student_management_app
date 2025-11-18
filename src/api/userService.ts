import { ApiResponse } from '../types/api';
import { UserCreateDto, UserResponseDto, UserUpdateDto, UserListResponse } from '../types/user';
import apiService from './apiService';

const base = '/users';

export async function createUser(payload: UserCreateDto): Promise<ApiResponse<UserResponseDto>> {
  return apiService.post<UserResponseDto>(base, payload);
}


export async function getAllUsers(
  params?: { page?: number; size?: number; role?: string; search?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }
): Promise<ApiResponse<UserListResponse>> {
  return await apiService.get<UserListResponse>(base, { params } as any);
}

export async function getUserById(id: string): Promise<ApiResponse<UserResponseDto>> {
  return apiService.get<UserResponseDto>(`${base}/${id}`);
}

export async function updateUser(id: string, payload: UserUpdateDto): Promise<ApiResponse<UserResponseDto>> {
  return apiService.put<UserResponseDto>(`${base}/${id}`, payload);
}

export async function deleteUser(id: string): Promise<ApiResponse<void>> {
  return apiService.delete<void>(`${base}/${id}`);
}

export default { createUser, getAllUsers, getUserById, updateUser, deleteUser };
