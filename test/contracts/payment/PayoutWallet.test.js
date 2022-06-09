const {ZeroAddress} = require('../../../src/constants');
const {getDeployerAddress, getForwarderRegistryAddress, runBehaviorTests} = require('../../helpers/run');
const {loadFixture} = require('../../helpers/fixtures');

const config = {
  immutable: {name: 'PayoutWalletMock', ctorArguments: ['payoutWallet', 'forwarderRegistry'], metaTxSupport: true},
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
        metaTxSupport: true,
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
      await expect(deployFn({payoutWallet: ZeroAddress})).to.be.revertedWith('PayoutWallet: zero address');
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
      await expect(this.contract.connect(other).setPayoutWallet(other.address)).to.be.revertedWith('Ownership: not the owner');
    });

    it('reverts if setting the payout wallet to the zero address', async function () {
      await expect(this.contract.setPayoutWallet(ZeroAddress)).to.be.revertedWith('PayoutWallet: zero address');
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
