// Student grade table
export interface StudentGradeCreateDto {
  enrollmentId: string; 
  gradeItemId: string;
  score?: number | null;
  isSubmitted?: boolean;
  submissionDate?: string | null;
}

export interface StudentGradeUpdateDto {
  id: string; 
  score?: number | null;
  isSubmitted?: boolean;
  feedback?: string | null;
}

export interface StudentGradeResponseDto {
  id: string; 
  enrollmentId: string;
  gradeItemId: string;
  score?: number | null;
  isAutoZero?: boolean;
  isSubmitted?: boolean;
  submissionDate?: string | null;
  feedback?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
