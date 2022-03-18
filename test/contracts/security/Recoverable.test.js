const {expectEvent, expectRevert} = require('@openzeppelin/test-helpers');
const {ZeroAddress} = require('../../../src/constants');

const {runBehaviorTests} = require('../../utils/run');
const {createFixtureLoader} = require('../../utils/fixture');
const fixtureLoader = createFixtureLoader();

const [deployer, other] = require('../../.accounts');

const config = {
  immutable: {name: 'RecoverableMock'},
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
      name: 'RecoverableFacet',
    },
  },
  defaultArguments: {initialAdmin: deployer, initialOwner: deployer},
};

runBehaviorTests('Recoverable', config, function (deployFn) {
  const fixture = async function () {
    const deployment = await deployFn({}, deployer);
    this.contract = deployment.contract;
    this.tx = deployment.tx;
    this.erc20 = await artifacts.require('ERC20PresetMinterPauser').new('test', 18);
    await this.erc20.mint(this.contract.address, '1000');
    this.erc721 = await artifacts.require('ERC721PresetMinterPauserAutoId').new('test', 'test', 'test');
    await this.erc721.mint(this.contract.address); // tokenId 0
    await this.erc721.mint(this.contract.address); // tokenId 1
    await this.erc721.mint(this.contract.address); // tokenId 2
  };

  beforeEach(async function () {
    await fixtureLoader(fixture, this);
  });

  describe('recoverERC20s(address[],address[],uint256[])', function () {
    it('reverts if not called by the contract owner', async function () {
      await expectRevert(this.contract.recoverERC20s([], [], [], {from: other}), 'Ownership: not the owner');
    });

    it('reverts with inconsistent arrays', async function () {
      await expectRevert(this.contract.recoverERC20s([ZeroAddress], [], [], {from: deployer}), 'Recovery: inconsistent arrays');
      await expectRevert(this.contract.recoverERC20s([], [ZeroAddress], [], {from: deployer}), 'Recovery: inconsistent arrays');
      await expectRevert(this.contract.recoverERC20s([], [], ['1'], {from: deployer}), 'Recovery: inconsistent arrays');
    });

    context('when successful', function () {
      beforeEach(async function () {
        this.recipients = [deployer, other, other];
        this.contracts = [this.erc20.address, this.erc20.address, this.erc20.address];
        this.values = ['1', '10', '100'];
        this.receipt = await this.contract.recoverERC20s(this.recipients, this.contracts, this.values, {
          from: deployer,
        });
      });

      it('transfers the tokens to the destination wallets', async function () {
        for (let i = 0; i < this.recipients.length; i++) {
          await expectEvent.inTransaction(this.receipt.tx, this.erc20, 'Transfer', {
            from: this.contract.address,
            to: this.recipients[i],
            value: this.values[i],
          });
        }
      });
    });

    describe('recoverERC721s(address[],address[],uint256[])', function () {
      it('reverts if not called by the contract owner', async function () {
        await expectRevert(this.contract.recoverERC721s([], [], [], {from: other}), 'Ownership: not the owner');
      });

      it('reverts with inconsistent arrays', async function () {
        await expectRevert(
          this.contract.recoverERC721s([ZeroAddress], [], [], {
            from: deployer,
          }),
          'Recovery: inconsistent arrays'
        );
        await expectRevert(
          this.contract.recoverERC721s([], [ZeroAddress], [], {
            from: deployer,
          }),
          'Recovery: inconsistent arrays'
        );
        await expectRevert(this.contract.recoverERC721s([], [], ['1'], {from: deployer}), 'Recovery: inconsistent arrays');
      });

      context('when successful', function () {
        beforeEach(async function () {
          this.recipients = [deployer, other, other];
          this.contracts = [this.erc721.address, this.erc721.address, this.erc721.address];
          this.tokens = ['0', '1', '2'];
          this.receipt = await this.contract.recoverERC721s(this.recipients, this.contracts, this.tokens, {
            from: deployer,
          });
        });

        it('transfers the tokens to the destination wallets', async function () {
          for (let i = 0; i < this.recipients.length; i++) {
            await expectEvent.inTransaction(this.receipt.tx, this.erc721, 'Transfer', {
              from: this.contract.address,
              to: this.recipients[i],
              tokenId: this.tokens[i],
            });
          }
        });
      });
    });
  });
});
