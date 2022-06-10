const {ethers, deployments} = require('hardhat');
const {utils} = ethers;
const {deployContract} = require('./contract');

const isEqual = require('lodash.isequal');

const FacetCutAction = {
  Add: 0,
  Replace: 1,
  Remove: 2,
};

function mergeABIs(abi, extensions, abiFilter) {
  for (const extension of extensions) {
    const abiErrors = abi.filter((el) => el.type === 'error');
    abi.push(...extension.filter((el) => el.type !== 'constructor' && el.type !== 'error').filter(abiFilter));
    const extensionErrors = extension.filter((el) => el.type === 'error');
    for (const extensionError of extensionErrors) {
      // prevent errors duplication
      if (abiErrors.find((error) => isEqual(error, extensionError)) === undefined) {
        abi.push(extensionError);
      }
    }
  }
}

const newFacetFilter = (el) => !el.name.startsWith('init') && !el.name.startsWith('__');

function getSelectors(facet, abiFilter) {
  let functions = Object.values(facet.interface.functions);
  if (abiFilter !== undefined) {
    functions = functions.filter(abiFilter);
  }
  return functions.map((f) => utils.Interface.getSighash(f));
}

function facetInit(facet, initMethod, initArgs) {
  return [facet.address, facet.interface.encodeFunctionData(initMethod, initArgs)];
}

async function deployFacets(facetsConfig, args, abiFilter) {
  const facets = {};
  const cuts = [];
  const inits = [];
  for (const config of facetsConfig) {
    const ctorArguments = config.ctorArguments !== undefined ? config.ctorArguments.map((arg) => args[arg]) : [];
    const facet = await deployContract(config.name, ...ctorArguments);
    facets[config.name] = facet;
    cuts.push([facet.address, FacetCutAction.Add, getSelectors(facet, abiFilter)]);
    if (config.init !== undefined) {
      const initArguments = config.init.arguments !== undefined ? config.init.arguments.map((arg) => args[arg]) : [];
      inits.push([facet.address, facet.interface.encodeFunctionData(config.init.method, initArguments)]);
    }
  }

  return {facets, cuts, inits};
}

async function deployDiamond(facetsConfig, args, abiExtensions = [], abiFilter = newFacetFilter, implementation = 'Diamond') {
  const facetDeployments = await deployFacets(facetsConfig, args, abiFilter);
  const artifact = await deployments.getArtifact(implementation);
  const abi = [...artifact.abi];
  const facetABIs = Object.values(facetDeployments.facets).map((facet) => JSON.parse(facet.interface.format(ethers.utils.FormatTypes.json)));
  const extensionABIs = [];
  for (const extension of abiExtensions) {
    const extensionArtifact = await deployments.getArtifact(extension);
    extensionABIs.push(extensionArtifact.abi);
  }
  mergeABIs(abi, [...facetABIs, ...extensionABIs], abiFilter);
  const Diamond = await ethers.getContractFactory(abi, artifact.bytecode);
  const diamond = await Diamond.deploy(facetDeployments.cuts, facetDeployments.inits);
  await diamond.deployed();
  return {
    diamond,
    facets: facetDeployments.facets,
  };
}

module.exports = {
  FacetCutAction,
  getSelectors,
  newFacetFilter,
  facetInit,
  deployFacets,
  deployDiamond,
  mergeABIs,
};
