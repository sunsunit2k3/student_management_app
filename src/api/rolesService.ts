import { ApiResponse, PageResponseDto } from '../types/api';
import { RoleCreateDto, RoleResponseDto, RoleUpdateDto } from '../types/role';
import apiService from './apiService';

const base = '/roles';

export async function createRole(payload: RoleCreateDto): Promise<ApiResponse<RoleResponseDto>> {
  return apiService.post<RoleResponseDto>(base, payload);
}

export async function getRoles(
  params?: { page?: number; size?: number}
): Promise<ApiResponse<PageResponseDto<RoleResponseDto>>> {
  return apiService.get<PageResponseDto<RoleResponseDto>>(base, { params } as any);
}

export async function getRoleById(id: string): Promise<ApiResponse<RoleResponseDto>> {
  return apiService.get<RoleResponseDto>(`${base}/${id}`);
}

export async function getRoleByName(name: string): Promise<ApiResponse<RoleResponseDto>> {
  return apiService.get<RoleResponseDto>(`${base}/name/${name}`);
}

export async function updateRole(id: string, payload: RoleUpdateDto): Promise<ApiResponse<RoleResponseDto>> {
  return apiService.put<RoleResponseDto>(`${base}/${id}`, payload);
}

export async function deleteRole(id: string): Promise<ApiResponse<void>> {
  return apiService.delete<void>(`${base}/${id}`);
}

export default {
  createRole,
  getRoles,
  getRoleById,
  getRoleByName,
  updateRole,
  deleteRole,
};
