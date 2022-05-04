const {loadFixture} = require('../../../../helpers/fixtures');
const { expect } = require('chai');
const { ZeroAddress } = require('../../../../../src/constants');

  function shouldBehaveLikeERC721Standard(implementation) {
  
    const { deploy, revertMessages } = implementation;
  
    describe('like an ERC721 Standard', function () {
      let accounts, deployer, owner, recipient, spender, maxSpender;
    
      before(async function () {
        accounts = await ethers.getSigners();
        [deployer, owner, other, spender, maxSpender] = accounts;
      });

      const nft1 = 1;
      const nft2 = 2;
      const nft3 = 3;
      const nft4 = 4;
      const nft5 = 5;
  
      const fixture = async function () {
        this.token = await deploy(implementation.name, implementation.symbol, implementation.tokenURI);
        await this.token.mint(owner.address, nft1);
        await this.token.mint(owner.address, nft2);
        await this.token.mint(owner.address, nft3);
        await this.token.mint(owner.address, nft4);
        await this.token.mint(owner.address, nft5);

        this.nftBalance = await this.token.balanceOf(owner.address);
        console.log(this.nftBalance)
      };
  
      beforeEach(async function () {
        await loadFixture(fixture, this);
      });
  
      describe('balanceOf(address)', function () {
        
        context('when the given address owns some tokens', function () {
          it("returns the amount of tokens owned by the given address", async function () {
            expect(await this.token.balanceOf(owner.address)).to.equal(5);
          });
        });

        context('when the given address does not own any tokens', function () {
          it('returns 0', async function () {
            expect(await this.token.balanceOf(other.address)).to.equal(0);
          });
        });

        context('when querying the zero address', function () {
          it('throws', async function () {
            await expect(this.token.balanceOf(ZeroAddress)).to.be.revertedWith(revertMessages.ZeroAddress);
          });
        });

      });

    });
}

module.exports = {
  shouldBehaveLikeERC721Standard,
};