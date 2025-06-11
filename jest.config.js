module.exports = {
  testMatch: ["**/?(*.)+(test).ts"], // Only .test.ts
  preset: "ts-jest", // Required for TypeScript
  testPathIgnorePatterns: ["/node_modules/"], // Ignore Playwright's dir
};
