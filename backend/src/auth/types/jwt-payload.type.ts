export interface JwtPayload {
  sub: string;
  tenantId: string;
  roles: string[];
  jti: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  userId: string;
  tenantId: string;
  roles: string[];
  sessionId: string;
}
