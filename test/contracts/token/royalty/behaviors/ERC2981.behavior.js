const {ethers} = require('hardhat');
const {expect} = require('chai');
const {expectRevert} = require('@animoca/ethereum-contract-helpers/src/test/revert');
const {loadFixture} = require('@animoca/ethereum-contract-helpers/src/test/fixtures');
const {supportsInterfaces} = require('../../../introspection/behaviors/SupportsInterface.behavior');

function behavesLikeERC2981({deploy, errors}) {
  describe('like an ERC2981', function () {
    let deployer, other;

    before(async function () {
      [deployer, other] = await ethers.getSigners();
    });

    const fixture = async function () {
      this.contract = await deploy(deployer);
    };

    beforeEach(async function () {
      await loadFixture(fixture, this);
    });

    describe('setRoyaltyReceiver(address)', function () {
      it('reverts when not sent by the contract owner', async function () {
        await expectRevert(this.contract.connect(other).setRoyaltyReceiver(ethers.ZeroAddress), this.contract, errors.NotContractOwner, {
          account: other.address,
        });
      });

      it('reverts when trying to set the zero address', async function () {
        await expectRevert(this.contract.setRoyaltyReceiver(ethers.ZeroAddress), this.contract, errors.IncorrectRoyaltyReceiver);
      });

      it('sets the royalty receiver to the new value', async function () {
        await this.contract.setRoyaltyReceiver(deployer.address);
        const royaltyInfo = await this.contract.royaltyInfo(0n, 0n);
        expect(royaltyInfo.receiver).to.equal(deployer.address);
      });
    });

    describe('setRoyaltyPercentage(uint256)', function () {
      it('reverts when not sent by the contract owner', async function () {
        await expectRevert(this.contract.connect(other).setRoyaltyPercentage(ethers.ZeroAddress), this.contract, errors.NotContractOwner, {
          account: other.address,
        });
      });

      it('reverts when trying to set the a percentage above 100%', async function () {
        const percentageArg = (await this.contract.ROYALTY_FEE_DENOMINATOR()) + 1n;
        await expectRevert(this.contract.setRoyaltyPercentage(percentageArg), this.contract, errors.IncorrectRoyaltyPercentage, {
          percentage: percentageArg,
        });
      });

      it('sets the royalty percentage to the new value', async function () {
        const percentage = 50n;
        const percentageArg = ((await this.contract.ROYALTY_FEE_DENOMINATOR()) * percentage) / 100n;
        await this.contract.setRoyaltyPercentage(percentageArg);
        const saleAmount = 100n;
        const royaltyInfo = await this.contract.royaltyInfo(0n, saleAmount);
        const royaltyAmount = (saleAmount * percentage) / 100n;
        expect(royaltyInfo.royaltyAmount).to.equal(royaltyAmount);
      });
    });

    describe('royaltyInfo(uint256,uint256)', function () {
      it('returns 0 before setting info', async function () {
        const royaltyInfo = await this.contract.royaltyInfo(0n, 1000000n);
        expect(royaltyInfo.receiver).to.equal(ethers.ZeroAddress);
        expect(royaltyInfo.royaltyAmount).to.equal(0n);
      });

      it('returns a correct small value', async function () {
        await this.contract.setRoyaltyReceiver(deployer.address);
        await this.contract.setRoyaltyPercentage(((await this.contract.ROYALTY_FEE_DENOMINATOR()) / 100n) * 50n);
        const royaltyInfo = await this.contract.royaltyInfo(0, 100);
        expect(royaltyInfo.receiver).to.equal(deployer.address);
        expect(royaltyInfo.royaltyAmount).to.equal(50);
      });

      it('returns a correct big value', async function () {
        const percentage = 10n;
        const percentageArg = ((await this.contract.ROYALTY_FEE_DENOMINATOR()) * percentage) / 100n;
        await this.contract.setRoyaltyPercentage(percentageArg);
        const tokenValue = 10000000n;
        const royaltyInfo = await this.contract.royaltyInfo(0n, tokenValue);
        const royaltyAmount = (tokenValue * percentage) / 100n;
        expect(royaltyInfo.royaltyAmount).to.equal(royaltyAmount);
      });
    });

    supportsInterfaces(['IERC2981']);
  });
}

module.exports = {
  behavesLikeERC2981,
};
