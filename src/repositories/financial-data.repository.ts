import { prisma } from "../config/database";
import { FinancialDataDTO } from "../interfaces/data.interface";

export class FinancialDataRepository {
  async createFinancialData(data: FinancialDataDTO) {
    return prisma.financialData.create({
      data: {
        companyId: data.companyId,
        sourceId: data.sourceId,
        sourceName: data.sourceName,
        fromDate: data.fromDate,
        toDate: data.toDate,
        category: data.category,
        subcategory: data.subcategory,
        lineItemName: data.lineItemName,
        accountId: data.accountId,
        amount: data.amount,
        originalId: data.originalId,
        metadata: data.metadata || {},
      },
    });
  }

  async getFinancialDataForCompany(companyId: number): Promise<any> {
    const whereClause: any = { companyId };

    const data = await prisma.financialData.findMany({
      where: whereClause,
      orderBy: { fromDate: "asc" },
    });

    return {
      data,
    };
  }
}
