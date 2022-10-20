const tsJestOptions = {
  tsConfig: "frontend/tsconfig.json",
};

module.exports = {
  roots: ["<rootDir>/frontend/", "<rootDir>/tests/"],

  testEnvironment: "jsdom",

  transform: {
    "^.+\\.tsx?$": ["ts-jest", tsJestOptions], // Transform TypeScript files using ts-jest
    "^.+\\.jsx?$": ["ts-jest", tsJestOptions], // Transform JavaScript files using ts-jest
  },

  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],

  coverageDirectory: "<rootDir>/coverage/",
  collectCoverageFrom: [
    "<rootDir>/src/**/*.{ts,tsx}",
    "!**/__mocks__/**",
    "!**/node_modules/**",
    "!**/*.d.ts",
  ],

  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  verbose: true,
  testTimeout: 30000,
};
