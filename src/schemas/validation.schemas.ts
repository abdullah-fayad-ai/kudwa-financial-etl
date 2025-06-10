import { z } from "zod";

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().refine((val) => !isNaN(parseInt(val)), {
      message: "ID must be a valid number",
    }),
  }),
});

export const companyIdParamSchema = z.object({
  params: z.object({
    companyId: z.string().refine((val) => !isNaN(parseInt(val)), {
      message: "Company ID must be a valid number",
    }),
  }),
});

export const sourceIdParamSchema = z.object({
  params: z.object({
    sourceId: z.string().refine((val) => !isNaN(parseInt(val)), {
      message: "Source ID must be a valid number",
    }),
  }),
});

export const createCompanySchema = z.object({
  body: z.object({
    name: z.string().min(1, "Company name is required"),
  }),
});

export const updateCompanySchema = createCompanySchema;

export const createCompanyConfigSchema = z.object({
  params: z.object({
    id: z.string().refine((val) => !isNaN(parseInt(val)), {
      message: "Company ID must be a valid number",
    }),
  }),
  body: z.object({
    name: z.string().min(1, "Data source name is required"),
    sourceType: z.string().min(1, "Source type is required"),
    apiEndpoint: z.string().min(1, "API endpoint is required"),
  }),
});

export const financialDataQuerySchema = z.object({
  params: z.object({
    companyId: z.string().refine((val) => !isNaN(parseInt(val)), {
      message: "Company ID must be a valid number",
    }),
  }),
  query: z.object({
    startDate: z
      .string()
      .optional()
      .refine((val) => !val || !isNaN(Date.parse(val)), {
        message: "Start date must be a valid date",
      }),
    endDate: z
      .string()
      .optional()
      .refine((val) => !val || !isNaN(Date.parse(val)), {
        message: "End date must be a valid date",
      }),
    category: z.string().optional(),
    sourceId: z
      .string()
      .optional()
      .refine((val) => !val || !isNaN(parseInt(val)), {
        message: "Source ID must be a valid number",
      }),
    sourceName: z.string().optional(),
    page: z
      .string()
      .optional()
      .refine((val) => !val || !isNaN(parseInt(val)), {
        message: "Page must be a valid number",
      }),
    limit: z
      .string()
      .optional()
      .refine((val) => !val || !isNaN(parseInt(val)), {
        message: "Limit must be a valid number",
      }),
  }),
});
