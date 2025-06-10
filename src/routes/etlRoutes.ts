import { Request, Response, Router } from "express";

import logger from "../utils/logger.util";
import { validate } from "../middleware/validation.middleware";
import { createError } from "../middleware/error-handler.middleware";
import { ApiJsonEtlService } from "../services/api-json-etl.service";
import { CompanyRepository } from "../repositories/company.repository";
import { financialDataQuerySchema } from "../schemas/validation.schemas";
import { FinancialDataRepository } from "../repositories/financial-data.repository";

const companyRepository = new CompanyRepository();
const apiJsonEtlService = new ApiJsonEtlService();
const financialDataRepository = new FinancialDataRepository();

const router: Router = Router();

router.post("/sync/:companyId", async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const companyIdNum = parseInt(companyId);

    const company = await companyRepository.findCompanyWithConfigs(
      companyIdNum
    );
    if (!company) {
      throw createError(`Company not found: ${companyId}`, 404);
    }

    const apiSources = company.configs;

    if (!apiSources || apiSources.length === 0) {
      throw createError(`Company has no API data sources: ${companyId}`, 400);
    }

    const syncJob = await companyRepository.createSyncJob(companyIdNum);

    res.status(202).json({
      jobId: syncJob.id,
      message: "JSON API ETL process started for all API data sources",
      status: "running",
      apiSourcesCount: apiSources.length,
    });

    try {
      await apiJsonEtlService.processApiData(companyIdNum, syncJob.id);
    } catch (error: any) {
      logger.error(`Error in JSON API ETL process: ${error.message}`, {
        companyId: companyIdNum,
        jobId: syncJob.id,
        error,
      });
    }
  } catch (error: any) {
    throw createError(error.message, error.statusCode || 500);
  }
});

router.get("/job/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const jobId = parseInt(id);

  const syncJobs = await companyRepository.findSyncJobs({
    id: jobId,
  });

  if (!syncJobs || syncJobs.length === 0) {
    throw createError(`Job not found: ${id}`, 404);
  }

  res.json(syncJobs[0]);
});

router.get("/jobs/company/:companyId", async (req: Request, res: Response) => {
  const { companyId } = req.params;
  const { sourceId } = req.query;
  const companyIdNum = parseInt(companyId);

  const company = await companyRepository.findCompanyWithConfigs(companyIdNum);

  if (!company) {
    throw createError(`Company not found: ${companyId}`, 404);
  }

  const queryParams: any = { companyId: companyIdNum };

  if (sourceId) {
    queryParams.sourceId = parseInt(sourceId as string);
  }

  const jobs = await companyRepository.findSyncJobs(queryParams);

  res.json(jobs);
});

router.get(
  "/financial-data/:companyId",
  validate(financialDataQuerySchema),
  async (req: Request, res: Response) => {
    const { companyId } = req.params;
    const companyIdNum = parseInt(companyId);

    const company = await companyRepository.findCompanyWithConfigs(
      companyIdNum
    );

    if (!company) {
      throw createError(`Company not found: ${companyId}`, 404);
    }

    const result = await financialDataRepository.getFinancialDataForCompany(
      companyIdNum
    );

    res.json(result);
  }
);

export default router;
