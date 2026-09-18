import { SetMetadata } from '@nestjs/common';

export const REQUIRES_TENANT_CONTEXT_KEY = 'requiresTenantContext';
export const RequiresTenantContext = () =>
  SetMetadata(REQUIRES_TENANT_CONTEXT_KEY, true);
