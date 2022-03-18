const {artifacts, ethers} = require('hardhat');
const {utils} = ethers;

const FacetCutAction = {
  Add: '0',
  Replace: '1',
  Remove: '2',
};

const newFacetFilter = (el) => !el.name.startsWith('init');

function getSelectors(facet, abiFilter) {
  const facetInterface = new utils.Interface(facet.abi);
  let functions = Object.values(facetInterface.functions);
  if (abiFilter !== undefined) {
    functions = functions.filter(abiFilter);
  }
  return functions.map((f) => utils.Interface.getSighash(f));
}

function facetInit(deployedFacet, initMethod, initArgs) {
  return [deployedFacet.address, new utils.Interface(deployedFacet.abi).encodeFunctionData(initMethod, initArgs)];
}

async function deployFacets(facetsConfig, args, methodsFilter) {
  const facets = {};
  const cuts = [];
  const inits = [];
  for (const config of facetsConfig) {
    const ctorArguments = config.ctorArguments !== undefined ? config.ctorArguments.map((arg) => args[arg]) : [];
    const deployedFacet = await artifacts.require(config.name).new(...ctorArguments);
    facets[config.name] = deployedFacet;
    cuts.push([deployedFacet.address, FacetCutAction.Add, getSelectors(deployedFacet, methodsFilter)]);
    if (config.initMethod !== undefined) {
      const initArguments = config.initArguments !== undefined ? config.initArguments.map((arg) => args[arg]) : [];
      inits.push(facetInit(deployedFacet, config.initMethod, initArguments));
    }
  }

  return {facets, cuts, inits};
}

async function deployDiamond(facetsConfig, args, abiExtensions = [], methodsFilter = newFacetFilter, implementation = 'Diamond') {
  const facetDeployments = await deployFacets(facetsConfig, args, methodsFilter);
  const Diamond = artifacts.mixin(implementation, ...facetsConfig.map((facet) => facet.name), ...abiExtensions);
  const diamond = await Diamond.new(facetDeployments.cuts, facetDeployments.inits);
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
};
