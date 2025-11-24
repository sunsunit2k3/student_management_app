export interface GradeItemCreateDto {
  courseId: string; 
  name: string;
  description?: string | null;
  dueDate?: string | null; 
  weight?: number;
}

export interface GradeItemUpdateDto {
  name?: string;
  description?: string | null;
  dueDate?: string | null;
  weight?: number;
}

export interface GradeItemResponseDto {
  id: string; 
  courseId: string;
  name: string;
  description?: string | null;
  dueDate?: string | null;
  weight?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubmissionStatusDto {
  gradeItemId: string;
  gradeItemName?: string | null;
  submitted?: number | null;
  notSubmitted?: number | null;
  totalStudents?: number | null;
}
