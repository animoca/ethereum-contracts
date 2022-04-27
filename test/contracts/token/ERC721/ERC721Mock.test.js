const { expect } = require('chai');
const {loadFixture} = require('../../../helpers/fixtures');

describe('ERC721Mock', function () {
    let deployer;
  
    before(async function () {
      [deployer] = await ethers.getSigners();
    });

    const fixture = async function () {
      const ERC721Mock = await ethers.getContractFactory('ERC721Mock');
      const name = "Mock Token";
      const symbol = "MOCK";
      const baseTokenURI = "https://placeholder.com/"
      this.contract = await ERC721Mock.deploy(name, symbol, baseTokenURI);
      await this.contract.deployed();
      console.log("deployer: ", deployer.address);
    };

    beforeEach(async function () {
      await loadFixture(fixture, this);
    });

    context('with a standard ERC721 implementation', function () {  
      it('should not revert when calling balanceOf, and balance should equal zero', async function () {
        const balance = await this.contract.balanceOf(deployer.address);
        expect(balance).to.equal(0);
      });
      it("Should not revert when calling mint, and recipients's balance should update", async function () {
        const mintCount = 1;
        const deployerBalanceBeforeMint = await this.contract.balanceOf(deployer.address);
        await this.contract.mint(deployer.address, mintCount);
        const deployerBalanceAfterMint = await this.contract.balanceOf(deployer.address);
        expect(deployerBalanceAfterMint - deployerBalanceBeforeMint).to.equal(mintCount);
      });

      it("Should not revert when calling batchMint", async function () {
        await this.contract.batchMint(deployer.address, [2,3,4]);
      });
    });

});