// Enrollment table
export interface EnrollmentCreateDto {
  userId: string; // student UUID
  courseId: string; // course UUID
}

export interface EnrollmentUpdateDto {
  id: string; 
}

export interface EnrollmentResponseDto {
  id: string; 
  userId: string;
  userName?: string;
  courseId: string;
  courseName?: string;
  createdAt?: string;
  updatedAt?: string;
}
