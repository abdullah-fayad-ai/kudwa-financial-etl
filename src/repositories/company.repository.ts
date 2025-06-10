import { prisma } from "../config/database";

export class CompanyRepository {
  async findCompanyWithConfigs(companyId: number) {
    return prisma.company.findUnique({
      where: { id: companyId },
      include: { configs: true },
    });
  }

  async updateLastSyncTime(configId: number) {
    return prisma.companyConfig.update({
      where: { id: configId },
      data: { lastSync: new Date() },
    });
  }

  async deleteCompanyWithRelatedRecords(companyId: number) {
    return prisma.$transaction(async (tx) => {
      await tx.syncJob.deleteMany({
        where: { companyId },
      });

      await tx.financialData.deleteMany({
        where: { companyId },
      });

      await tx.companyConfig.deleteMany({
        where: { companyId },
      });

      return tx.company.delete({
        where: { id: companyId },
      });
    });
  }

  async createSyncJob(companyId: number) {
    return prisma.syncJob.create({
      data: {
        companyId,
        status: "running",
      },
    });
  }

  async updateSyncJobSource(
    jobId: number,
    sourceId: number,
    sourceName: string
  ) {
    return prisma.syncJob.update({
      where: { id: jobId },
      data: {
        sourceId,
        sourceName,
      },
    });
  }

  async findSyncJobs(filters: {
    id?: number;
    companyId?: number;
    status?: string;
    sourceId?: number;
  }) {
    const where: any = {};

    if (filters.id) {
      where.id = filters.id;
    }

    if (filters.companyId) {
      where.companyId = filters.companyId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.sourceId) {
      where.sourceId = filters.sourceId;
    }

    return prisma.syncJob.findMany({
      where,
      orderBy: { startedAt: "desc" },
    });
  }

  async updateSyncJobStatus(jobId: number, status: string, error?: string) {
    return prisma.syncJob.update({
      where: { id: jobId },
      data: {
        status,
        completedAt: new Date(),
        error,
      },
    });
  }
}
