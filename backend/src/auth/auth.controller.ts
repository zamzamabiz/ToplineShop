import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { AuthService, RequestMeta } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { Public } from './decorators/public.decorator';
import { AuthenticatedUser } from './types/jwt-payload.type';
import { success } from '../common/api-response';

/** Cookie name for the HttpOnly refresh token. */
export const REFRESH_COOKIE_NAME = 'tdr_refresh';

/** 30-day TTL in milliseconds — must match AuthService.REFRESH_TTL_MS. */
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function extractMeta(req: Request): RequestMeta {
  return {
    ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket?.remoteAddress,
    userAgent: req.headers['user-agent'],
  };
}

/** Parse a single cookie value from the Cookie header without a middleware dependency. */
function parseCookieHeader(req: Request, name: string): string | null {
  const header = (req.headers['cookie'] as string | undefined) ?? '';
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = header.match(new RegExp(`(?:^|;\\s*)${escaped}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setRefreshCookie(res: Response, token: string): void {
  const cookieSecure =
    process.env['NODE_ENV'] === 'production' || process.env['COOKIE_SECURE'] === 'true';
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: cookieSecure,
    sameSite: 'strict',
    path: '/auth',
    maxAge: REFRESH_TTL_MS,
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/auth' });
}

@UseGuards(ThrottlerGuard)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto, extractMeta(req));
    setRefreshCookie(res, result.refreshToken);
    return success(result);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  async refresh(
    @Body() dto: RefreshDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const isProduction = process.env['NODE_ENV'] === 'production';

    // Cookie is the authoritative source for refresh token.
    // In development/test, fall back to body token if cookie is absent.
    const cookieToken = parseCookieHeader(req, REFRESH_COOKIE_NAME);
    const token = cookieToken ?? (isProduction ? null : (dto.refreshToken ?? null));

    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }

    const result = await this.authService.refresh({ refreshToken: token }, extractMeta(req));
    setRefreshCookie(res, result.refreshToken);
    return success(result);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = (req as any).user as AuthenticatedUser;
    clearRefreshCookie(res);
    return success(await this.authService.logout(user.userId, user.sessionId, extractMeta(req)));
  }
}
