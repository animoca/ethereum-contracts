const { expect } = require('chai');
const {loadFixture} = require('../../../helpers/fixtures');

describe.only('ERC721Mock', function () {
    let deployer;
    let alice;
  
    before(async function () {
      [deployer, alice] = await ethers.getSigners();
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
      it("Should not revert when calling burnFrom, and sender's balance should update", async function() {
        // Mint an NFT
        await this.contract.mint(deployer.address, 1);
        const deployerBalanceBeforeBurn = await this.contract.balanceOf(deployer.address);
        // Burn the NFT
        await this.contract.burnFrom(deployer.address, 1);
        const deployerBalanceAfterBurn = await this.contract.balanceOf(deployer.address);
        expect(deployerBalanceBeforeBurn - deployerBalanceAfterBurn).to.equal(1);
      });
      it("Should not revert when calling batchTransfer, and sender's and recipient's balance should update", async function() {
        // Mint 2 NFT
        expect((await this.contract.balanceOf(deployer.address))).to.equal(0);
        await this.contract.batchMint(deployer.address, [1,2]);
        expect((await this.contract.balanceOf(deployer.address))).to.equal(2);
      
        // batch transfer the NFTs
        await this.contract.batchTransferFrom(deployer.address, alice.address, [1,2]);
        expect((await this.contract.balanceOf(deployer.address))).to.equal(0);
        expect((await this.contract.balanceOf(alice.address))).to.equal(2);
      });
    });
});