// force timezone to UTC to allow tests to work regardless of local timezone
// generally used by snapshots, but can affect specific tests
process.env.TZ = 'UTC';

const grafanaConfig = require('./.config/jest.config');

module.exports = {
  // Jest configuration provided by Grafana scaffolding
  ...grafanaConfig,
  moduleNameMapper: {
    ...grafanaConfig.moduleNameMapper,
    '\\.mp3$': '<rootDir>/src/test-utils/fileMock.js',
  },
};
