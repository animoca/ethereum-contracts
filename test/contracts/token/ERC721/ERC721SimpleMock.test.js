const { expect } = require('chai');
const { loadFixture } = require('../../../helpers/fixtures');

describe('ERC721SimpleMock', function() {
    let deployer;

    before(async function() {
        [deployer] = await ethers.getSigners();
    });

    const fixture = async function() {
        const ERC721SimpleMock = await ethers.getContractFactory('ERC721SimpleMock');
        this.contract = await ERC721SimpleMock.deploy();
        await this.contract.deployed();
    };

    beforeEach(async function() {
        await loadFixture(fixture, this);
    });

    context('with a simple ERC721 implementation not extending any optional interface', function() {
        it('should not revert when calling balanceOf, and balance should equal zero', async function() {
            const balance = await this.contract.balanceOf(deployer.address);
            expect(balance).to.equal(0);
        });
    });

});