// Role table
export interface RoleCreateDto {
  name: string;
}

export interface RoleUpdateDto {
  id: number;
  name?: string;
}

export interface Role {
  id: number;
  name: string;
  createdAt?: string;
  updatedAt?: string; 
}

export interface RoleResponseDto extends Role {}
