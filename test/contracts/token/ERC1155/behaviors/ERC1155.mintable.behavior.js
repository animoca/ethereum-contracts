const {ethers} = require('hardhat');
const {expect} = require('chai');
const {expectRevert} = require('@animoca/ethereum-contract-helpers/src/test/revert');
const {loadFixture} = require('@animoca/ethereum-contract-helpers/src/test/fixtures');
const {deployContract} = require('@animoca/ethereum-contract-helpers/src/test/deploy');
const {supportsInterfaces} = require('../../../introspection/behaviors/SupportsInterface.behavior');

function behavesLikeERC1155Mintable({errors, interfaces, methods, deploy}) {
  let accounts, deployer, owner, other;

  before(async function () {
    accounts = await ethers.getSigners();
    [deployer, owner, other] = accounts;
  });

  const {'safeMint(address,uint256,uint256,bytes)': safeMint, 'safeBatchMint(address,uint256[],uint256[],bytes)': safeBatchMint} = methods || {};

  const token1 = {id: 1n, supply: 10n};
  const token2 = {id: 2n, supply: 11n};
  const token3 = {id: 3n, supply: 12n};

  describe('like an ERC1155 Mintable', function () {
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
      const ids = Array.isArray(tokenIds) ? tokenIds : [tokenIds];
      const vals = Array.isArray(values) ? values : [values];
      const tokens = ids.map((id, i) => [id, vals[i]]);

      if (tokens.length != 0) {
        it('increases the recipient balance(s)', async function () {
          for (const [id, value] of tokens) {
            expect(await this.token.balanceOf(this.to, id)).to.equal(value);
          }
        });
      }

      if (Array.isArray(tokenIds)) {
        it('emits a TransferBatch event', async function () {
          await expect(this.receipt).to.emit(this.token, 'TransferBatch').withArgs(deployer.address, ethers.ZeroAddress, this.to, tokenIds, values);
        });
      } else {
        it('emits a TransferSingle event', async function () {
          await expect(this.receipt).to.emit(this.token, 'TransferSingle').withArgs(deployer.address, ethers.ZeroAddress, this.to, tokenIds, values);
        });
      }

      if (isERC1155Receiver) {
        if (Array.isArray(tokenIds)) {
          it('should call onERC1155BatchReceived', async function () {
            await expect(this.receipt)
              .to.emit(this.receiver1155, 'ERC1155BatchReceived')
              .withArgs(deployer.address, ethers.ZeroAddress, tokenIds, values, data);
          });
        } else {
          it('should call onERC1155Received', async function () {
            await expect(this.receipt)
              .to.emit(this.receiver1155, 'ERC1155Received')
              .withArgs(deployer.address, ethers.ZeroAddress, tokenIds, values, data);
          });
        }
      }
    };

    const revertsOnPreconditions = function (mintFn, isBatch) {
      const data = '0x42';
      describe('Pre-conditions', function () {
        it('reverts if the sender is not a Minter', async function () {
          this.to = owner.address;
          await expectRevert(mintFn.call(this, token1.id, 1, data, other), this.token, errors.NotMinter, {
            role: await this.token.MINTER_ROLE(),
            account: other.address,
          });
        });

        it('reverts if transferred to the zero address', async function () {
          this.to = ethers.ZeroAddress;
          await expectRevert(mintFn.call(this, token1.id, 1, data, deployer), this.token, errors.MintToAddressZero);
        });

        it('reverts if a token has an overflowing balance', async function () {
          this.to = owner.address;
          await mintFn.call(this, token1.id, ethers.MaxUint256, data, deployer);
          await expectRevert(mintFn.call(this, token1.id, 1, data, deployer), this.token, errors.BalanceOverflow, {
            recipient: this.to,
            id: token1.id,
            balance: ethers.MaxUint256,
            value: 1,
          });
        });

        it('reverts when sent to a non-receiver contract', async function () {
          this.to = await this.token.getAddress();
          await expect(mintFn.call(this, token1.id, 1, data, deployer)).to.be.reverted;
        });

        it('reverts when sent to an ERC1155TokenReceiver which refuses the transfer', async function () {
          this.to = await this.refusingReceiver1155.getAddress();
          if (isBatch) {
            await expectRevert(mintFn.call(this, token1.id, 1, data, deployer), this.token, errors.SafeBatchTransferRejected, {
              recipient: this.to,
              ids: [token1.id],
              values: [1],
            });
          } else {
            await expectRevert(mintFn.call(this, token1.id, 1, data, deployer), this.token, errors.SafeTransferRejected, {
              recipient: this.to,
              id: token1.id,
              value: 1,
            });
          }
        });

        it('reverts when sent to an ERC1155TokenReceiver which reverts', async function () {
          this.to = await this.revertingReceiver1155.getAddress();
          await expect(mintFn.call(this, token1.id, 1, data, deployer)).to.be.reverted;
        });
      });
    };

    const mintsByRecipient = function (mintFunction, ids, values, data) {
      context('when sent to a wallet', function () {
        beforeEach(async function () {
          this.to = owner.address;
          this.receipt = await mintFunction.call(this, ids, values, data, deployer);
        });
        mintWasSuccessful(ids, values, data, false);
      });

      context('when sent to an ERC1155TokenReceiver contract', function () {
        beforeEach(async function () {
          this.to = await this.receiver1155.getAddress();
          this.receipt = await mintFunction.call(this, ids, values, data, deployer);
        });
        mintWasSuccessful(ids, values, data, true);
      });
    };

    if (safeMint !== undefined) {
      describe('safeMint(address,uint256,uint256,bytes)', function () {
        const mintFn = async function (id, value, data, sender) {
          return safeMint(this.token, this.to, id, value, data, sender);
        };

        revertsOnPreconditions(mintFn, false);

        context('with a zero value)', function () {
          mintsByRecipient(mintFn, token1.id, 0, '0x42');
        });

        context('with a non-zero value', function () {
          mintsByRecipient(mintFn, token1.id, token1.supply, '0x42');
        });
      });
    }

    if (safeBatchMint !== undefined) {
      describe('safeBatchMint(address,uint256[],uint256[],bytes)', function () {
        const mintFn = async function (ids, values, data, sender) {
          const tokenIds = Array.isArray(ids) ? ids : [ids];
          const vals = Array.isArray(values) ? values : [values];
          return safeBatchMint(this.token, this.to, tokenIds, vals, data, sender);
        };

        revertsOnPreconditions(mintFn, true);

        it('reverts with inconsistent arrays', async function () {
          this.to = owner.address;
          await expectRevert(mintFn.call(this, [token1.id, token2.id], [1], '0x42', deployer), this.token, errors.InconsistentArrayLengths);
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

        context('multiple minting', function () {
          mintsByRecipient(mintFn, [token1.id, token2.id, token3.id], [token1.supply, 0, token3.supply], '0x42');
        });
      });
    }

    if (interfaces && interfaces.ERC1155Mintable) {
      supportsInterfaces(['IERC1155Mintable']);
    }
  });
}

module.exports = {
  behavesLikeERC1155Mintable,
};
