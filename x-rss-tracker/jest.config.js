/** @type {import('jest').Config} */
const config = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          module: "commonjs",
          esModuleInterop: true,
        },
      },
    ],
  },
  collectCoverageFrom: [
    "src/lib/**/*.ts",
    "src/app/api/**/*.ts",
    "src/cron/**/*.ts",
    "!**/*.d.ts",
  ],
};

module.exports = config;
