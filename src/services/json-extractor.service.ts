import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as crypto from "crypto";
import { FinancialDataDTO } from "../interfaces/data.interface";
import logger from "../utils/logger.util";

interface ColumnMetadata {
  Name: string;
  Value: string;
}

interface TimeColumn {
  ColTitle: string;
  ColType: string;
  MetaData: ColumnMetadata[];
}

export class JsonExtractorService {
  private prisma: PrismaClient;
  private BATCH_SIZE = 100;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async extractCompany1Data(
    filePathOrData: string | any,
    companyId: number,
    sourceId: number,
    sourceName: string
  ): Promise<number> {
    try {
      const isFilePath =
        typeof filePathOrData === "string" &&
        !filePathOrData.startsWith("API:");

      if (isFilePath) {
        logger.info(`Processing Company 1 format JSON file: ${filePathOrData}`);
      } else {
        logger.info(`Processing Company 1 format JSON data from API`);
      }

      const jsonData = isFilePath
        ? JSON.parse(fs.readFileSync(filePathOrData as string, "utf-8"))
        : filePathOrData;

      if (
        !jsonData.data ||
        !jsonData.data.Header ||
        !jsonData.data.Columns ||
        !jsonData.data.Rows
      ) {
        throw new Error("Invalid JSON structure for Company 1 format");
      }

      const header = jsonData.data.Header;
      const reportInfo = {
        reportName: header.ReportName,
        reportBasis: header.ReportBasis,
        currency: header.Currency,
        accountingStandard: header.Option?.find(
          (opt: any) => opt.Name === "AccountingStandard"
        )?.Value,
      };

      const timeColumns = jsonData.data.Columns.Column.filter(
        (col: TimeColumn) => col.ColType === "Money"
      );

      const records: FinancialDataDTO[] = [];
      await this.processRows(
        jsonData.data.Rows.Row,
        records,
        timeColumns,
        companyId,
        sourceId,
        sourceName,
        reportInfo,
        undefined,
        0,
        []
      );

      return this.processRecords(records);
    } catch (error: unknown) {
      this.logError("Company 1", error, {
        companyId,
        sourceId,
        filePathOrData,
      });
      throw error;
    }
  }

  async extractCompany2Data(
    filePathOrData: string | any,
    companyId: number,
    sourceId: number,
    sourceName: string
  ): Promise<number> {
    try {
      logger.info(`Processing Company 2 format JSON data from API`);

      const jsonData = filePathOrData;

      if (!jsonData.data || !Array.isArray(jsonData.data)) {
        throw new Error("Invalid JSON structure for Company 2 format");
      }

      const records: FinancialDataDTO[] = [];

      for (const monthData of jsonData.data) {
        const periodStart = new Date(monthData.period_start);
        const periodEnd = new Date(monthData.period_end);
        const metadata = {
          platform_id: monthData.platform_id,
          platform_unique_id: monthData.platform_unique_id,
          currency_id: monthData.currency_id,
        };

        const sections = Object.keys(monthData).filter(
          (key) =>
            Array.isArray(monthData[key]) &&
            monthData[key][0]?.name !== undefined &&
            monthData[key][0]?.value !== undefined
        );

        for (const section of sections) {
          const sectionData = monthData[section];
          if (!Array.isArray(sectionData)) continue;

          const sectionCategory = this.formatCategoryName(section);

          for (const category of sectionData) {
            if (!category?.name) continue;

            if (category.value !== 0) {
              records.push({
                sourceId,
                companyId,
                sourceName,
                toDate: periodEnd,
                fromDate: periodStart,
                amount: category.value,
                category: sectionCategory,
                subcategory: category.name,
                lineItemName: category.name,
                metadata: {
                  type: "category",
                  ...metadata,
                },
              });
            }

            // Process line items if they exist
            if (Array.isArray(category.line_items)) {
              for (const lineItem of category.line_items) {
                if (lineItem.value === 0) continue;

                records.push({
                  sourceId,
                  companyId,
                  sourceName,
                  toDate: periodEnd,
                  fromDate: periodStart,
                  amount: lineItem.value,
                  category: sectionCategory,
                  subcategory: category.name,
                  lineItemName: lineItem.name,
                  accountId: lineItem.account_id,
                  metadata: {
                    type: "line_item",
                    ...metadata,
                  },
                });
              }
            }
          }
        }
      }

      return this.processRecords(records);
    } catch (error: unknown) {
      this.logError("Company 2", error, {
        companyId,
        sourceId,
        filePathOrData,
      });
      throw error;
    }
  }

  private async processRecords(records: FinancialDataDTO[]): Promise<number> {
    const filteredRecords = records.filter((record) => record.amount !== 0);

    if (filteredRecords.length === 0) {
      logger.info("No valid records found to process");
      return 0;
    }

    const recordsWithIds = filteredRecords.map((record) => ({
      ...record,
      originalId: this.generateRecordFingerprint(record),
    }));

    const insertedCount = await this.bulkInsertRecordsWithDuplicateHandling(
      recordsWithIds
    );

    logger.info(`Successfully processed ${insertedCount} records`);
    return insertedCount;
  }

