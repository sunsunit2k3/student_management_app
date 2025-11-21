export interface GradeItemCreateDto {
  courseId: string; 
  name: string;
  description?: string | null;
  dueDate?: string | null; 
  weight?: number;
}

export interface GradeItemUpdateDto {
  id: string; 
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
