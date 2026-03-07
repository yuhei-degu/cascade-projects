/** @type {import('jest').Config} */
const config = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
  testMatch: ["**/tests/**/*.test.ts"],
  collectCoverageFrom: ["src/lib/**/*.ts", "src/app/api/**/*.ts"],
};
module.exports = config;
