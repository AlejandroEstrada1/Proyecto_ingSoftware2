/** @type {import("jest").Config} */
module.exports = {
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testMatch: ["**/*.test.{js,jsx}"],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/backend/",
    "<rootDir>/tests/e2e/",
  ],
  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },
  moduleNameMapper: {
    "\\.(gif|ttf|eot|svg|png)$": "<rootDir>/test/__mocks__/fileMock.js",
    "\\.(css|less|sass|scss)$": "identity-obj-proxy",
  },
  collectCoverageFrom: [
    "src/**/*.{js,jsx}",
    "!src/main.jsx",
    "!src/env-bootstrap.js",
    "!src/**/*.test.{js,jsx}",
  ],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "<rootDir>/src/servicios/",
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}
