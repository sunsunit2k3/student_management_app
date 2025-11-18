// Grade item table
export interface GradeItemCreateDto {
  courseId: string; // UUID
  name: string;
  description?: string | null;
  dueDate?: string | null; // ISO datetime
  weight?: number; // decimal
}

export interface GradeItemUpdateDto {
  id: string; // UUID
  name?: string;
  description?: string | null;
  dueDate?: string | null;
  weight?: number;
}

export interface GradeItemResponseDto {
  id: string; // UUID
  courseId: string;
  name: string;
  description?: string | null;
  dueDate?: string | null;
  weight?: number;
  createdAt?: string;
  updatedAt?: string;
}
