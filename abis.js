const glob = require('glob');

const abis = {};

glob.sync(`${__dirname}/artifacts/contracts/**/*.json`).forEach((file) => {
  if (file.endsWith('.dbg.json')) {
    return;
  }
  const artifact = require(file);
  abis[artifact.contractName] = artifact.abi;
});

module.exports = abis;
