const {task, extendConfig} = require('hardhat/config');
const {docgen} = require('solidity-docgen/dist/docgen');
const merge = require('lodash.merge');

extendConfig((config, userConfig) => {
  const defaultCompiler = config.solidity.compilers[0];
  const optimizer = defaultCompiler.settings.optimizer;

  const docgenConfig = {
    input: config.paths.sources,
    'solc-module': `solc-${defaultCompiler.version}`,
    'solc-settings': optimizer ? {optimizer} : undefined,
  };

  if (userConfig.solidity && userConfig.solidity.docgen) {
    merge(docgenConfig, userConfig.solidity.docgen);
  }

  config.solidity.docgen = docgenConfig;
});

task('docgen', 'Generates NATSPEC documentation', async (taskArguments, hre) => {
  await docgen(hre.config.solidity.docgen);
});
