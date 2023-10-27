const {ethers} = require('hardhat');
const {expect} = require('chai');
const {expectRevert} = require('@animoca/ethereum-contract-helpers/src/test/revert');
const {loadFixture} = require('@animoca/ethereum-contract-helpers/src/test/fixtures');
const {supportsInterfaces} = require('../../../introspection/behaviors/SupportsInterface.behavior');
const exp = require('constants');

function behavesLikeERC20Mintable(implementation) {
  const {features, interfaces, errors, methods, deploy} = implementation;
  const {'mint(address,uint256)': mint, 'batchMint(address[],uint256[])': batchMint} = methods || {};

  describe('like an ERC20 Mintable', function () {
    let accounts, deployer, recipient1, recipient2;
    const AccountIndex = {deployer: 0, recipient1: 1, recipient2: 2};

    before(async function () {
      accounts = await ethers.getSigners();
      [deployer, recipient1, recipient2] = accounts;
    });

    const fixture = async function () {
      this.contract = await deploy([], [], deployer);
    };

    beforeEach(async function () {
      await loadFixture(fixture, this);
    });

    if (mint !== undefined) {
      describe('mint(address,uint256)', function () {
        context('Pre-conditions', function () {
          it('reverts if sent by a non-minter', async function () {
            await expectRevert(mint(this.contract.connect(recipient1), recipient1.address, 1), this.contract, errors.NotMinter, {
              role: await this.contract.MINTER_ROLE(),
              account: recipient1.address,
            });
          });

          it('reverts if minted to the zero address', async function () {
            await expectRevert(mint(this.contract, ethers.ZeroAddress, 1n), this.contract, errors.MintToAddressZero);
          });

          it('reverts if minting would overflow the total supply', async function () {
            await mint(this.contract, recipient1.address, ethers.MaxUint256);
            await expectRevert(mint(this.contract, recipient2.address, 1n), this.contract, errors.SupplyOverflow, {
              supply: ethers.MaxUint256,
              value: 1n,
            });
          });
        });

        const mintWasSuccessful = function (toIndex, value) {
          it('mints the specified amount', async function () {
            expect(await this.contract.balanceOf(accounts[toIndex].address)).to.equal(value);
          });

          it('increases the total supply', async function () {
            expect(await this.contract.totalSupply()).to.equal(value);
          });

          it('emits a Transfer event', async function () {
            await expect(this.receipt).to.emit(this.contract, 'Transfer').withArgs(ethers.ZeroAddress, accounts[toIndex].address, value);
          });
        };

        const mintsTokens = function (toIndex, value) {
          beforeEach(async function () {
            this.receipt = await mint(this.contract, accounts[toIndex].address, value);
          });
          mintWasSuccessful(toIndex, value);
        };

        context('when minting zero value', function () {
          mintsTokens(AccountIndex.recipient1, 0n);
        });

        context('when minting some tokens', function () {
          mintsTokens(AccountIndex.recipient1, 1n);
        });

        context('when minting the maximum supply', function () {
          mintsTokens(AccountIndex.recipient1, ethers.MaxUint256);
        });
      });
    }

    if (batchMint !== undefined) {
      describe('batchMint(address[],uint256[])', function () {
        context('Pre-conditions', function () {
          it('reverts if sent by a non-minter', async function () {
            await expectRevert(batchMint(this.contract.connect(recipient1), [recipient1.address], [1n]), this.contract, errors.NotMinter, {
              role: await this.contract.MINTER_ROLE(),
              account: recipient1.address,
            });
          });

          it('reverts with inconsistent arrays', async function () {
            await expectRevert(batchMint(this.contract, [recipient1.address], []), this.contract, errors.InconsistentArrayLengths);
            await expectRevert(batchMint(this.contract, [], [1n]), this.contract, errors.InconsistentArrayLengths);
          });

          it('reverts if minted to the zero address', async function () {
            await expectRevert(batchMint(this.contract, [ethers.ZeroAddress], [1n]), this.contract, errors.MintToAddressZero);
          });

          it('reverts if minting would overflow the total supply', async function () {
            await batchMint(this.contract, [recipient1.address], [ethers.MaxUint256]);
            await expectRevert(batchMint(this.contract, [recipient2.address], [1n]), this.contract, errors.SupplyOverflow, {
              supply: ethers.MaxUint256,
              value: 1,
            });
          });

          it('reverts if cumulative values overflow', async function () {
            await expectRevert(
              batchMint(this.contract, [recipient1.address, recipient2.address], [1n, ethers.MaxUint256]),
              this.contract,
              errors.BatchMintValuesOverflow
            );
          });
        });

        const mintWasSuccessful = function (recipientIndexes, values) {
          let aggregatedValues = {};
          let totalValue = 0n;
          for (let i = 0; i < recipientIndexes.length; ++i) {
            const toIndex = recipientIndexes[i];
            const value = values[i];

            it('emits a Transfer event', async function () {
              await expect(this.receipt).to.emit(this.contract, 'Transfer').withArgs(ethers.ZeroAddress, accounts[toIndex].address, value);
            });

            aggregatedValues[toIndex] = aggregatedValues[toIndex] ? aggregatedValues[toIndex] + value : value;
            totalValue = totalValue + value;
          }

          for (const toIndex of Object.keys(aggregatedValues)) {
            const value = aggregatedValues[toIndex];

            it('increases the recipient balance', async function () {
              expect(await this.contract.balanceOf(accounts[toIndex].address)).to.equal(value);
            });
          }

          it('increases the total supply', async function () {
            expect(await this.contract.totalSupply()).to.equal(totalValue);
          });
        };

        const mintsTokens = function (recipientIndexes, values) {
          beforeEach(async function () {
            this.receipt = await batchMint(
              this.contract,
              recipientIndexes.map((toIndex) => accounts[toIndex].address),
              values
            );
          });
          mintWasSuccessful(recipientIndexes, values);
        };

        context('when minting nothing', function () {
          mintsTokens([], []);
        });

        context('when minting a zero total value', function () {
          mintsTokens([AccountIndex.recipient1], [0n]);
        });

        context('when minting some tokens', function () {
          mintsTokens([AccountIndex.recipient1, AccountIndex.recipient2], [1n, 2n]);
        });

        context('when minting some tokens including zero values', function () {
          mintsTokens([AccountIndex.recipient1, AccountIndex.recipient1, AccountIndex.recipient2], [1n, 0n, 1n]);
        });

        context('when minting the maximum supply', function () {
          mintsTokens([AccountIndex.recipient1], [ethers.MaxUint256]);
        });
      });
    }

    if (features && features.ERC165 && interfaces && interfaces.ERC20Mintable) {
      supportsInterfaces(['IERC20Mintable']);
    }
  });
}

module.exports = {
  behavesLikeERC20Mintable,
};
