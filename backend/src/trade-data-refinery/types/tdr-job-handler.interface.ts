import { TdrProcessingJob } from '@prisma/client';

export const NOT_IMPLEMENTED = Symbol('NOT_IMPLEMENTED');

export interface TdrJobHandler {
  handle(job: TdrProcessingJob): Promise<void>;
}
