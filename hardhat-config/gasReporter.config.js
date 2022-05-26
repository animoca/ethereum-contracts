const mochaConfig = process.env.REPORT_GAS
  ? {
      mocha: {
        grep: '@skip-on-coverage', // Find everything with this tag
        invert: true, // Run the grep's inverse set.
      },
    }
  : {};

module.exports = {
  gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false,
    outputFile: 'gas-report.txt',
    noColors: true,
  },
  ...mochaConfig,
};
