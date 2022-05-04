const {loadFixture} = require('../../../../helpers/fixtures');
const { expect } = require('chai');

  function shouldBehaveLikeERC721Standard(implementation) {
  
    const { deploy } = implementation;
  
    describe('like an ERC721 Standard', function () {
      let accounts, deployer, owner, recipient, spender, maxSpender;
    
      before(async function () {
        accounts = await ethers.getSigners();
        [deployer, owner, recipient, spender, maxSpender] = accounts;
      });
  
      const fixture = async function () {
        this.contract = await deploy(implementation.name, implementation.symbol, implementation.tokenURI);
      };
  
      beforeEach(async function () {
        await loadFixture(fixture, this);
      });
  
      describe('balanceOf(address)', function () {
        it('returns zero for an account without balance', async function () {
          let balance = await this.contract.balanceOf(spender.address);
          expect(balance).to.equal(0);
        });
      });
    });
}

module.exports = {
  shouldBehaveLikeERC721Standard,
};