  private generateRecordFingerprint(record: FinancialDataDTO): string {
    const fingerprintData = {
      amount: record.amount,
      category: record.category,
      sourceId: record.sourceId,
      companyId: record.companyId,
      accountId: record.accountId,
      subcategory: record.subcategory,
      lineItemName: record.lineItemName,
      fromDate:
        record.fromDate instanceof Date
          ? record.fromDate.toISOString()
          : record.fromDate,
      toDate:
        record.toDate instanceof Date
          ? record.toDate.toISOString()
          : record.toDate,
    };

    return crypto
      .createHash("md5")
      .update(JSON.stringify(fingerprintData))
      .digest("hex");
  }

  private async processRows(
    rows: any[],
    records: FinancialDataDTO[],
    timeColumns: TimeColumn[],
    companyId: number,
    sourceId: number,
    sourceName: string,
    reportInfo: {
      reportName: string;
      reportBasis?: string;
      accountingStandard?: string;
      currency?: string;
    },
    parentCategory?: string,
    depth: number = 0,
    path: string[] = []
  ): Promise<void> {
    if (!rows || !Array.isArray(rows)) return;

    for (const row of rows) {
      if (row.Header) {
        const headerData = row.Header.ColData;
        const categoryName = headerData[0].value;

        const currentPath = [...path, categoryName];

        if (row.Rows && row.Rows.Row) {
          await this.processRows(
            row.Rows.Row,
            records,
            timeColumns,
            companyId,
            sourceId,
            sourceName,
            reportInfo,
            categoryName,
            depth + 1,
            currentPath
          );
        }
      } else if (row.ColData) {
        const lineItemName = row.ColData[0].value;
        const accountId = row.ColData[0].id;

        const currentPath = [...path, lineItemName];

        const { category, subcategory } =
          this.determineCategoriesFromPath(currentPath);

        for (let i = 1; i < timeColumns.length + 1; i++) {
          const colMetadata = timeColumns[i - 1].MetaData;
          const startDate = colMetadata.find(
            (m: ColumnMetadata) => m.Name === "StartDate"
          )?.Value;
          const endDate = colMetadata.find(
            (m: ColumnMetadata) => m.Name === "EndDate"
          )?.Value;

          if (!startDate || !endDate) continue;

          const value = row.ColData[i].value;
          if (value === "" || value === undefined) continue;

          const amount = Number(value);
          if (isNaN(amount) || amount === 0) continue;

          records.push({
            amount,
            sourceId,
            category,
            companyId,
            accountId,
            sourceName,
            subcategory,
            lineItemName,
            toDate: new Date(endDate),
            fromDate: new Date(startDate),
            metadata: {
              depth: depth,
              rowType: row.type || "Data",
              path: currentPath.join(" > "),
              currency: reportInfo.currency,
              reportName: reportInfo.reportName,
              reportBasis: reportInfo.reportBasis,
              colTitle: timeColumns[i - 1].ColTitle,
              accountingStandard: reportInfo.accountingStandard,
            },
          });
        }
      }
    }
  }

  private determineCategoriesFromPath(path: string[]): {
    category: string;
    subcategory: string;
  } {
    let category = "";
    let subcategory = "";

    if (path.length === 0) {
      return { category, subcategory };
    }

    category = path[0];

    if (path.length > 1) {
      subcategory = path[1];
    }

    return {
      category: category.trim(),
      subcategory: subcategory.trim(),
    };
  }

  private formatCategoryName(name: string): string {
    return name
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  private async bulkInsertRecordsWithDuplicateHandling(
    records: FinancialDataDTO[]
  ): Promise<number> {
    if (records.length === 0) return 0;

    const originalIds = records
      .map((record) => record.originalId)
      .filter(Boolean) as string[];

    const existingRecords = await this.prisma.financialData.findMany({
      where: {
        originalId: {
          in: originalIds,
        },
      },
      select: {
        originalId: true,
      },
    });

    const existingIds = new Set(existingRecords.map((r) => r.originalId));

    const newRecords = records.filter(
      (record) => !existingIds.has(record.originalId as string)
    );

    logger.info(
      `Found ${existingIds.size} existing records out of ${records.length} total. Inserting ${newRecords.length} new records.`
    );

    if (newRecords.length === 0) {
      return 0;
    }

    let insertedCount = 0;

    for (let i = 0; i < newRecords.length; i += this.BATCH_SIZE) {
      const batch = newRecords.slice(i, i + this.BATCH_SIZE);
      const result = await this.prisma.financialData.createMany({
        data: batch,
        skipDuplicates: true,
      });

      insertedCount += result.count;
    }

    return insertedCount;
  }

  private logError(format: string, error: unknown, context: any): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error processing ${format} format: ${errorMessage}`, {
      ...context,
      error,
    });
  }
}
