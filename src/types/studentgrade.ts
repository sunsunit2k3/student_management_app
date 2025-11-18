// Student grade table
export interface StudentGradeCreateDto {
  enrollmentId: string; // UUID
  gradeItemId: string; // UUID
  score?: number | null;
  isSubmitted?: boolean;
  submissionDate?: string | null;
}

export interface StudentGradeUpdateDto {
  id: string; // UUID
  score?: number | null;
  isSubmitted?: boolean;
  feedback?: string | null;
}

export interface StudentGradeResponseDto {
  id: string; // UUID
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
