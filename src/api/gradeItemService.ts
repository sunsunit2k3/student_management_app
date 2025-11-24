import { ApiResponse } from '../types/api';
import {
	GradeItemCreateDto,
	GradeItemResponseDto,
	GradeItemUpdateDto,
    SubmissionStatusDto,
} from '../types/gradeitem';
import apiService from './apiService';

const base = '/grade-items';

export async function createGradeItem(payload: GradeItemCreateDto): Promise<ApiResponse<GradeItemResponseDto>> {
	return apiService.post<GradeItemResponseDto>(base, payload);
}

export async function getGradeItemsByCourse(courseId: string): Promise<ApiResponse<GradeItemResponseDto[]>> {
	return apiService.get<GradeItemResponseDto[]>(`${base}/course/${courseId}`);
}

export async function getGradeItemById(id: string): Promise<ApiResponse<GradeItemResponseDto>> {
	return apiService.get<GradeItemResponseDto>(`${base}/${id}`);
}

export async function getAllGradeItems(): Promise<ApiResponse<GradeItemResponseDto[]>> {
	return apiService.get<GradeItemResponseDto[]>(`${base}`);
}
export async function getGradeItemByStudentId(
	studentId: string
): Promise<ApiResponse<GradeItemResponseDto[]>> {
	return apiService.get<GradeItemResponseDto[]>(`${base}/student/${studentId}`);
}


export async function updateGradeItem(id: string, payload: GradeItemUpdateDto): Promise<ApiResponse<GradeItemResponseDto>> {
	return apiService.put<GradeItemResponseDto>(`${base}/${id}`, payload);
}

export async function deleteGradeItem(id: string): Promise<ApiResponse<void>> {
	return apiService.delete<void>(`${base}/${id}`);
}

export async function getSubmissionStatus(gradeItemId: string): Promise<ApiResponse<SubmissionStatusDto>> {
    return apiService.get<SubmissionStatusDto>(`${base}/${gradeItemId}/submission-status`);
}

export default { createGradeItem, getAllGradeItems, getGradeItemsByCourse, getGradeItemById, getSubmissionStatus, updateGradeItem, deleteGradeItem };
