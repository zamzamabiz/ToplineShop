import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHmac, randomBytes } from 'crypto';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtPayload } from './types/jwt-payload.type';

export interface RequestMeta {
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResult extends AuthTokens {
  expiresIn: number;
  user: {
    userId: string;
    email: string;
    tenantId: string;
    roles: string[];
  };
}

@Injectable()
export class AuthService {
  private static readonly FAILURE_MSG = 'Authentication required';
  private static readonly REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
  ) {}

  async login(dto: LoginDto, meta: RequestMeta): Promise<LoginResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { memberships: { where: { status: 'ACTIVE' } } },
    });

    if (!user || !user.passwordHash || user.status !== 'ACTIVE') {
      // Constant-time guard: hash the incoming password to prevent timing-based email enumeration
      await argon2.hash(dto.password, { type: argon2.argon2id }).catch(() => {});
      await this.audit.recordEvent({
        action: 'auth.login.failure',
        entityType: 'user',
        entityId: 'unknown',
        metadata: { reason: 'invalid_credentials' },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
      throw new UnauthorizedException(AuthService.FAILURE_MSG);
    }

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) {
      await this.audit.recordEvent({
        action: 'auth.login.failure',
        entityType: 'user',
        entityId: user.id,
        metadata: { reason: 'invalid_credentials' },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
      throw new UnauthorizedException(AuthService.FAILURE_MSG);
    }

    const tenantId = dto.tenantId ?? (user as any).memberships?.[0]?.tenantId;
    if (!tenantId) {
      await this.audit.recordEvent({
        action: 'auth.login.failure',
        entityType: 'user',
        entityId: user.id,
        metadata: { reason: 'no_active_membership' },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
      throw new UnauthorizedException(AuthService.FAILURE_MSG);
    }

    const activeMembership = (user as any).memberships?.find((m: any) => m.tenantId === tenantId);
    const roles: string[] = activeMembership?.roles ?? [];

    const rawRefreshToken = randomBytes(40).toString('hex');
    const tokenHash = this.hmacRefreshToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + AuthService.REFRESH_TTL_MS);

    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        tenantId,
        tokenHash,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        expiresAt,
      },
    });

    const accessToken = this.issueAccessToken(user.id, tenantId, roles, session.id);

    await this.audit.recordEvent({
      action: 'auth.login.success',
      entityType: 'session',
      entityId: session.id,
      tenantId,
      actorUserId: user.id,
      metadata: { sessionId: session.id },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: 900,
      user: {
        userId: user.id,
        email: user.email,
        tenantId,
        roles,
      },
    };
  }

  async logout(userId: string, sessionId: string, meta: RequestMeta): Promise<{ ok: boolean }> {
    await this.prisma.session.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await this.audit.recordEvent({
      action: 'auth.logout',
      entityType: 'session',
      entityId: sessionId,
      actorUserId: userId,
      metadata: { sessionId },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return { ok: true };
  }

  async refresh(dto: RefreshDto, meta: RequestMeta): Promise<AuthTokens> {
    const tokenHash = this.hmacRefreshToken(dto.refreshToken);
    const session = await this.prisma.session.findUnique({ where: { tokenHash } });

    if (!session) {
      await this.audit.recordEvent({
        action: 'auth.refresh.failure',
        entityType: 'session',
        entityId: 'unknown',
        metadata: { reason: 'session_not_found' },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
      throw new UnauthorizedException(AuthService.FAILURE_MSG);
    }

    if (session.revokedAt !== null || session.expiresAt < new Date()) {
      // Replay detection: revoke all active sessions for this user
      await this.prisma.session.updateMany({
        where: { userId: session.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await this.audit.recordEvent({
        action: 'auth.refresh.failure',
        entityType: 'session',
        entityId: session.id,
        tenantId: session.tenantId,
        actorUserId: session.userId,
        metadata: { reason: 'replay_detected' },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
      throw new UnauthorizedException(AuthService.FAILURE_MSG);
    }

    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    const rawRefreshToken = randomBytes(40).toString('hex');
    const newTokenHash = this.hmacRefreshToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + AuthService.REFRESH_TTL_MS);

    const newSession = await this.prisma.session.create({
      data: {
        userId: session.userId,
        tenantId: session.tenantId,
        tokenHash: newTokenHash,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        expiresAt,
      },
    });

    const refreshMembership = await this.prisma.membership.findUnique({
      where: { userId_tenantId: { userId: session.userId, tenantId: session.tenantId } },
      select: { roles: true },
    });
    const refreshRoles: string[] = refreshMembership?.roles ?? [];

    const accessToken = this.issueAccessToken(session.userId, session.tenantId, refreshRoles, newSession.id);

    await this.audit.recordEvent({
      action: 'auth.refresh.success',
      entityType: 'session',
      entityId: newSession.id,
      tenantId: session.tenantId,
      actorUserId: session.userId,
      metadata: { oldSessionId: session.id, newSessionId: newSession.id },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return { accessToken, refreshToken: rawRefreshToken };
  }

  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, { type: argon2.argon2id });
  }

  hmacRefreshToken(raw: string): string {
    const secret = process.env.JWT_REFRESH_SECRET || 'CHANGE_ME_DEV_ONLY';
    return createHmac('sha256', secret).update(raw).digest('hex');
  }

  private issueAccessToken(userId: string, tenantId: string, roles: string[], sessionId: string): string {
    const payload: Partial<JwtPayload> = { sub: userId, tenantId, roles, jti: sessionId };
    return this.jwt.sign(payload);
  }
}
