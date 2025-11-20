import { UserResponseDto } from '../types';
import { ApiResponse } from '../types/api';
import { EnrollmentCreateDto, EnrollmentResponseDto, EnrollmentUpdateDto } from '../types/enrollment';
import apiService from './apiService';

const base = '/enrollments';

export async function createEnrollment(payload: EnrollmentCreateDto): Promise<ApiResponse<EnrollmentResponseDto>> {
	return apiService.post<EnrollmentResponseDto>(base, payload);
}

export async function getEnrollmentsByCourse(courseId: string): Promise<ApiResponse<UserResponseDto[]>> {
	return apiService.get<UserResponseDto[]>(`${base}/course/${courseId}`);
}

export async function getEnrollmentsByUser(userId: string): Promise<ApiResponse<EnrollmentResponseDto[]>> {
	return apiService.get<EnrollmentResponseDto[]>(`${base}/user/${userId}`);
}

export async function getAllEnrollments(): Promise<ApiResponse<EnrollmentResponseDto[]>> {
    return apiService.get<EnrollmentResponseDto[]>(`${base}`);
}

export async function updateEnrollment(id: string, payload: EnrollmentUpdateDto): Promise<ApiResponse<EnrollmentResponseDto>> {
	return apiService.put<EnrollmentResponseDto>(`${base}/${id}`, payload);
}

export async function deleteEnrollment(id: string): Promise<ApiResponse<void>> {
	return apiService.delete<void>(`${base}/${id}`);
}

export default { createEnrollment, getAllEnrollments, getEnrollmentsByCourse, getEnrollmentsByUser, updateEnrollment, deleteEnrollment };
