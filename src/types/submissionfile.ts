// Submission file table
export interface SubmissionFileCreateDto {
  studentGradeId: string; // UUID
  filePath: string;
  originalFileName?: string;
  fileSize?: number;
}

export interface SubmissionFileUpdateDto {
  id: string; // UUID
  filePath?: string;
  originalFileName?: string;
}

export interface SubmissionFileResponseDto {
  id: string; // UUID
  studentGradeId: string;
  filePath: string;
  originalFileName?: string | null;
  fileSize?: number | null;
  uploadDate?: string;
  createdAt?: string;
  updatedAt?: string;
}
