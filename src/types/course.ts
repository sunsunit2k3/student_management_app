// Course table
export interface CourseCreateDto {
  code: string;
  name?: string | null;
  userId?: string | null; // teacher/owner id (UUID)
}

export interface CourseUpdateDto {
  code?: string;
  name?: string;
  userId?: string | null;
}

export interface CourseResponseDto {
  id: string; 
  code: string;
  name?: string | null;
  teacherName?: string ;
  teacherId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
