// Enrollment table
export interface EnrollmentCreateDto {
  userId: string; // student UUID
  courseId: string; // course UUID
}

export interface EnrollmentUpdateDto {
  id: string; // UUID
}

export interface EnrollmentResponseDto {
  id: string; // UUID
  userId: string;
  userName?: string;
  courseId: string;
  courseName?: string;
  createdAt?: string;
  updatedAt?: string;
}
