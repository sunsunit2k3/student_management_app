import { PageResponseDto } from './api';
export interface UserCreateDto {
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  username: string;
  password: string;
  roleName: string; 
}

export interface UserUpdateDto {
  id: string; 
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  username?: string | null;
  roleName?: string; 
}

export interface UserResponseDto {
  id: string; 
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  username: string;
  roleName?: string | null;
  createdAt?: string;
  updatedAt?: string; 
}



export interface UserListResponse extends PageResponseDto<UserResponseDto> {}
