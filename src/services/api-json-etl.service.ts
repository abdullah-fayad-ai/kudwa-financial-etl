import axios from "axios";
import * as crypto from "crypto";

import logger from "../utils/logger.util";
import { JsonExtractorService } from "./json-extractor.service";
import { CompanyRepository } from "../repositories/company.repository";

export class ApiJsonEtlService {
  private jsonExtractor: JsonExtractorService;
  private companyRepository: CompanyRepository;

  constructor() {
    this.jsonExtractor = new JsonExtractorService();
    this.companyRepository = new CompanyRepository();
  }

  async processApiData(companyId: number, jobId: number): Promise<void> {
    try {
      const company = await this.companyRepository.findCompanyWithConfigs(
        companyId
      );

      if (!company || !company.configs || company.configs.length === 0) {
        throw new Error(`No configuration found for company ${companyId}`);
      }

      if (company.configs.length === 0) {
        throw new Error(`No API data sources found for company ${companyId}`);
      }

      logger.info(`Processing API data for Company ${companyId}`);

      let totalRecordsProcessed = 0;

      for (const config of company.configs) {
        try {
          logger.info(
            `Processing data source: ${config.name} for company ${companyId}`
          );

          await this.companyRepository.updateSyncJobSource(
            jobId,
            config.id,
            config.name
          );

          const jsonData = await this.fetchFromApi(
            config.apiEndpoint as string,
            config
          );

          if (!jsonData) {
            logger.warn(`No data received from ${config.apiEndpoint}`);
            continue;
          }

          const contentHash = this.calculateContentHash(jsonData);
          logger.info(`API data hash: ${contentHash}`);

          let recordCount = 0;

          const format = this.detectFormat(companyId);

          if (format === "company1") {
            recordCount = await this.jsonExtractor.extractCompany1Data(
              jsonData,
              companyId,
              config.id,
              config.name
            );
          } else if (format === "company2") {
            recordCount = await this.jsonExtractor.extractCompany2Data(
              jsonData,
              companyId,
              config.id,
              config.name
            );
          } else {
            logger.warn(
              `Unknown data format for source ${config.name}, skipping`
            );
            continue;
          }

          totalRecordsProcessed += recordCount;
          logger.info(
            `Processed ${recordCount} records from source ${config.name}`
          );

          await this.companyRepository.updateLastSyncTime(config.id);
        } catch (error: any) {
          logger.error(
            `Error processing source ${config.name}: ${error.message}`,
            {
              companyId,
              sourceId: config.id,
              sourceName: config.name,
              errorStack: error.stack,
            }
          );

          continue;
        }
      }

      await this.companyRepository.updateSyncJobStatus(
        jobId,
        "completed",
        `Successfully processed ${totalRecordsProcessed} records from API sources`
      );

      logger.info(`API ETL process completed for company ${companyId}`);
    } catch (error: any) {
      logger.error(`Error processing API data: ${error.message}`, {
        companyId,
        jobId,
        errorStack: error.stack,
      });

      await this.companyRepository.updateSyncJobStatus(
        jobId,
        "failed",
        error.message
      );

      throw error;
    }
  }

  private async fetchFromApi(endpoint: string, config: any): Promise<any> {
    try {
      const headers: Record<string, string> = {};

      if (config.apiKey) {
        headers["Authorization"] = `Bearer ${config.apiKey}`;
      }

      const response = await axios.get(endpoint, {
        headers,
        params: config.additionalConfig?.queryParams || {},
        timeout: 30000, // 30 seconds timeout
      });

      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status || 500;
        const errorMessage = error.response?.data?.message || error.message;
        logger.error(`API Error: ${errorMessage}`, {
          endpoint,
          statusCode,
        });
        throw new Error(`Failed to fetch data from API: ${errorMessage}`);
      }

      logger.error(`Error fetching data from API: ${error.message}`);
      throw new Error(`Failed to fetch data from API: ${error.message}`);
    }
  }

  private calculateContentHash(content: any): string {
    const contentString = JSON.stringify(content);
    return crypto.createHash("md5").update(contentString).digest("hex");
  }

  private detectFormat(companyNumber: number): string {
    if (companyNumber === 1) {
      return "company1";
    } else if (companyNumber === 2) {
      return "company2";
    }

    return "company1";
  }
}
