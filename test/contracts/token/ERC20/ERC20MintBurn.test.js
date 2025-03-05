const {runBehaviorTests} = require('@animoca/ethereum-contract-helpers/src/test/run');
const {getDeployerAddress} = require('@animoca/ethereum-contract-helpers/src/test/accounts');
const {getForwarderRegistryAddress} = require('../../../helpers/registries');
const {behavesLikeERC20} = require('./behaviors/ERC20.behavior');

const name = 'ERC20 Mock';
const symbol = 'E20';
const decimals = 18;
const tokenURI = 'uri';

const config = {
  immutable: {
    name: 'ERC20MintBurnMock',
    ctorArguments: ['name', 'symbol', 'decimals', 'forwarderRegistry'],
    testMsgData: true,
  },
  proxied: {
    name: 'ERC20MintBurnProxiedMock',
    ctorArguments: ['forwarderRegistry'],
    init: {method: 'init', arguments: ['name', 'symbol', 'decimals']},
    testMsgData: true,
  },
  diamond: {
    facets: [
      {name: 'ProxyAdminFacet', ctorArguments: ['forwarderRegistry'], init: {method: 'initProxyAdminStorage', arguments: ['initialAdmin']}},
      {name: 'DiamondCutFacet', ctorArguments: ['forwarderRegistry'], init: {method: 'initDiamondCutStorage'}},
      {name: 'InterfaceDetectionFacet'},
      {name: 'ForwarderRegistryContextFacet', ctorArguments: ['forwarderRegistry']},
      {
        name: 'ContractOwnershipFacet',
        ctorArguments: ['forwarderRegistry'],
        init: {method: 'initContractOwnershipStorage', arguments: ['initialOwner']},
      },
      {name: 'TokenRecoveryFacet', ctorArguments: ['forwarderRegistry']},
      {name: 'AccessControlFacet', ctorArguments: ['forwarderRegistry']},
      {
        name: 'ERC20FacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {method: 'initERC20Storage', adminProtected: true},
        testMsgData: true,
      },
      {
        name: 'ERC20DetailedFacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {method: 'initERC20DetailedStorage', arguments: ['name', 'symbol', 'decimals'], adminProtected: true, phaseProtected: true},
        testMsgData: true,
      },
      {
        name: 'ERC20MetadataFacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {method: 'initERC20MetadataStorage', adminProtected: true},
        testMsgData: true,
      },
      {
        name: 'ERC20PermitFacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {method: 'initERC20PermitStorage', adminProtected: true},
        testMsgData: true,
      },
      {
        name: 'ERC20BatchTransfersFacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {method: 'initERC20BatchTransfersStorage', adminProtected: true},
        testMsgData: true,
      },
      {
        name: 'ERC20SafeTransfersFacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {method: 'initERC20SafeTransfersStorage', adminProtected: true},
        testMsgData: true,
      },
      {
        name: 'ERC20MintableFacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {method: 'initERC20MintableStorage', adminProtected: true},
        testMsgData: true,
      },
      {
        name: 'ERC20BurnableFacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {method: 'initERC20BurnableStorage', adminProtected: true},
        testMsgData: true,
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

runBehaviorTests('ERC20MintBurn', config, function (deployFn) {
  const implementation = {
    name,
    symbol,
    decimals,
    tokenURI,
    errors: {
      // ERC20
      ApprovalToAddressZero: {custom: true, error: 'ERC20ApprovalToAddressZero', args: ['owner']},
      TransferToAddressZero: {custom: true, error: 'ERC20TransferToAddressZero', args: ['owner']},
      TransferExceedsBalance: {custom: true, error: 'ERC20InsufficientBalance', args: ['owner', 'balance', 'value']},
      TransferExceedsAllowance: {custom: true, error: 'ERC20InsufficientAllowance', args: ['owner', 'spender', 'allowance', 'value']},

      // ERC20Allowance
      AllowanceUnderflow: {custom: true, error: 'ERC20InsufficientAllowance', args: ['owner', 'spender', 'allowance', 'decrement']},
      AllowanceOverflow: {custom: true, error: 'ERC20AllowanceOverflow', args: ['owner', 'spender', 'allowance', 'increment']},

      // ERC20BatchTransfers
      BatchTransferValuesOverflow: {custom: true, error: 'ERC20BatchTransferValuesOverflow'},

      // ERC20SafeTransfers
      SafeTransferRejected: {custom: true, error: 'ERC20SafeTransferRejected', args: ['recipient']},

      // ERC2612
      PermitFromAddressZero: {custom: true, error: 'ERC20PermitFromAddressZero'},
      PermitExpired: {custom: true, error: 'ERC20PermitExpired', args: ['deadline']},
      PermitInvalid: {custom: true, error: 'ERC20PermitInvalidSignature'},

      // ERC20Mintable
      MintToAddressZero: {custom: true, error: 'ERC20MintToAddressZero'},
      SupplyOverflow: {custom: true, error: 'ERC20TotalSupplyOverflow', args: ['supply', 'value']},
      BatchMintValuesOverflow: {custom: true, error: 'ERC20BatchMintValuesOverflow'},

      // ERC20Burnable
      BurnExceedsBalance: {custom: true, error: 'ERC20InsufficientBalance', args: ['owner', 'balance', 'value']},
      BurnExceedsAllowance: {custom: true, error: 'ERC20InsufficientAllowance', args: ['owner', 'spender', 'allowance', 'value']},

      // Misc
      InconsistentArrayLengths: {custom: true, error: 'InconsistentArrayLengths'},
      NotMinter: {custom: true, error: 'NotRoleHolder', args: ['role', 'account']},
      NotContractOwner: {custom: true, error: 'NotContractOwner', args: ['account']},
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
      const contract = await deployFn({name, symbol, decimals});
      await contract.grantRole(await contract.MINTER_ROLE(), deployer.address);
      await contract.batchMint(initialHolders, initialBalances);
      return contract;
    },
  };

  behavesLikeERC20(implementation);
});
