const {ethers} = require('hardhat');
const {expect} = require('chai');
const {getDeployerAddress, getForwarderRegistryAddress, runBehaviorTests} = require('../../helpers/run');
const {loadFixture} = require('../../helpers/fixtures');
const {deployContract} = require('../../helpers/contract');

const config = {
  immutable: {name: 'TokenRecoveryMock', ctorArguments: ['forwarderRegistry'], metaTxSupport: true},
  diamond: {
    facets: [
      {name: 'ProxyAdminFacet', ctorArguments: ['forwarderRegistry'], init: {method: 'initProxyAdminStorage', arguments: ['initialAdmin']}},
      {name: 'DiamondCutFacet', ctorArguments: ['forwarderRegistry'], init: {method: 'initDiamondCutStorage'}},
      {
        name: 'ContractOwnershipFacet',
        ctorArguments: ['forwarderRegistry'],
        init: {method: 'initContractOwnershipStorage', arguments: ['initialOwner']},
      },
      {name: 'TokenRecoveryFacetMock', ctorArguments: ['forwarderRegistry'], metaTxSupport: true},
    ],
  },
  defaultArguments: {
    forwarderRegistry: getForwarderRegistryAddress,
    initialAdmin: getDeployerAddress,
    initialOwner: getDeployerAddress,
  },
};

runBehaviorTests('TokenRecovery', config, function (deployFn) {
  let deployer, other;

  before(async function () {
    [deployer, other] = await ethers.getSigners();
  });

  const fixture = async function () {
    this.contract = await deployFn();
    await deployer.sendTransaction({to: this.contract.address, value: ethers.BigNumber.from('1000')});
    const forwarderRegistryAddress = await getForwarderRegistryAddress();
    this.erc20 = await deployContract('ERC20Mock', [this.contract.address], ['1000'], '', '', '1', '', forwarderRegistryAddress);
    this.erc721 = await deployContract('ERC721Mock', '', '', '', forwarderRegistryAddress);
    await this.erc721.grantRole(await this.erc721.MINTER_ROLE(), deployer.address);
    await this.erc721.mint(this.contract.address, 0);
    await this.erc721.mint(this.contract.address, 1);
    await this.erc721.mint(this.contract.address, 2);
  };

  beforeEach(async function () {
    await loadFixture(fixture, this);
  });

  describe('recoverETH(address[],uint256[])', function () {
    it('reverts if not called by the contract owner', async function () {
      await expect(this.contract.connect(other).recoverETH([], [])).to.be.revertedWith('Ownership: not the owner');
    });

    it('reverts with inconsistent arrays', async function () {
      await expect(this.contract.recoverETH([deployer.address], [])).to.be.revertedWith('Recovery: inconsistent arrays');
      await expect(this.contract.recoverETH([], ['1'])).to.be.revertedWith('Recovery: inconsistent arrays');
    });

    it('reverts with an amount above the contract balance', async function () {
      await expect(this.contract.recoverETH([deployer.address], ['1001'])).to.be.revertedWith('Address: insufficient balance');
    });

    context('when successful', function () {
      beforeEach(async function () {
        this.recipients = [deployer.address, other.address, other.address];
        this.values = ['1', '10', '100'];
        this.receipt = await this.contract.recoverETH(this.recipients, this.values);
      });

      it('transfers the tokens to the destination wallets', async function () {
        expect(await ethers.provider.getBalance(this.contract.address)).to.equal('889');
      });
    });
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
        this.tokens = [0, 1, 2];
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
