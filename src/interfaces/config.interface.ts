export interface CompanyConfig {
  sourceType: string;
  apiEndpoint: string;
  apiKey?: string;
  apiSecret?: string;
  fieldMappings: FieldMappings;
  additionalConfig?: {
    queryParams?: Record<string, string>;
    [key: string]: any;
  };
}

export interface FieldMappings {
  recordsPath?: string;
  fields: Record<string, string | FieldMapping>;
  lineItemsMapping?: {
    recordsPath: string;
    fields: Record<string, string | FieldMapping>;
  };
  includeOriginal?: boolean;
}

export interface FieldMapping {
  sourcePath: string;
  transform?: string | Function;
  default?: any;
}
