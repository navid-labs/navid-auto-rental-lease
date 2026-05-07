import baseConfig from "./playwright.config";

const existingServerConfig = {
  ...baseConfig,
  globalSetup: undefined,
  use: {
    ...baseConfig.use,
    storageState: undefined,
  },
  webServer: undefined,
};

export default existingServerConfig;
