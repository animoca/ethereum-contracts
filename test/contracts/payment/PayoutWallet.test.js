const {ethers} = require('hardhat');
const {expect} = require('chai');
const {constants} = ethers;
const {runBehaviorTests} = require('@animoca/ethereum-contract-helpers/src/test/run');
const {loadFixture} = require('@animoca/ethereum-contract-helpers/src/test/fixtures');
const {getDeployerAddress} = require('@animoca/ethereum-contract-helpers/src/test/accounts');
const {getForwarderRegistryAddress} = require('../../helpers/registries');

const config = {
  immutable: {name: 'PayoutWalletMock', ctorArguments: ['payoutWallet', 'forwarderRegistry'], testMsgData: true},
  diamond: {
    facets: [
      {name: 'ProxyAdminFacet', ctorArguments: ['forwarderRegistry'], init: {method: 'initProxyAdminStorage', arguments: ['initialAdmin']}},
      {name: 'DiamondCutFacet', ctorArguments: ['forwarderRegistry'], init: {method: 'initDiamondCutStorage'}},
      {
        name: 'ContractOwnershipFacet',
        ctorArguments: ['forwarderRegistry'],
        init: {method: 'initContractOwnershipStorage', arguments: ['initialOwner']},
      },
      {
        name: 'PayoutWalletFacetMock',
        ctorArguments: ['forwarderRegistry'],
        init: {method: 'initPayoutWalletStorage', arguments: ['payoutWallet'], adminProtected: true, phaseProtected: true},
        testMsgData: true,
      },
    ],
  },
  defaultArguments: {
    forwarderRegistry: getForwarderRegistryAddress,
    initialAdmin: getDeployerAddress,
    initialOwner: getDeployerAddress,
    payoutWallet: getDeployerAddress,
  },
};

runBehaviorTests('PayoutWallet', config, function (deployFn) {
  let deployer, other, payoutWallet;

  before(async function () {
    [deployer, other, payoutWallet] = await ethers.getSigners();
  });

  const fixture = async function () {
    this.contract = await deployFn({payoutWallet: payoutWallet.address});
  };

  beforeEach(async function () {
    await loadFixture(fixture, this);
  });

  describe('constructor(address payable)', function () {
    it('reverts if setting the payout wallet to the zero address', async function () {
      await expect(deployFn({payoutWallet: constants.AddressZero})).to.be.revertedWithCustomError(this.contract, 'ZeroAddressPayoutWallet');
    });

    it('sets the payout wallet', async function () {
      expect(await this.contract.payoutWallet()).to.equal(payoutWallet.address);
    });

    it('emits a PayoutWalletSet event', async function () {
      await expect(this.contract.deployTransaction.hash).to.emit(this.contract, 'PayoutWalletSet').withArgs(payoutWallet.address);
    });
  });

  describe('setPayoutWallet(address payable)', function () {
    it('reverts if not sent by the contract owner', async function () {
      await expect(this.contract.connect(other).setPayoutWallet(other.address))
        .to.be.revertedWithCustomError(this.contract, 'NotContractOwner')
        .withArgs(other.address);
    });

    it('reverts if setting the payout wallet to the zero address', async function () {
      await expect(this.contract.setPayoutWallet(constants.AddressZero)).to.be.revertedWithCustomError(this.contract, 'ZeroAddressPayoutWallet');
    });

    context('when successful', function () {
      beforeEach(async function () {
        this.receipt = await this.contract.setPayoutWallet(other.address);
      });

      it('sets the payout wallet', async function () {
        expect(await this.contract.payoutWallet()).to.equal(other.address);
      });

      it('emits a PayoutWalletSet event', async function () {
        await expect(this.receipt).to.emit(this.contract, 'PayoutWalletSet').withArgs(other.address);
      });
    });
  });
});
