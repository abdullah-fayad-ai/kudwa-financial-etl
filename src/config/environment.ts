export const environment = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "5005", 10),
  databaseUrl: process.env.DATABASE_URL,
  useLocalData: process.env.USE_LOCAL_DATA === "true",
  logLevel:
    process.env.LOG_LEVEL ||
    (process.env.NODE_ENV === "development" ? "debug" : "info"),
  sampleDataPath: process.env.SAMPLE_DATA_PATH || "sample_data.json",
};
