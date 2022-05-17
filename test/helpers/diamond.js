const {ethers, deployments} = require('hardhat');
const {utils} = ethers;

const FacetCutAction = {
  Add: 0,
  Replace: 1,
  Remove: 2,
};

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

async function deployFacets(facetsConfig, args, methodsFilter) {
  const facets = {};
  const cuts = [];
  const inits = [];
  for (const config of facetsConfig) {
    const ctorArguments = config.ctorArguments !== undefined ? config.ctorArguments.map((arg) => args[arg]) : [];
    const Facet = await ethers.getContractFactory(config.name);
    const facet = await Facet.deploy(...ctorArguments);
    await facet.deployed();
    facets[config.name] = facet;
    cuts.push([facet.address, FacetCutAction.Add, getSelectors(facet, methodsFilter)]);
    if (config.init !== undefined) {
      const initArguments = config.init.arguments !== undefined ? config.init.arguments.map((arg) => args[arg]) : [];
      inits.push([facet.address, facet.interface.encodeFunctionData(config.init.method, initArguments)]);
    }
  }

  return {facets, cuts, inits};
}

async function deployDiamond(facetsConfig, args, abiExtensions = [], methodsFilter = newFacetFilter, implementation = 'Diamond') {
  const facetDeployments = await deployFacets(facetsConfig, args, methodsFilter);
  const artifact = await deployments.getArtifact(implementation);
  const abi = [...artifact.abi];
  for (const facet of Object.values(facetDeployments.facets)) {
    abi.push(
      ...JSON.parse(facet.interface.format(ethers.utils.FormatTypes.json))
        .filter((el) => el.type !== 'constructor')
        .filter(methodsFilter)
    );
  }
  for (const extension of abiExtensions) {
    const extensionArtifact = await deployments.getArtifact(extension);
    abi.push(...extensionArtifact.abi.filter((el) => el.type !== 'constructor'));
  }
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
};
