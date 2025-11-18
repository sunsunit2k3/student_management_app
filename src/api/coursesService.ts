import { ApiResponse, PageResponseDto } from '../types/api';
import { CourseCreateDto, CourseResponseDto, CourseUpdateDto } from '../types/course';
import apiService from './apiService';

const base = '/courses';

export async function createCourse(payload: CourseCreateDto): Promise<ApiResponse<CourseResponseDto>> {
	return apiService.post<CourseResponseDto>(base, payload);
}

export async function getCourses(
  params?: { page?: number; size?: number}
): Promise<ApiResponse<PageResponseDto<CourseResponseDto>>> {
	return apiService.get<PageResponseDto<CourseResponseDto>>(base, { params } as any);
}

export async function getCourseById(id: string): Promise<ApiResponse<CourseResponseDto>> {
	return apiService.get<CourseResponseDto>(`${base}/${id}`);
}

export async function updateCourse(id: string, payload: CourseUpdateDto): Promise<ApiResponse<CourseResponseDto>> {
	return apiService.put<CourseResponseDto>(`${base}/${id}`, payload);
}

export async function deleteCourse(id: string): Promise<ApiResponse<void>> {
	return apiService.delete<void>(`${base}/${id}`);
}

export default { createCourse, getCourses, getCourseById, updateCourse, deleteCourse };
