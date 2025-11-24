import { ApiResponse, PageResponseDto } from '../types/api';
import { StudentGradeCreateDto, StudentGradeResponseDto, StudentGradeUpdateDto } from '../types/studentgrade';
import apiService from './apiService';

const base = '/student-grades';

export async function createStudentGrade(payload: StudentGradeCreateDto): Promise<ApiResponse<StudentGradeResponseDto>> {
	return apiService.post<StudentGradeResponseDto>(base, payload);
}

export async function getGradesByEnrollment(enrollmentId: string): Promise<ApiResponse<StudentGradeResponseDto[]>> {
	return apiService.get<StudentGradeResponseDto[]>(`${base}/enrollment/${enrollmentId}`);
}

export async function getStudentGradesByStudentId(studentId: string): Promise<ApiResponse<StudentGradeResponseDto[]>> {
	return apiService.get<StudentGradeResponseDto[]>(`${base}/student/${studentId}`);
}

export async function getStudentGradesByGradeItemId(gradeItemId: string): Promise<ApiResponse<StudentGradeResponseDto[]>> {
	return apiService.get<StudentGradeResponseDto[]>(`${base}/grade-item/${gradeItemId}`);
}


export async function getAllGrades(
	params?: { page?: number; size?: number })
	: Promise<ApiResponse<PageResponseDto<StudentGradeResponseDto>>> {
	return apiService.get<PageResponseDto<StudentGradeResponseDto>>(base, { params } as any);
}
export async function updateStudentGrade(id: string, payload: StudentGradeUpdateDto): Promise<ApiResponse<StudentGradeResponseDto>> {
	return apiService.put<StudentGradeResponseDto>(`${base}/${id}`, payload);
}

export async function deleteStudentGrade(id: string): Promise<ApiResponse<void>> {
	return apiService.delete<void>(`${base}/${id}`);
}

export default { createStudentGrade, getAllGrades, getGradesByEnrollment, updateStudentGrade, deleteStudentGrade };
