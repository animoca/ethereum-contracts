const {expectEvent, expectRevert} = require('@openzeppelin/test-helpers');
const {ZeroAddress} = require('../../../src/constants');

const {runBehaviorTests} = require('../../utils/run');
const {createFixtureLoader} = require('../../utils/fixture');
const fixtureLoader = createFixtureLoader();

const [deployer, other, payoutWallet] = require('../../.accounts');

const config = {
  immutable: {name: 'PayoutWalletMock', ctorArguments: ['payoutWallet']},
  diamond: {
    facetDependencies: [
      {
        name: 'ProxyAdminFacet',
        initMethod: 'initProxyAdminStorage',
        initArguments: ['initialAdmin'],
      },
      {name: 'DiamondCutFacet', initMethod: 'initDiamondCutStorage'},
      {
        name: 'OwnableFacet',
        initMethod: 'initOwnershipStorage',
        initArguments: ['initialOwner'],
      },
    ],
    mainFacet: {
      name: 'PayoutWalletFacet',
      initMethod: 'initPayoutWalletStorage',
      initArguments: ['payoutWallet'],
    },
  },
  defaultArguments: {
    initialAdmin: deployer,
    initialOwner: deployer,
    payoutWallet: deployer,
  },
  abiExtensions: ['LibPayoutWallet'],
};

runBehaviorTests('PayoutWallet', config, function (deployFn) {
  const fixture = async function () {
    const deployment = await deployFn({payoutWallet}, deployer);
    this.contract = deployment.contract;
    this.tx = deployment.tx;
  };

  beforeEach(async function () {
    await fixtureLoader(fixture, this);
  });

  describe('constructor(address payable)', function () {
    it('reverts if setting the payout wallet to the zero address', async function () {
      await expectRevert(deployFn({payoutWallet: ZeroAddress}, deployer), 'PayoutWallet: zero address');
    });

    it('sets the payout wallet', async function () {
      (await this.contract.payoutWallet()).should.be.equal(payoutWallet);
    });

    it('emits a PayoutWalletSet event', async function () {
      await expectEvent.inTransaction(this.tx, this.contract, 'PayoutWalletSet', {payoutWallet});
    });
  });

  describe('setPayoutWallet(address payable)', function () {
    it('reverts if not sent by the contract owner', async function () {
      await expectRevert(this.contract.setPayoutWallet(other, {from: other}), 'Ownership: not the owner');
    });

    it('reverts if setting the payout wallet to the zero address', async function () {
      await expectRevert(this.contract.setPayoutWallet(ZeroAddress, {from: deployer}), 'PayoutWallet: zero address');
    });

    context('when successful', function () {
      beforeEach(async function () {
        this.receipt = await this.contract.setPayoutWallet(other, {
          from: deployer,
        });
      });

      it('sets the payout wallet', async function () {
        (await this.contract.payoutWallet()).should.be.equal(other);
      });

      it('emits a PayoutWalletSet event', async function () {
        expectEvent(this.receipt, 'PayoutWalletSet', {payoutWallet: other});
      });
    });
  });
});
