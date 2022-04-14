const {getDeployerAddress, getForwarderRegistryAddress, runBehaviorTests} = require('../../helpers/run');
const {deployForwarderRegistry} = require('../../helpers/metatx');
const {loadFixture} = require('../../helpers/fixtures');

const config = {
  immutable: {name: 'RecoverableMock', ctorArguments: ['forwarderRegistry'], metaTxSupport: true},
  diamond: {
    facets: [
      {name: 'ProxyAdminFacetMock', init: {method: 'initProxyAdminStorage', arguments: ['initialAdmin']}},
      {name: 'DiamondCutFacet', init: {method: 'initDiamondCutStorage'}},
      {name: 'OwnableFacet', ctorArguments: ['forwarderRegistry'], init: {method: 'initOwnershipStorage', arguments: ['initialOwner']}},
      {name: 'RecoverableFacetMock', ctorArguments: ['forwarderRegistry'], metaTxSupport: true},
    ],
  },
  defaultArguments: {
    forwarderRegistry: getForwarderRegistryAddress,
    initialAdmin: getDeployerAddress,
    initialOwner: getDeployerAddress,
  },
};

runBehaviorTests('Recoverable', config, function (deployFn) {
  let deployer, other;

  before(async function () {
    [deployer, other] = await ethers.getSigners();
  });

  const fixture = async function () {
    this.contract = await deployFn();
    const forwarderRegistry = await deployForwarderRegistry();
    const ERC20 = await ethers.getContractFactory('ERC20Mock');
    this.erc20 = await ERC20.deploy([this.contract.address], ['1000'], '', '', '1', '', forwarderRegistry.address);
    await this.erc20.deployed();
    const ERC721 = await ethers.getContractFactory('ERC721PresetMinterPauserAutoId');
    this.erc721 = await ERC721.deploy('test', 'test', 'test');
    await this.erc721.deployed();
    await this.erc721.mint(this.contract.address); // tokenId 0
    await this.erc721.mint(this.contract.address); // tokenId 1
    await this.erc721.mint(this.contract.address); // tokenId 2
  };

  beforeEach(async function () {
    await loadFixture(fixture, this);
  });

  describe('recoverERC20s(address[],address[],uint256[])', function () {
    it('reverts if not called by the contract owner', async function () {
      await expect(this.contract.connect(other).recoverERC20s([], [], [])).to.be.revertedWith('Ownership: not the owner');
    });

    it('reverts with inconsistent arrays', async function () {
      await expect(this.contract.recoverERC20s([deployer.address], [], [])).to.be.revertedWith('Recovery: inconsistent arrays');
      await expect(this.contract.recoverERC20s([], [this.erc20.address], [])).to.be.revertedWith('Recovery: inconsistent arrays');
      await expect(this.contract.recoverERC20s([], [], ['1'])).to.be.revertedWith('Recovery: inconsistent arrays');
    });

    context('when successful', function () {
      beforeEach(async function () {
        this.recipients = [deployer.address, other.address, other.address];
        this.contracts = [this.erc20.address, this.erc20.address, this.erc20.address];
        this.values = ['1', '10', '100'];
        this.receipt = await this.contract.recoverERC20s(this.recipients, this.contracts, this.values);
      });

      it('transfers the tokens to the destination wallets', async function () {
        for (let i = 0; i < this.recipients.length; i++) {
          await expect(this.receipt).to.emit(this.erc20, 'Transfer').withArgs(this.contract.address, this.recipients[i], this.values[i]);
        }
      });
    });
  });

  describe('recoverERC721s(address[],address[],uint256[])', function () {
    it('reverts if not called by the contract owner', async function () {
      await expect(this.contract.connect(other).recoverERC721s([], [], [])).to.be.revertedWith('Ownership: not the owner');
    });

    it('reverts with inconsistent arrays', async function () {
      await expect(this.contract.recoverERC721s([deployer.address], [], [])).to.be.revertedWith('Recovery: inconsistent arrays');
      await expect(this.contract.recoverERC721s([], [this.erc721.address], [])).to.be.revertedWith('Recovery: inconsistent arrays');
      await expect(this.contract.recoverERC721s([], [], ['1'])).to.be.revertedWith('Recovery: inconsistent arrays');
    });

    context('when successful', function () {
      beforeEach(async function () {
        this.recipients = [deployer.address, other.address, other.address];
        this.contracts = [this.erc721.address, this.erc721.address, this.erc721.address];
        this.tokens = ['0', '1', '2'];
        this.receipt = await this.contract.recoverERC721s(this.recipients, this.contracts, this.tokens);
      });

      it('transfers the tokens to the destination wallets', async function () {
        for (let i = 0; i < this.recipients.length; i++) {
          await expect(this.receipt).to.emit(this.erc721, 'Transfer').withArgs(this.contract.address, this.recipients[i], this.tokens[i]);
        }
      });
    });
  });
});
