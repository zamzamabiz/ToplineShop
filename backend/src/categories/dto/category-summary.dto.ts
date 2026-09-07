export interface CategorySummaryDto {
  id: string;
  tenantId: string;
  parentId: string | null;
  name: string;
  status: string;
  sortOrder: number;
  createdAt: Date;
}
