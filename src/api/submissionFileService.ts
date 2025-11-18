import { ApiResponse, PageResponseDto } from '../types/api';
import { SubmissionFileResponseDto, SubmissionFileUpdateDto } from '../types/submissionfile';
import apiService from './apiService';

const base = '/submission-files';

export async function uploadFile(formData: FormData): Promise<ApiResponse<SubmissionFileResponseDto>> {
	return apiService.post<SubmissionFileResponseDto>(`${base}/upload`, formData);
}

export async function getFilesByStudentGrade(studentGradeId: string): Promise<ApiResponse<SubmissionFileResponseDto[]>> {
	return apiService.get<SubmissionFileResponseDto[]>(`${base}/student-grade/${studentGradeId}`);
}

export async function getAllSubmissionFiles(
  params?: { page?: number; size?: number; role?: string; search?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }
): Promise<ApiResponse<PageResponseDto<SubmissionFileResponseDto>>> {
    return apiService.get<PageResponseDto<SubmissionFileResponseDto>>(`${base}`, { params } as any);
}

export async function updateSubmissionFile(id: string, payload: SubmissionFileUpdateDto): Promise<ApiResponse<SubmissionFileResponseDto>> {
	return apiService.put<SubmissionFileResponseDto>(`${base}/${id}`, payload);
}

export async function deleteSubmissionFile(id: string): Promise<ApiResponse<void>> {
	return apiService.delete<void>(`${base}/${id}`);
}

export default { uploadFile, getAllSubmissionFiles, getFilesByStudentGrade, updateSubmissionFile, deleteSubmissionFile };
