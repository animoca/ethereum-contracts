const {ethers} = require('hardhat');
const {expect} = require('chai');
const {expectRevert} = require('@animoca/ethereum-contract-helpers/src/test/revert');
const {loadFixture} = require('@animoca/ethereum-contract-helpers/src/test/fixtures');
const {deployContract} = require('@animoca/ethereum-contract-helpers/src/test/deploy');
const {supportsInterfaces} = require('../../../introspection/behaviors/SupportsInterface.behavior');

function behavesLikeERC1155Deliverable({errors, interfaces, deploy}) {
  let accounts, deployer, owner;

  before(async function () {
    accounts = await ethers.getSigners();
    [deployer, owner] = accounts;
  });

  const token1 = {id: 1n, supply: 10n};
  const token2 = {id: 2n, supply: 11n};
  const token3 = {id: 3n, supply: 12n};

  describe('like an ERC1155 Deliverable', function () {
    const fixture = async function () {
      this.token = await deploy(deployer);
      this.receiver1155 = await deployContract('ERC1155TokenReceiverMock', true, this.token.getAddress());
      this.refusingReceiver1155 = await deployContract('ERC1155TokenReceiverMock', false, this.token.getAddress());
      this.revertingReceiver1155 = await deployContract('ERC1155TokenReceiverMock', true, ethers.ZeroAddress);
    };

    beforeEach(async function () {
      await loadFixture(fixture, this);
    });

    const mintWasSuccessful = function (tokenIds, values, data, isERC1155Receiver) {
      const tokens = tokenIds.map((id, i) => [id, values[i]]);

      if (tokens.length != 0) {
        it('increases the recipient balance(s)', async function () {
          const to = this.recipients[0];
          for (const [id, value] of tokens) {
            expect(await this.token.balanceOf(to, id)).to.equal(value);
          }
        });
      }

      it('emits TransferSingle event(s)', async function () {
        const to = this.recipients[0];
        for (const [id, value] of tokens) {
          await expect(this.receipt).to.emit(this.token, 'TransferSingle').withArgs(deployer.address, ethers.ZeroAddress, to, id, value);
        }
      });

      if (isERC1155Receiver) {
        it('should call onERC1155Received', async function () {
          for (const [id, value] of tokens) {
            await expect(this.receipt).to.emit(this.receiver1155, 'ERC1155Received').withArgs(deployer.address, ethers.ZeroAddress, id, value, data);
          }
        });
      }
    };

    const mintsByRecipient = function (mintFunction, ids, values, data) {
      context('when sent to a wallet', function () {
        beforeEach(async function () {
          this.recipients = ids.map(() => owner.address);
          this.receipt = await mintFunction.call(this, ids, values, data, deployer);
        });
        mintWasSuccessful(ids, values, data, false);
      });

      context('when sent to an ERC1155TokenReceiver contract', function () {
        beforeEach(async function () {
          const receiverAddress = await this.receiver1155.getAddress();
          this.recipients = ids.map(() => receiverAddress);
          this.receipt = await mintFunction.call(this, ids, values, data, deployer);
        });
        mintWasSuccessful(ids, values, data, true);
      });
    };

    describe('safeDeliver(address[],uint256[],uint256[],bytes)', function () {
      const mintFn = async function (ids, values, data, sender) {
        return this.token.connect(sender).safeDeliver(this.recipients, ids, values, data);
      };

      it('reverts with inconsistent arrays', async function () {
        this.recipients = [owner.address];
        await expectRevert(mintFn.call(this, [], [1n], '0x42', deployer), this.token, errors.InconsistentArrayLengths);
        await expectRevert(mintFn.call(this, [token1.id], [], '0x42', deployer), this.token, errors.InconsistentArrayLengths);
      });

      it('reverts if the sender is not a Minter', async function () {
        this.recipients = [owner.address];
        await expectRevert(mintFn.call(this, [token1.id], [1n], '0x42', owner), this.token, errors.NotMinter, {
          role: await this.token.MINTER_ROLE(),
          account: owner.address,
        });
      });

      it('reverts if transferred to the zero address', async function () {
        this.recipients = [ethers.ZeroAddress];
        await expectRevert(mintFn.call(this, [token1.id], [1n], '0x42', deployer), this.token, errors.MintToAddressZero);
      });

      it('reverts if a token has an overflowing balance', async function () {
        this.recipients = [owner.address];
        await mintFn.call(this, [token1.id], [ethers.MaxUint256], '0x42', deployer);
        await expectRevert(mintFn.call(this, [token1.id], [1n], '0x42', deployer), this.token, errors.BalanceOverflow, {
          recipient: owner.address,
          id: token1.id,
          balance: ethers.MaxUint256,
          value: 1,
        });
      });

      it('reverts when sent to a non-receiver contract', async function () {
        this.recipients = [await this.token.getAddress()];
        await expect(mintFn.call(this, [token1.id], [1n], '0x42', deployer)).to.be.reverted;
      });

      it('reverts when sent to an ERC1155TokenReceiver which refuses the transfer', async function () {
        this.recipients = [await this.refusingReceiver1155.getAddress()];
        await expectRevert(mintFn.call(this, [token1.id], [1n], '0x42', deployer), this.token, errors.SafeTransferRejected, {
          recipient: await this.refusingReceiver1155.getAddress(),
          id: token1.id,
          value: 1n,
        });
      });

      it('reverts when sent to an ERC1155TokenReceiver which reverts', async function () {
        this.recipients = [await this.revertingReceiver1155.getAddress()];
        await expect(mintFn.call(this, [token1.id], [1n], '0x42', deployer)).to.be.reverted;
      });

      context('with an empty list of tokens', function () {
        mintsByRecipient(mintFn, [], [], '0x42');
      });

      context('single minting (zero value)', function () {
        mintsByRecipient(mintFn, [token1.id], [0], '0x42');
      });

      context('single minting', function () {
        mintsByRecipient(mintFn, [token1.id], [token1.supply], '0x42');
      });

      context('multiple tokens transfer', function () {
        mintsByRecipient(mintFn, [token1.id, token2.id, token3.id], [token1.supply, 0, token3.supply], '0x42');
      });
    });

    if (interfaces && interfaces.ERC1155Deliverable) {
      supportsInterfaces(['IERC1155Deliverable']);
    }
  });
}

module.exports = {
  behavesLikeERC1155Deliverable,
};
