const {expectRevert} = require('@openzeppelin/test-helpers');
const {ZeroAddress} = require('../../src/constants');
const {deployDiamond, facetInit} = require('./diamond');

function runBehaviorTests(name, config, behaviorFn) {
  async function deployAsImmutableContract(args, deployer) {
    const arguments_ = {...config.defaultArguments, ...args};
    const ctorArguments = config.immutable.ctorArguments !== undefined ? config.immutable.ctorArguments.map((arg) => arguments_[arg]) : [];
    const abiExtensions = config.abiExtensions !== undefined ? config.abiExtensions : [];
    const contract = await artifacts.mixin(config.immutable.name, ...abiExtensions).new(...ctorArguments, {from: deployer});
    return {
      contract,
      tx: contract.transactionHash,
    };
  }

  async function deployAsDiamondFacet(args) {
    const facets = [...config.diamond.facetDependencies, config.diamond.mainFacet];
    const deployments = await deployDiamond(facets, {...config.defaultArguments, ...args}, config.abiExtensions);
    return {
      contract: deployments.diamond,
      tx: deployments.diamond.transactionHash,
      facets: deployments.facets,
    };
  }

  describe(`${name} (as immutable contract)`, function () {
    behaviorFn(deployAsImmutableContract);
  });
  describe(`${name} (as diamond facet)`, function () {
    if (config.diamond.mainFacet.initMethod !== undefined) {
      describe(config.diamond.mainFacet.initMethod, function () {
        const initArguments =
          config.diamond.mainFacet.initArguments !== undefined
            ? config.diamond.mainFacet.initArguments.map((arg) => config.defaultArguments[arg])
            : [];

        if (config.diamond.mainFacet.name !== 'ProxyAdminFacetMock') {
          it('reverts if not called by the proxy admin', async function () {
            const facets = [...config.diamond.facetDependencies, config.diamond.mainFacet];
            const deployments = await deployDiamond(facets, config.defaultArguments, config.abiExtensions, () => true);
            await deployments.diamond.changeProxyAdmin(ZeroAddress, {
              from: config.defaultArguments.initialAdmin,
            });
            await expectRevert(deployments.diamond[config.diamond.mainFacet.initMethod](...initArguments), 'ProxyAdmin: not the admin');
          });
        }

        it('reverts when trying to initialize the storage twice', async function () {
          const deployments = await deployAsDiamondFacet(config.defaultArguments);
          const cut = facetInit(deployments.facets[config.diamond.mainFacet.name], config.diamond.mainFacet.initMethod, initArguments);
          await expectRevert(deployments.contract.diamondCut([], ...cut), 'Storage: version reached');
        });
      });
    }
    behaviorFn(deployAsDiamondFacet);
  });
}

module.exports = {
  runBehaviorTests,
};
