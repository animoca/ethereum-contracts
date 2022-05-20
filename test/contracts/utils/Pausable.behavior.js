const { loadFixture } = require('../../helpers/fixtures');
const { expect } = require('chai');
const { ethers } = require('hardhat');

function shouldBehaveLikePausableContract(implementation) {

    const { deploy, revertMessages } = implementation;

    describe('like a Pausable Contract', function() {
        let accounts, pauser, other;

        before(async function() {
            accounts = await ethers.getSigners();
            [pauser, other] = accounts;
        });

        const fixture = async function() {
            this.pausable = await deploy(implementation.name, implementation.symbol, implementation.tokenURI, pauser);
        };

        beforeEach(async function() {
            await loadFixture(fixture, this);
        });

        describe('pause()', function() {
            it('reverts when already paused', async function() {
                await this.pausable.pause();
                await expect(this.pausable.pause()).to.be.revertedWith(revertMessages.AlreadyPaused);
            });

            it('reverts if paused by an unauthorized account', async function() {
                await expect(this.pausable.connect(other).pause()).to.be.revertedWith(revertMessages.NotPauser);
            });

            context('when successful', function() {
                beforeEach(async function() {
                    this.receipt = await this.pausable.pause();
                });
                it('pauses the contract', async function() {
                    expect(await this.pausable.paused()).to.equal(true);
                });
                it('emits a Paused event', async function() {
                    await expect(this.receipt).to.emit(this.pausable, 'Paused');
                });
            });
        });

        describe('unpause()', function() {
            beforeEach(async function() {
                await this.pausable.pause();
            });

            it('reverts when already unpaused', async function() {
                await this.pausable.unpause();
                await expect(this.pausable.unpause()).to.be.revertedWith(revertMessages.AlreadyUnpaused);
            });

            it('reverts if unpaused by an unauthorized account', async function() {
                await expect(this.pausable.connect(other).unpause()).to.be.revertedWith(revertMessages.NotPauser);
            });

            context('when successful', function() {
                beforeEach(async function() {
                    this.receipt = await this.pausable.unpause();
                });

                it('unpauses the contract', async function() {
                    expect(await this.pausable.paused()).to.equal(false);
                });

                it('emits an Unpaused event', async function() {
                    await expect(this.receipt).to.emit(this.pausable, 'Unpaused');
                });
            });
        });
    });


}

module.exports = {
    shouldBehaveLikePausableContract
};