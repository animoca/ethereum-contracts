const {ethers} = require('hardhat');
const {ZeroAddress} = require('../../src/constants');
const {deployContract} = require('./contract');
const {deployDiamond, facetInit, mergeABIs} = require('./diamond');
const {deployForwarderRegistry} = require('./metatx');

async function getDeployerAddress() {
  return (await ethers.getSigners())[0].address;
}

async function getForwarderRegistryAddress() {
  return (await deployForwarderRegistry()).address;
}

async function buildDefaultArguments(defaultArguments) {
  const result = {};
  if (defaultArguments === undefined) return result;

  for (const key of Object.keys(defaultArguments)) {
    const value = defaultArguments[key];
    if (typeof value === 'function') {
      result[key] = await value();
    } else {
      result[key] = value;
    }
  }
  return result;
}

function runBehaviorTests(name, config, behaviorFn) {
  async function deployAsImmutableContract(args = {}) {
    const defaultArguments = await buildDefaultArguments(config.defaultArguments);
    const arguments_ = {...defaultArguments, ...args};
    const ctorArguments = config.immutable.ctorArguments !== undefined ? config.immutable.ctorArguments.map((arg) => arguments_[arg]) : [];
    const abiExtensions = config.abiExtensions !== undefined ? config.abiExtensions : [];
    const artifact = await deployments.getArtifact(config.immutable.name);
    const abi = [...artifact.abi];
    const extensionABIs = [];
    for (const extension of abiExtensions) {
      const extensionArtifact = await deployments.getArtifact(extension);
      extensionABIs.push(extensionArtifact.abi);
    }
    mergeABIs(abi, extensionABIs, (el) => el.type !== 'constructor');
    const Contract = await ethers.getContractFactory(abi, artifact.bytecode);
    const contract = await Contract.deploy(...ctorArguments);
    await contract.deployed();
    return contract;
  }

  async function deployAsDiamondFacet(args = {}) {
    const facets = [...config.diamond.facets];
    const defaultArguments = await buildDefaultArguments(config.defaultArguments);
    const deployments = await deployDiamond(facets, {...defaultArguments, ...args});
    return deployments.diamond;
  }

  describe(`${name}`, function () {
    before(async function () {
      this.defaultArguments = await buildDefaultArguments(config.defaultArguments);
    });
    if (config.immutable !== undefined) {
      describe(`${name} (as immutable contract)`, function () {
        if (config.immutable.metaTxSupport) {
          it('__msgData()', async function () {
            const ctorArguments =
              config.immutable.ctorArguments !== undefined ? config.immutable.ctorArguments.map((arg) => this.defaultArguments[arg]) : [];
            const contract = await deployContract(config.immutable.name, ctorArguments);
            try {
              await contract.__msgData();
            } catch (e) {}
          });
        }
        behaviorFn(deployAsImmutableContract);
      });
    }
    if (config.diamond !== undefined) {
      describe(`${name} (as diamond facet)`, function () {
        for (const facet of config.diamond.facets) {
          describe(facet.name, function () {
            if (facet.init !== undefined) {
              describe(`${facet.init.method}`, function () {
                if (facet.init.adminProtected) {
                  it('reverts if not called by the proxy admin', async function () {
                    const facets = [...config.diamond.facets];
                    const abiExtensions = config.abiExtensions !== undefined ? config.abiExtensions : [];
                    const deployments = await deployDiamond(facets, this.defaultArguments, abiExtensions, (el) => !el.name.startsWith('__'));
                    await deployments.diamond.changeProxyAdmin(ZeroAddress);
                    const mainFacetInitArguments =
                      facet.init.arguments !== undefined ? facet.init.arguments.map((arg) => this.defaultArguments[arg]) : [];
                    await expect(deployments.diamond[facet.init.method](...mainFacetInitArguments)).to.be.revertedWith('ProxyAdmin: not the admin');
                  });
                }

                if (facet.init.phaseProtected) {
                  it('reverts when trying to initialize the storage twice', async function () {
                    const facets = [...config.diamond.facets];
                    const abiExtensions = config.abiExtensions !== undefined ? config.abiExtensions : [];
                    const deployments = await deployDiamond(facets, this.defaultArguments, abiExtensions);
                    const mainFacetInitArguments =
                      facet.init.arguments !== undefined ? facet.init.arguments.map((arg) => this.defaultArguments[arg]) : [];
                    const cut = facetInit(deployments.facets[facet.name], facet.init.method, mainFacetInitArguments);
                    await expect(
                      deployments.diamond.functions['diamondCut((address,uint8,bytes4[])[],address,bytes)']([], ...cut)
                    ).to.be.revertedWith('Storage: phase reached');
                  });
                }
              });
            }

            if (facet.metaTxSupport) {
              it('__msgData()', async function () {
                const ctorArguments = facet.ctorArguments !== undefined ? facet.ctorArguments.map((arg) => this.defaultArguments[arg]) : [];
                const contract = await deployContract(facet.name, ctorArguments);
                try {
                  await contract.__msgData();
                } catch (e) {}
              });
            }
          });
        }
        behaviorFn(deployAsDiamondFacet);
      });
    }
  });
}

module.exports = {
  getDeployerAddress,
  getForwarderRegistryAddress,
  runBehaviorTests,
};
