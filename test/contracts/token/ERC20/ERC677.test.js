const {ethers} = require('hardhat');
const {loadFixture} = require('@animoca/ethereum-contract-helpers/src/test/fixtures');
const {runBehaviorTests} = require('@animoca/ethereum-contract-helpers/src/test/run');
const {getDeployerAddress} = require('@animoca/ethereum-contract-helpers/src/test/accounts');
const {getForwarderRegistryAddress} = require('../../../helpers/registries');
// const {behavesLikeERC20} = require('./behaviors/ERC20.behavior');

const name = 'ERC677 Mock';
const symbol = 'E577';
const decimals = ethers.BigNumber.from('18');
const tokenURI = 'uri';

const config = {
  immutable: {
    name: 'ERC677Mock',
    ctorArguments: ['name', 'symbol', 'decimals', 'initialHolders', 'initialBalances', 'forwarderRegistry'],
  },
  defaultArguments: {
    forwarderRegistry: getForwarderRegistryAddress,
    initialOwner: getDeployerAddress,
    initialHolders: [],
    initialBalances: [],
    name,
    symbol,
    decimals,
  },
};

runBehaviorTests('ERC677', config, function (deployFn) {
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
    },
    deploy: async function (initialHolders, initialBalances, deployer) {
      const contract = await deployFn({name, symbol, decimals, initialHolders, initialBalances});
      return contract;
    },
  };

  let deployer;

  before(async function () {
    [deployer] = await ethers.getSigners();
  });

  const fixture = async function () {
    this.contract = await implementation.deploy([deployer.address], ['1000000'], deployer);
  };

  beforeEach(async function () {
    await loadFixture(fixture, this);
  });

  context('transferAndCall(address,uint256,bytes)', function () {
    it('it does not revert when the recipient is not a contract', async function () {
      await this.contract.transferAndCall(deployer.address, 1, '0x');
    });
  });

  // behavesLikeERC20(implementation);
});
