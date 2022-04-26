const { expect } = require('chai');
const {loadFixture} = require('../../../helpers/fixtures');

describe.only('ERC721SimpleMock', function () {
    let deployer;
  
    before(async function () {
      [deployer] = await ethers.getSigners();
    });

    const fixture = async function () {
      const ERC721SimpleMock = await ethers.getContractFactory('ERC721SimpleMock');
      const name = "Mock Token";
      const symbol = "MOCK";
      const baseTokenURI = "https://placeholder.com/"
      this.contract = await ERC721SimpleMock.deploy(name, symbol, baseTokenURI);
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
    });

});