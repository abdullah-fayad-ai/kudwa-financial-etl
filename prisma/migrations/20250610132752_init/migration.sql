-- CreateTable
CREATE TABLE "Company" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyConfig" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "apiEndpoint" TEXT,
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "credentials" JSONB,
    "fieldMappings" JSONB NOT NULL,
    "additionalConfig" JSONB,
    "lastSync" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialData" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "sourceId" INTEGER NOT NULL,
    "sourceName" TEXT NOT NULL,
    "fromDate" TIMESTAMP(3) NOT NULL,
    "toDate" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "lineItemName" TEXT,
    "accountId" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "originalId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncJob" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "sourceId" INTEGER,
    "sourceName" TEXT,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "error" TEXT,
    "metadata" JSONB,

    CONSTRAINT "SyncJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompanyConfig_companyId_name_key" ON "CompanyConfig"("companyId", "name");

-- CreateIndex
CREATE INDEX "FinancialData_category_subcategory_idx" ON "FinancialData"("category", "subcategory");

-- CreateIndex
CREATE INDEX "FinancialData_sourceId_sourceName_idx" ON "FinancialData"("sourceId", "sourceName");

-- AddForeignKey
ALTER TABLE "CompanyConfig" ADD CONSTRAINT "CompanyConfig_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialData" ADD CONSTRAINT "FinancialData_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncJob" ADD CONSTRAINT "SyncJob_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
