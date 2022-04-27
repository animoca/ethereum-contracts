const { expect } = require('chai');
const {loadFixture} = require('../../../helpers/fixtures');

describe.only('ERC721BurnableMock', function () {
    let deployer;
  
    before(async function () {
      [deployer] = await ethers.getSigners();
    });

    const fixture = async function () {
      const ERC721BurnableMock = await ethers.getContractFactory('ERC721BurnableMock');
      const name = "Burnable Mock Token";
      const symbol = "BURNABLE-MOCK";
      const baseTokenURI = "https://placeholder.com/"
      this.contract = await ERC721BurnableMock.deploy(name, symbol, baseTokenURI);
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
      it("Should not revert when calling burnFrom, and sender's balance should update", async function() {
        // Mint an NFT
        await this.contract.mint(deployer.address, 1);
        const deployerBalanceBeforeBurn = await this.contract.balanceOf(deployer.address);
        // Burn the NFT
        await this.contract.burnFrom(deployer.address, 1);
        const deployerBalanceAfterBurn = await this.contract.balanceOf(deployer.address);
        expect(deployerBalanceBeforeBurn - deployerBalanceAfterBurn).to.equal(1);
      });
    });

});