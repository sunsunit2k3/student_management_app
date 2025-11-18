// Course table
export interface CourseCreateDto {
  code: string;
  name?: string | null;
  userId?: string | null; // teacher/owner id (UUID)
}

export interface CourseUpdateDto {
  id: string; // UUID
  code?: string;
  name?: string;
  userId?: string | null;
}

export interface CourseResponseDto {
  id: string; // UUID
  code: string;
  name?: string | null;
  teacherName?: string | null;
  teacherId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
