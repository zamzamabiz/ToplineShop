import { IsOptional, IsString } from 'class-validator';

export class RefreshDto {
  /**
   * Legacy body-based refresh token.
   * In production: ignored — refresh token must come via HttpOnly cookie.
   * In development/test: accepted as fallback when no cookie is present.
   */
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
