const {writeFileSync} = require('fs-extra');
const {extendEnvironment, subtask} = require('hardhat/config');
const {TASK_TEST_SETUP_TEST_ENVIRONMENT} = require('hardhat/builtin-tasks/task-names');

require('@nomiclabs/hardhat-truffle5');

extendEnvironment(function (hre) {
  hre.artifacts.mixin = function (name, ...extendedABINames) {
    const artifact = hre.artifacts.require(name);
    for (const extendedABIName of extendedABINames) {
      artifact.abi.push(...hre.artifacts.require(extendedABIName).abi);
    }
    return artifact;
  };
});

subtask(TASK_TEST_SETUP_TEST_ENVIRONMENT, async function (taskArguments, hre, runSuper) {
  writeFileSync('test/.accounts', `module.exports=${JSON.stringify((await hre.ethers.getSigners()).map((s) => s.address))}`);
  return runSuper(taskArguments);
});

const chai = require('chai');
chai.should();
chai.use(require('chai-bn')(require('bn.js')));
