const { expect } = require('chai');
const { loadFixture } = require('../../../helpers/fixtures');

describe('ERC721MintableOnceMock', function() {
    let deployer;

    before(async function() {
        [deployer] = await ethers.getSigners();
    });

    const fixture = async function() {
        const ERC721MintableOnceMock = await ethers.getContractFactory('ERC721MintableOnceMock');
        const name = 'Mintable Once Mock Token';
        const symbol = 'MINTABLE-ONCE-MOCK';
        const baseTokenURI = 'uri';
        this.contract = await ERC721MintableOnceMock.deploy(name, symbol, baseTokenURI);
        await this.contract.deployed();
    };

    beforeEach(async function() {
        await loadFixture(fixture, this);
    });

    context('with a standard ERC721 and ERC721MintableOnce implementation', function() {
        it('should not revert when calling balanceOf, and balance should equal zero', async function() {
            const balance = await this.contract.balanceOf(deployer.address);
            expect(balance).to.equal(0);
        });
        it('Should not revert when calling mintOnce, and sender\'s balance should update', async function() {
            const deployerBalanceBeforeMint = await this.contract.balanceOf(deployer.address);
            await this.contract.mintOnce(deployer.address, 1);
            const deployerBalanceAfterMint = await this.contract.balanceOf(deployer.address);
            expect(deployerBalanceAfterMint - deployerBalanceBeforeMint).to.equal(1);
        });
        it('Should not allow to mint the same NFT twice, after burning', async function() {
            await this.contract.mintOnce(deployer.address, 1);
            await this.contract.burnFrom(deployer.address, 1);
            try {
                await this.contract.mintOnce(deployer.address, 1);
                throw 'NFT using IERC721MintableOnce is mintable again';
            } catch (e) {
                expect(e.toString()).to.include('ERC721: existing/burnt NFT');
            }
        });
    });
});