const {ethers} = require('hardhat');
const {expect} = require('chai');
const {setBalance} = require('@nomicfoundation/hardhat-network-helpers');
const {deployContract} = require('@animoca/ethereum-contract-helpers/src/test/deploy');
const {runBehaviorTests} = require('@animoca/ethereum-contract-helpers/src/test/run');
const {loadFixture} = require('@animoca/ethereum-contract-helpers/src/test/fixtures');
const {getDeployerAddress} = require('@animoca/ethereum-contract-helpers/src/test/accounts');
const {getForwarderRegistryAddress} = require('../../helpers/registries');

const config = {
  immutable: {name: 'TokenRecoveryMock', ctorArguments: ['forwarderRegistry'], testMsgData: true},
  diamond: {
    facets: [
      {name: 'ProxyAdminFacet', ctorArguments: ['forwarderRegistry'], init: {method: 'initProxyAdminStorage', arguments: ['initialAdmin']}},
      {name: 'DiamondCutFacet', ctorArguments: ['forwarderRegistry'], init: {method: 'initDiamondCutStorage'}},
      {
        name: 'ContractOwnershipFacet',
        ctorArguments: ['forwarderRegistry'],
        init: {method: 'initContractOwnershipStorage', arguments: ['initialOwner']},
      },
      {name: 'TokenRecoveryFacetMock', ctorArguments: ['forwarderRegistry'], testMsgData: true},
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
    await setBalance(await this.contract.getAddress(), 1000n);
    const forwarderRegistryAddress = await getForwarderRegistryAddress();
    this.erc20 = await deployContract('ERC20MintBurn', '', '', 18, forwarderRegistryAddress);
    await this.erc20.grantRole(await this.erc20.MINTER_ROLE(), deployer.address);
    await this.erc20.batchMint([this.contract.getAddress()], [1000]);
    this.erc721 = await deployContract('ERC721Full', '', '', ethers.ZeroAddress, ethers.ZeroAddress, forwarderRegistryAddress);
    await this.erc721.grantRole(await this.erc721.MINTER_ROLE(), deployer.address);
    await this.erc721.mint(this.contract.getAddress(), 0);
    await this.erc721.mint(this.contract.getAddress(), 1);
    await this.erc721.mint(this.contract.getAddress(), 2);
  };

  beforeEach(async function () {
    await loadFixture(fixture, this);
  });

  describe('recoverETH(address[],uint256[])', function () {
    it('reverts if not called by the contract owner', async function () {
      await expect(this.contract.connect(other).recoverETH([], []))
        .to.be.revertedWithCustomError(this.contract, 'NotContractOwner')
        .withArgs(other.address);
    });

    it('reverts with inconsistent arrays', async function () {
      await expect(this.contract.recoverETH([deployer.address], [])).to.be.revertedWithCustomError(this.contract, 'InconsistentArrayLengths');
      await expect(this.contract.recoverETH([], ['1'])).to.be.revertedWithCustomError(this.contract, 'InconsistentArrayLengths');
    });

    it('reverts with an amount above the contract balance', async function () {
      await expect(this.contract.recoverETH([deployer.address], ['1001']))
        .to.be.revertedWithCustomError(this.contract, 'InsufficientBalance')
        .withArgs(1000, 1001);
    });

    context('when successful', function () {
      beforeEach(async function () {
        this.recipients = [deployer.address, other.address, other.address];
        this.values = ['1', '10', '100'];
        this.receipt = await this.contract.recoverETH(this.recipients, this.values);
      });

      it('transfers the tokens to the destination wallets', async function () {
        expect(await ethers.provider.getBalance(this.contract.getAddress())).to.equal('889');
      });
    });
  });

  describe('recoverERC20s(address[],address[],uint256[])', function () {
    it('reverts if not called by the contract owner', async function () {
      await expect(this.contract.connect(other).recoverERC20s([], [], []))
        .to.be.revertedWithCustomError(this.contract, 'NotContractOwner')
        .withArgs(other.address);
    });

    it('reverts with inconsistent arrays', async function () {
      await expect(this.contract.recoverERC20s([deployer.address], [], [])).to.be.revertedWithCustomError(this.contract, 'InconsistentArrayLengths');
      await expect(this.contract.recoverERC20s([], [this.erc20.getAddress()], [])).to.be.revertedWithCustomError(
        this.contract,
        'InconsistentArrayLengths',
      );
      await expect(this.contract.recoverERC20s([], [], ['1'])).to.be.revertedWithCustomError(this.contract, 'InconsistentArrayLengths');
    });

    context('when successful', function () {
      beforeEach(async function () {
        this.recipients = [deployer.address, other.address, other.address];
        this.contracts = [this.erc20.getAddress(), this.erc20.getAddress(), this.erc20.getAddress()];
        this.values = ['1', '10', '100'];
        this.receipt = await this.contract.recoverERC20s(this.recipients, this.contracts, this.values);
      });

      it('transfers the tokens to the destination wallets', async function () {
        for (let i = 0; i < this.recipients.length; i++) {
          await expect(this.receipt)
            .to.emit(this.erc20, 'Transfer')
            .withArgs(await this.contract.getAddress(), this.recipients[i], this.values[i]);
        }
      });
    });
  });

  describe('recoverERC721s(address[],address[],uint256[])', function () {
    it('reverts if not called by the contract owner', async function () {
      await expect(this.contract.connect(other).recoverERC721s([], [], []))
        .to.be.revertedWithCustomError(this.contract, 'NotContractOwner')
        .withArgs(other.address);
    });

    it('reverts with inconsistent arrays', async function () {
      await expect(this.contract.recoverERC721s([deployer.address], [], [])).to.be.revertedWithCustomError(this.contract, 'InconsistentArrayLengths');
      await expect(this.contract.recoverERC721s([], [this.erc721.getAddress()], [])).to.be.revertedWithCustomError(
        this.contract,
        'InconsistentArrayLengths',
      );
      await expect(this.contract.recoverERC721s([], [], ['1'])).to.be.revertedWithCustomError(this.contract, 'InconsistentArrayLengths');
    });

    it('reverts when recovering from a non-ERC721 contract', async function () {
      await expect(this.contract.recoverERC721s([deployer.address], [this.erc20.getAddress()], [1]))
        .to.be.revertedWithCustomError(this.contract, 'IncorrectTokenContractType')
        .withArgs(await this.erc20.getAddress());
    });

    context('when successful', function () {
      beforeEach(async function () {
        this.recipients = [deployer.address, other.address, other.address];
        this.contracts = [this.erc721.getAddress(), this.erc721.getAddress(), this.erc721.getAddress()];
        this.tokens = [0, 1, 2];
        this.receipt = await this.contract.recoverERC721s(this.recipients, this.contracts, this.tokens);
      });

      it('transfers the tokens to the destination wallets', async function () {
        for (let i = 0; i < this.recipients.length; i++) {
          await expect(this.receipt)
            .to.emit(this.erc721, 'Transfer')
            .withArgs(await this.contract.getAddress(), this.recipients[i], this.tokens[i]);
        }
      });
    });
  });
});
