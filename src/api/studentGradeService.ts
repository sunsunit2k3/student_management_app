import { ApiResponse } from '../types/api';
import { StudentGradeCreateDto, StudentGradeResponseDto, StudentGradeUpdateDto } from '../types/studentgrade';
import apiService from './apiService';

const base = '/student-grades';

export async function createStudentGrade(payload: StudentGradeCreateDto): Promise<ApiResponse<StudentGradeResponseDto>> {
	return apiService.post<StudentGradeResponseDto>(base, payload);
}

export async function getGradesByEnrollment(enrollmentId: string): Promise<ApiResponse<StudentGradeResponseDto[]>> {
	return apiService.get<StudentGradeResponseDto[]>(`${base}/enrollment/${enrollmentId}`);
}

export async function updateStudentGrade(id: string, payload: StudentGradeUpdateDto): Promise<ApiResponse<StudentGradeResponseDto>> {
	return apiService.put<StudentGradeResponseDto>(`${base}/${id}`, payload);
}

export async function deleteStudentGrade(id: string): Promise<ApiResponse<void>> {
	return apiService.delete<void>(`${base}/${id}`);
}

export default { createStudentGrade, getGradesByEnrollment, updateStudentGrade, deleteStudentGrade };
