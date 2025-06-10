export interface ProcessedRecord {
  [key: string]: any;
  fromDate?: Date | string;
  toDate?: Date | string;
  category?: string;
  subcategory?: string;
  lineItemName?: string;
  accountId?: string;
  amount?: number;
  originalId?: string;
  metadata?: Record<string, any>;
  lineItems?: ProcessedRecord[];
}

export interface FinancialDataDTO {
  companyId: number;
  sourceId: number;
  sourceName: string;
  fromDate: Date;
  toDate: Date;
  category: string;
  subcategory?: string;
  lineItemName?: string;
  accountId?: string;
  amount: number;
  originalId?: string;
  metadata?: Record<string, any>;
}
