const {ethers} = require('hardhat');
const {expect} = require('chai');
const {expectRevert} = require('@animoca/ethereum-contract-helpers/src/test/revert');
const {loadFixture} = require('@animoca/ethereum-contract-helpers/src/test/fixtures');
const {supportsInterfaces} = require('../../../introspection/behaviors/SupportsInterface.behavior');

function behavesLikeERC20Burnable(implementation) {
  const {features, interfaces, methods, errors, deploy} = implementation;
  const {'burn(uint256)': burn, 'burnFrom(address,uint256)': burnFrom, 'batchBurnFrom(address[],uint256[])': batchBurnFrom} = methods || {};

  const initialSupply = 100n;
  const initialAllowance = initialSupply - 1n;

  describe('like an ERC20 Burnable', function () {
    let accounts, deployer, owner, spender, maxSpender;
    const AccountIndex = {deployer: 0, owner: 1, spender: 2, maxSpender: 3};

    before(async function () {
      accounts = await ethers.getSigners();
      [deployer, owner, spender, maxSpender] = accounts;
    });

    const fixture = async function () {
      this.contract = (await deploy([owner.address], [initialSupply], deployer)).connect(owner);
      await this.contract.approve(spender.address, initialAllowance);
      await this.contract.approve(maxSpender.address, ethers.MaxUint256);
    };

    beforeEach(async function () {
      await loadFixture(fixture, this);
    });

    if (burn !== undefined) {
      describe('burn(uint256)', function () {
        context('Pre-conditions', function () {
          it('reverts with an insufficient balance', async function () {
            await expectRevert(burn(this.contract, initialSupply + 1n), this.contract, errors.BurnExceedsBalance, {
              owner: owner.address,
              balance: initialSupply,
              value: initialSupply + 1n,
            });
          });
        });

        const burnWasSuccessful = function (value, senderIndex) {
          it('decreases the sender balance', async function () {
            expect(await this.contract.balanceOf(accounts[senderIndex].address)).to.equal(initialSupply - value);
          });

          it('decreases the total supply', async function () {
            expect(await this.contract.totalSupply()).to.equal(initialSupply - value);
          });

          it('emits a Transfer event', async function () {
            await expect(this.receipt).to.emit(this.contract, 'Transfer').withArgs(accounts[senderIndex].address, ethers.ZeroAddress, value);
          });
        };

        const burnsTokens = function (value) {
          context('when burning tokens', function () {
            beforeEach(async function () {
              this.fromBalance = await this.contract.balanceOf(owner.address);
              this.receipt = await burn(this.contract, value);
            });
            burnWasSuccessful(value, AccountIndex.owner);
          });
        };

        context('when burning a zero value', function () {
          burnsTokens(0n);
        });

        context('when burning a non-zero value', function () {
          burnsTokens(1n);
        });

        context('when burning the full balance', function () {
          burnsTokens(initialSupply);
        });
      });
    }

    if (burnFrom !== undefined) {
      describe('burnFrom(address,uint256)', function () {
        context('Pre-conditions', function () {
          it('reverts when from is the zero address', async function () {
            await expectRevert(burnFrom(this.contract.connect(spender), ethers.ZeroAddress, 1), this.contract, errors.BurnExceedsAllowance, {
              owner: ethers.ZeroAddress,
              spender: spender.address,
              allowance: 0,
              value: 1,
            });
          });

          it('reverts with an insufficient balance', async function () {
            await this.contract.approve(spender.address, initialSupply + 1n);
            await expectRevert(
              burnFrom(this.contract.connect(spender), owner.address, initialSupply + 1n),
              this.contract,
              errors.BurnExceedsBalance,
              {
                owner: owner.address,
                balance: initialSupply,
                value: initialSupply + 1n,
              },
            );
          });

          it('reverts with an insufficient allowance', async function () {
            await expectRevert(
              burnFrom(this.contract.connect(spender), owner.address, initialAllowance + 1n),
              this.contract,
              errors.BurnExceedsAllowance,
              {
                owner: owner.address,
                spender: spender.address,
                allowance: initialAllowance,
                value: initialAllowance + 1n,
              },
            );
          });
        });

        const burnWasSuccessful = function (fromIndex, value, senderIndex, withEIP717) {
          it('decreases the owner balance', async function () {
            expect(await this.contract.balanceOf(accounts[fromIndex].address)).to.equal(initialSupply - value);
          });

          it('decreases the total supply', async function () {
            expect(await this.contract.totalSupply()).to.equal(initialSupply - value);
          });

          it('emits a Transfer event', async function () {
            await expect(this.receipt).to.emit(this.contract, 'Transfer').withArgs(accounts[fromIndex].address, ethers.ZeroAddress, value);
          });

          if (fromIndex != senderIndex) {
            if (withEIP717) {
              it('[EIP717] keeps allowance at max ', async function () {
                expect(await this.contract.allowance(accounts[fromIndex].address, accounts[senderIndex].address)).to.equal(ethers.MaxUint256);
              });
            } else {
              it('decreases the spender allowance', async function () {
                expect(await this.contract.allowance(accounts[fromIndex].address, accounts[senderIndex].address)).to.equal(this.allowance - value);
              });
            }

            if (features && features.AllowanceTracking) {
              it('emits an Approval event', async function () {
                await expect(this.receipt)
                  .to.emit(this.contract, 'Approval')
                  .withArgs(accounts[fromIndex].address, accounts[senderIndex].address, withEIP717 ? ethers.MaxUint256 : this.allowance - value);
              });
            }
          }
        };

        const burnsTokens = function (fromIndex, value, senderIndex, withEIP717 = false) {
          context('when burning tokens', function () {
            beforeEach(async function () {
              this.fromBalance = await this.contract.balanceOf(accounts[fromIndex].address);
              this.allowance = await this.contract.allowance(accounts[fromIndex].address, accounts[senderIndex].address);
              this.receipt = await burnFrom(this.contract.connect(accounts[senderIndex]), accounts[fromIndex].address, value);
            });
            burnWasSuccessful(fromIndex, value, senderIndex, withEIP717);
          });
        };

        const burnsBySender = function (value) {
          context('when burning started by the owner', function () {
            burnsTokens(AccountIndex.owner, value, AccountIndex.owner);
          });

          context('when burning started by an approved sender', function () {
            burnsTokens(AccountIndex.owner, value, AccountIndex.spender);
          });

          context('when burning started by a sender with max approval', function () {
            burnsTokens(AccountIndex.owner, value, AccountIndex.maxSpender, features.EIP717);
          });
        };

        context('when burning a zero value', function () {
          burnsBySender(0n);
        });

        context('when burning a non-zero value', function () {
          burnsBySender(1n);
        });

        context('when burning the full allowance', function () {
          burnsBySender(initialAllowance);
        });
      });
    }

    if (batchBurnFrom !== undefined) {
      describe('batchBurnFrom(address[],uint256[])', function () {
        context('Pre-conditions', function () {
          it('reverts with inconsistent arrays', async function () {
            await expectRevert(
              batchBurnFrom(this.contract.connect(spender), [spender.address, spender.address], [1]),
              this.contract,
              errors.InconsistentArrayLengths,
            );
            await expectRevert(batchBurnFrom(this.contract.connect(spender), [], [1]), this.contract, errors.InconsistentArrayLengths);
          });

          it('reverts when one of the owners is the zero address', async function () {
            await expectRevert(
              batchBurnFrom(this.contract.connect(spender), [ethers.ZeroAddress], [1n]),
              this.contract,
              errors.BurnExceedsAllowance,
              {
                owner: ethers.ZeroAddress,
                spender: spender.address,
                allowance: 0,
                value: 1,
              },
            );
            await expectRevert(
              batchBurnFrom(this.contract.connect(spender), [owner.address, ethers.ZeroAddress], [1n, 1n]),
              this.contract,
              errors.BurnExceedsAllowance,
              {
                owner: ethers.ZeroAddress,
                spender: spender.address,
                allowance: 0n,
                value: 1n,
              },
            );
          });

          it('reverts with an insufficient balance', async function () {
            await expectRevert(
              batchBurnFrom(this.contract.connect(maxSpender), [owner.address], [initialSupply + 1n]),
              this.contract,
              errors.BurnExceedsBalance,
              {
                owner: owner.address,
                balance: initialSupply,
                value: initialSupply + 1n,
              },
            );
            await expectRevert(
              batchBurnFrom(this.contract.connect(maxSpender), [owner.address, owner.address], [initialSupply, 1n]),
              this.contract,
              errors.BurnExceedsBalance,
              {
                owner: owner.address,
                balance: 0n,
                value: 1n,
              },
            );
          });

          it('reverts with an insufficient allowance', async function () {
            await expectRevert(
              batchBurnFrom(this.contract.connect(spender), [owner.address], [initialAllowance + 1n]),
              this.contract,
              errors.BurnExceedsAllowance,
              {
                owner: owner.address,
                spender: spender.address,
                allowance: initialAllowance,
                value: initialAllowance + 1n,
              },
            );
            await expectRevert(
              batchBurnFrom(this.contract.connect(spender), [owner.address, owner.address], [initialAllowance, 1n]),
              this.contract,
              errors.BurnExceedsAllowance,
              {
                owner: owner.address,
                spender: spender.address,
                allowance: 0n,
                value: 1n,
              },
            );
          });
        });

        const burnWasSuccessful = function (ownerIndexes, values, senderIndex, withEIP717) {
          let totalValue = 0n;
          let aggregatedValues = {};
          for (let i = 0; i < ownerIndexes.length; ++i) {
            const fromIndex = ownerIndexes[i];
            const value = values[i];
            totalValue = totalValue + value;

            it('emits a Transfer event', async function () {
              await expect(this.receipt).to.emit(this.contract, 'Transfer').withArgs(accounts[fromIndex].address, ethers.ZeroAddress, value);
            });

            aggregatedValues[fromIndex] = aggregatedValues[fromIndex] ? aggregatedValues[fromIndex] + value : value;
          }

          for (const fromIndex of Object.keys(aggregatedValues)) {
            it('decreases the owners balance', async function () {
              expect(await this.contract.balanceOf(accounts[fromIndex].address)).to.equal(this.fromBalances[fromIndex] - aggregatedValues[fromIndex]);
            });

            if (fromIndex != senderIndex) {
              if (withEIP717) {
                it('[EIP717] keeps allowance at max ', async function () {
                  expect(await this.contract.allowance(accounts[fromIndex].address, accounts[senderIndex].address)).to.equal(ethers.MaxUint256);
                });
              } else {
                it('decreases the spender allowance', async function () {
                  expect(await this.contract.allowance(accounts[fromIndex].address, accounts[senderIndex].address)).to.equal(
                    this.fromAllowances[fromIndex] - aggregatedValues[fromIndex],
                  );
                });
              }

              if (features && features.AllowanceTracking) {
                it('emits an Approval event', async function () {
                  await expect(this.receipt)
                    .to.emit(this.contract, 'Approval')
                    .withArgs(
                      accounts[fromIndex].address,
                      accounts[senderIndex].address,
                      withEIP717 ? ethers.MaxUint256 : this.fromAllowances[fromIndex] - aggregatedValues[fromIndex],
                    );
                });
              }
            }
          }

          it('decreases the token(s) total supply', async function () {
            expect(await this.contract.totalSupply()).to.equal(initialSupply - totalValue);
          });
        };

        const burnsTokens = function (ownerIndexes, values, senderIndex, withEIP717 = false) {
          beforeEach(async function () {
            this.fromAllowances = {};
            this.fromBalances = {};
            for (const fromIndex of ownerIndexes) {
              this.fromAllowances[fromIndex] = await this.contract.allowance(accounts[fromIndex].address, accounts[senderIndex].address);
              this.fromBalances[fromIndex] = await this.contract.balanceOf(accounts[fromIndex].address);
            }
            this.receipt = await this.contract.connect(accounts[senderIndex]).batchBurnFrom(
              ownerIndexes.map((fromIndex) => accounts[fromIndex].address),
              values,
            );
          });
          burnWasSuccessful(ownerIndexes, values, senderIndex, withEIP717);
        };

        const burnsBySender = function (ownerIndexes, values) {
          context('when burn started by the owner', function () {
            burnsTokens(ownerIndexes, values, AccountIndex.owner);
          });

          context('when burn started by an approved sender', function () {
            burnsTokens(ownerIndexes, values, AccountIndex.spender);
          });

          context('when burn started by a sender with max approval', function () {
            burnsTokens(ownerIndexes, values, AccountIndex.maxSpender, features.EIP717);
          });
        };

        context('when burning an empty list', function () {
          burnsBySender([], []);
        });

        context('when burning a zero total value', function () {
          burnsBySender([AccountIndex.owner], [0n]);
        });

        context('when burning zero values', function () {
          burnsBySender([AccountIndex.owner, AccountIndex.owner, AccountIndex.owner], [0n, 1n, 0n]);
        });

        context('when burning the full allowance', function () {
          burnsBySender([AccountIndex.owner], [initialAllowance]);
          burnsBySender([AccountIndex.owner, AccountIndex.owner], [initialAllowance - 1n, 1n]);
        });
      });
    }

    if (features && features.ERC165 && interfaces && interfaces.ERC20Burnable) {
      supportsInterfaces(['IERC20Burnable']);
    }
  });
}

module.exports = {
  behavesLikeERC20Burnable,
};
