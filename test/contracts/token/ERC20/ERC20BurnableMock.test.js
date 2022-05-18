const {behavesLikeERC20} = require('./behaviors/ERC20.behavior');
const {getDeployerAddress, getForwarderRegistryAddress, runBehaviorTests} = require('../../../helpers/run');

const name = 'ERC20 Mock';
const symbol = 'E20';
const decimals = ethers.BigNumber.from('18');
const tokenURI = 'uri';

const config = {
  immutable: {
    name: 'ERC20BurnableMock',
    ctorArguments: ['initialHolders', 'initialBalances', 'name', 'symbol', 'decimals', 'tokenURI', 'forwarderRegistry'],
    metaTxSupport: true,
  },
  diamond: {
    facets: [
      {name: 'ProxyAdminFacetMock', ctorArguments: ['forwarderRegistry'], init: {method: 'initProxyAdminStorage', arguments: ['initialAdmin']}},
      {name: 'DiamondCutFacet', ctorArguments: ['forwarderRegistry'], init: {method: 'initDiamondCutStorage'}},
      {name: 'ERC165Facet', ctorArguments: ['forwarderRegistry'], init: {method: 'initInterfaceDetectionStorage'}},
      {name: 'OwnableFacet', ctorArguments: ['forwarderRegistry'], init: {method: 'initOwnershipStorage', arguments: ['initialOwner']}},
      {name: 'AccessControlFacet', ctorArguments: ['forwarderRegistry']},
      {
        name: 'ERC20FacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {method: 'initERC20Storage', arguments: ['initialHolders', 'initialBalances'], adminProtected: true, versionProtected: true},
        metaTxSupport: true,
      },
      {
        name: 'ERC20DetailedFacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {method: 'initERC20DetailedStorage', arguments: ['name', 'symbol', 'decimals'], adminProtected: true, versionProtected: true},
        metaTxSupport: true,
      },
      {
        name: 'ERC20MetadataFacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {method: 'initERC20MetadataStorage', arguments: ['tokenURI'], adminProtected: true, versionProtected: true},
        metaTxSupport: true,
      },
      {
        name: 'ERC20PermitFacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {method: 'initERC20PermitStorage', adminProtected: true, versionProtected: true},
        metaTxSupport: true,
      },
      {
        name: 'ERC20BatchTransfersFacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {method: 'initERC20BatchTransfersStorage', adminProtected: true},
        metaTxSupport: true,
      },
      {
        name: 'ERC20SafeTransfersFacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {method: 'initERC20SafeTransfersStorage', adminProtected: true},
        metaTxSupport: true,
      },
      {
        name: 'ERC20MintableFacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {method: 'initERC20MintableStorage', adminProtected: true},
        metaTxSupport: true,
      },
      {
        name: 'ERC20BurnableFacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {method: 'initERC20BurnableStorage', adminProtected: true},
        metaTxSupport: true,
      },
    ],
  },
  defaultArguments: {
    forwarderRegistry: getForwarderRegistryAddress,
    initialAdmin: getDeployerAddress,
    initialOwner: getDeployerAddress,
    initialHolders: [],
    initialBalances: [],
    name,
    symbol,
    decimals,
    tokenURI,
  },
};

runBehaviorTests('ERC20 Burnable', config, function (deployFn) {
  const implementation = {
    name,
    symbol,
    decimals,
    tokenURI,
    revertMessages: {
      // ERC20
      ApproveToZero: 'ERC20: zero address spender',
      TransferExceedsBalance: 'ERC20: insufficient balance',
      TransferToZero: 'ERC20: to zero address',
      TransferExceedsAllowance: 'ERC20: insufficient allowance',
      TransferFromZero: 'ERC20: insufficient balance',
      InconsistentArrays: 'ERC20: inconsistent arrays',
      SupplyOverflow: 'ERC20: supply overflow',

      // ERC20Allowance
      AllowanceUnderflow: 'ERC20: insufficient allowance',
      AllowanceOverflow: 'ERC20: allowance overflow',

      // ERC20BatchTransfers
      BatchTransferValuesOverflow: 'ERC20: values overflow',
      BatchTransferFromZero: 'ERC20: insufficient balance',

      // ERC20SafeTransfers
      TransferRefused: 'ERC20: transfer refused',

      // ERC2612
      PermitFromZero: 'ERC20: zero address owner',
      PermitExpired: 'ERC20: expired permit',
      PermitInvalid: 'ERC20: invalid permit',

      // ERC20Mintable
      MintToZero: 'ERC20: mint to zero',
      BatchMintValuesOverflow: 'ERC20: values overflow',

      // ERC20Burnable
      BurnExceedsBalance: 'ERC20: insufficient balance',
      BurnExceedsAllowance: 'ERC20: insufficient allowance',
      BatchBurnValuesOverflow: 'ERC20: insufficient balance',

      // Admin
      NotMinter: "AccessControl: missing 'minter' role",
      NotContractOwner: 'Ownership: not the owner',
    },
    features: {
      ERC165: true,
      EIP717: true, // unlimited approval
      AllowanceTracking: true,
    },
    interfaces: {
      ERC20: true,
      ERC20Detailed: true,
      ERC20Metadata: true,
      ERC20Allowance: true,
      ERC20BatchTransfer: true,
      ERC20Safe: true,
      ERC20Permit: true,
      ERC20Burnable: true,
      ERC20Mintable: true,
    },
    methods: {
      // ERC20Burnable
      'burn(uint256)': async (contract, value) => {
        return contract.burn(value);
      },
      'burnFrom(address,uint256)': async (contract, from, value) => {
        return contract.burnFrom(from, value);
      },
      'batchBurnFrom(address[],uint256[])': async (contract, owners, values) => {
        return contract.batchBurnFrom(owners, values);
      },

      // ERC20Mintable
      'mint(address,uint256)': async (contract, account, value) => {
        return contract.mint(account, value);
      },
      'batchMint(address[],uint256[])': async (contract, accounts, values) => {
        return contract.batchMint(accounts, values);
      },
    },
    deploy: async function (initialHolders, initialBalances, deployer) {
      const contract = await deployFn({initialHolders, initialBalances, name, symbol, decimals, tokenURI});
      await contract.grantRole(await contract.MINTER_ROLE(), deployer.address);
      return contract;
    },
  };

  let deployer;

  before(async function () {
    [deployer] = await ethers.getSigners();
  });

  context('constructor', function () {
    it('it reverts with inconsistent arrays', async function () {
      await expect(implementation.deploy([], ['1'], deployer)).to.be.revertedWith(implementation.revertMessages.InconsistentArrays);
      await expect(implementation.deploy([deployer.address], [], deployer)).to.be.revertedWith(implementation.revertMessages.InconsistentArrays);
    });
  });

  behavesLikeERC20(implementation);
});
