import { Request, Response, Router } from "express";

import {
  idParamSchema,
  createCompanySchema,
  updateCompanySchema,
  createCompanyConfigSchema,
} from "../schemas/validation.schemas";
import { prisma } from "../config/database";
import { validate } from "../middleware/validation.middleware";
import { createError } from "../middleware/error-handler.middleware";
import { CompanyRepository } from "../repositories/company.repository";

const router: Router = Router();
const companyRepository = new CompanyRepository();

router.get("/", async (_req: Request, res: Response) => {
  const companies = await prisma.company.findMany({
    include: { configs: true },
  });
  res.json(companies);
});

router.get(
  "/:id",
  validate(idParamSchema),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const company = await companyRepository.findCompanyWithConfigs(
      parseInt(id)
    );

    if (!company) {
      throw createError(`Company not found: ${id}`, 404);
    }

    res.json(company);
  }
);

router.post(
  "/",
  validate(createCompanySchema),
  async (req: Request, res: Response) => {
    const { name } = req.body;

    const newCompany = await prisma.company.create({
      data: { name },
    });

    res.status(201).json(newCompany);
  }
);

router.put(
  "/:id",
  validate(updateCompanySchema),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name } = req.body;

    let updatedCompany;
    try {
      updatedCompany = await prisma.company.update({
        where: { id: parseInt(id) },
        data: { name },
      });
    } catch (error) {
      throw createError(`Company not found: ${id}`, 404);
    }

    res.json(updatedCompany);
  }
);

router.delete(
  "/:id",
  validate(idParamSchema),
  async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      await companyRepository.deleteCompanyWithRelatedRecords(parseInt(id));
    } catch (error) {
      throw createError(`Company not found: ${id}`, 404);
    }

    res.status(204).end();
  }
);

router.post(
  "/:id/config",
  validate(createCompanyConfigSchema),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      name,
      apiKey,
      apiSecret,
      sourceType,
      apiEndpoint,
      fieldMappings,
      additionalConfig,
    } = req.body;

    const company = await companyRepository.findCompanyWithConfigs(
      parseInt(id)
    );

    if (!company) {
      throw createError(`Company not found: ${id}`, 404);
    }

    try {
      const config = await prisma.companyConfig.create({
        data: {
          name,
          apiKey,
          apiSecret,
          sourceType,
          apiEndpoint,
          fieldMappings,
          additionalConfig,
          company: {
            connect: { id: parseInt(id) },
          },
        },
      });

      res.json(config);
    } catch (error: any) {
      if (error.code === "P2002") {
        throw createError(
          `Data source with name "${name}" already exists for this company`,
          400
        );
      }
      throw error;
    }
  }
);

router.put(
  "/:companyId/config/:configId",
  async (req: Request, res: Response) => {
    const { companyId, configId } = req.params;
    const {
      name,
      apiKey,
      apiSecret,
      sourceType,
      apiEndpoint,
      fieldMappings,
      additionalConfig,
    } = req.body;

    const company = await companyRepository.findCompanyWithConfigs(
      parseInt(companyId)
    );

    if (!company) {
      throw createError(`Company not found: ${companyId}`, 404);
    }

    const dataSource = company.configs?.find(
      (config) => config.id === parseInt(configId)
    );

    if (!dataSource) {
      throw createError(`Data source not found: ${configId}`, 404);
    }

    const config = await prisma.companyConfig.update({
      where: {
        id: parseInt(configId),
      },
      data: {
        name: name || dataSource.name,
        sourceType: sourceType || dataSource.sourceType,
        apiEndpoint,
        apiKey,
        apiSecret,
        fieldMappings,
        additionalConfig,
      },
    });

    res.json(config);
  }
);

router.get(
  "/:id/configs",
  async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;

    const company = await companyRepository.findCompanyWithConfigs(
      parseInt(id)
    );

    if (!company) {
      throw createError(`Company not found: ${id}`, 404);
    }

    if (!company.configs || company.configs.length === 0) {
      return res.json([]);
    }

    res.json(company.configs);
  }
);

router.get(
  "/:companyId/config/:configId",
  async (req: Request, res: Response) => {
    const { companyId, configId } = req.params;

    const config = await prisma.companyConfig.findUnique({
      where: {
        id: parseInt(configId),
      },
      include: {
        company: true,
      },
    });

    if (!config) {
      throw createError(`Configuration not found: ${configId}`, 404);
    }

    if (config.companyId !== parseInt(companyId)) {
      throw createError(
        `Configuration ${configId} does not belong to company ${companyId}`,
        404
      );
    }

    res.json(config);
  }
);

router.delete(
  "/:companyId/config/:configId",
  async (req: Request, res: Response) => {
    const { companyId, configId } = req.params;

    const config = await prisma.companyConfig.findUnique({
      where: {
        id: parseInt(configId),
      },
    });

    if (!config) {
      throw createError(`Configuration not found: ${configId}`, 404);
    }

    if (config.companyId !== parseInt(companyId)) {
      throw createError(
        `Configuration ${configId} does not belong to company ${companyId}`,
        404
      );
    }

    await prisma.companyConfig.delete({
      where: { id: parseInt(configId) },
    });

    res.status(204).end();
  }
);

export default router;
