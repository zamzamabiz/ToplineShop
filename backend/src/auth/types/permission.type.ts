export const Permission = {
  CREATE_TENANT: 'create:tenant',
  CREATE_VENDOR: 'create:vendor',
  CREATE_CATEGORY: 'create:category',
  CREATE_PRODUCT: 'create:product',
  READ_ANALYTICS: 'read:analytics',
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];
