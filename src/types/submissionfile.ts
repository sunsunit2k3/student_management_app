// Submission file table
export interface SubmissionFileCreateDto {
  studentGradeId: string; 
  filePath: string;
  originalFileName?: string;
  fileSize?: number;
}

export interface SubmissionFileUpdateDto {
  id: string; 
  filePath?: string;
  originalFileName?: string;
}

export interface SubmissionFileResponseDto {
  id: string; 
  studentGradeId: string;
  filePath: string;
  originalFileName?: string | null;
  fileSize?: number | null;
  uploadDate?: string;
  createdAt?: string;
  updatedAt?: string;
}
