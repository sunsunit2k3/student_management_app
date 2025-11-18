

export interface AuthUserDto {
  id: number;
  username: string;
  email?: string | null;
  fistName?: string | null;
  lastName?: string | null;
  roleName?: string;
  createdAt?: string;
}

export interface AuthenticationResponse {
  accessToken: string;
  refreshToken: string;
  authenticated: boolean;
  user?: AuthUserDto;
}

export interface IntrospectRequest {
  token: string;
}

export interface IntrospectResponse {
  active: boolean;
  scope?: string;
  exp?: number;
  iat?: number;
  sub?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
  remember?: boolean;
}

export interface LogoutRequest {
  token: string;
}

export interface RefreshRequest {
  token: string;
}

export interface RefreshResponse {
  token: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
}

export interface UpdateProfileRequest {
  // First name (required, 1-50 chars)
  firstName: string;
  // Last name (required, 1-50 chars)
  lastName: string;
  // Email (optional but validated as email, max 100 chars)
  email?: string | null;
  // Username (required, 3-50 chars)
  username: string;
  // Password (optional; if provided will be encoded)
  password?: string | null;
}
