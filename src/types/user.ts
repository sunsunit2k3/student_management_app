import { PageResponseDto } from './api';
export interface UserCreateDto {
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  username: string;
  password: string;
  roleName: string; // UUID of role
}

export interface UserUpdateDto {
  id: string; // UUID
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  username?: string | null;
  roleName?: string; 
}

export interface UserResponseDto {
  id: string; // UUID
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  username: string;
  roleName?: string | null;
  createdAt?: string;
  updatedAt?: string; 
}



export interface UserListResponse extends PageResponseDto<UserResponseDto> {}
