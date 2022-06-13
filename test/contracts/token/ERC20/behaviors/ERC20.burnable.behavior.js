const {ethers} = require('hardhat');
const {expect} = require('chai');
const {loadFixture} = require('../../../../helpers/fixtures');
const {supporstInterfaces} = require('../../../introspection/behaviors/SupportsInterface.behavior');

const {Zero, One, MaxUInt256, ZeroAddress} = require('../../../../../src/constants');

function behavesLikeERC20Burnable(implementation) {
  const {contractName, features, interfaces, methods, revertMessages, deploy} = implementation;
  const {'burn(uint256)': burn, 'burnFrom(address,uint256)': burnFrom, 'batchBurnFrom(address[],uint256[])': batchBurnFrom} = methods;

  const initialSupply = ethers.BigNumber.from('100');
  const initialAllowance = initialSupply.sub(One);

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
      await this.contract.approve(maxSpender.address, MaxUInt256);
    };

    beforeEach(async function () {
      await loadFixture(fixture, this);
    });

    if (burn !== undefined) {
      describe('burn(uint256)', function () {
        context('Pre-conditions', function () {
          it('reverts with an insufficient balance', async function () {
            await expect(burn(this.contract, initialSupply.add(One))).to.be.revertedWith(revertMessages.BurnExceedsBalance);
          });
        });

        const burnWasSuccessful = function (value, senderIndex) {
          it('decreases the sender balance', async function () {
            expect(await this.contract.balanceOf(accounts[senderIndex].address)).to.equal(initialSupply.sub(value));
          });

          it('decreases the total supply', async function () {
            expect(await this.contract.totalSupply()).to.equal(initialSupply.sub(value));
          });

          it('emits a Transfer event', async function () {
            await expect(this.receipt).to.emit(this.contract, 'Transfer').withArgs(accounts[senderIndex].address, ZeroAddress, value);
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
          burnsTokens(Zero);
        });

        context('when burning a non-zero value', function () {
          burnsTokens(One);
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
            await expect(burnFrom(this.contract.connect(spender), ZeroAddress, One)).to.be.revertedWith(revertMessages.BurnExceedsAllowance);
          });

          it('reverts with an insufficient balance', async function () {
            await this.contract.approve(spender.address, initialSupply.add(One));
            await expect(burnFrom(this.contract.connect(spender), owner.address, initialSupply.add(One))).to.be.revertedWith(
              revertMessages.BurnExceedsBalance
            );
          });

          it('reverts with an insufficient allowance', async function () {
            await expect(burnFrom(this.contract.connect(spender), owner.address, initialAllowance.add(One))).to.be.revertedWith(
              revertMessages.BurnExceedsAllowance
            );
          });
        });

        const burnWasSuccessful = function (fromIndex, value, senderIndex, withEIP717) {
          it('decreases the owner balance', async function () {
            expect(await this.contract.balanceOf(accounts[fromIndex].address)).to.equal(initialSupply.sub(value));
          });

          it('decreases the total supply', async function () {
            expect(await this.contract.totalSupply()).to.equal(initialSupply.sub(value));
          });

          it('emits a Transfer event', async function () {
            await expect(this.receipt).to.emit(this.contract, 'Transfer').withArgs(accounts[fromIndex].address, ZeroAddress, value);
          });

          if (fromIndex != senderIndex) {
            if (withEIP717) {
              it('[EIP717] keeps allowance at max ', async function () {
                expect(await this.contract.allowance(accounts[fromIndex].address, accounts[senderIndex].address)).to.equal(MaxUInt256);
              });
            } else {
              it('decreases the spender allowance', async function () {
                expect(await this.contract.allowance(accounts[fromIndex].address, accounts[senderIndex].address)).to.equal(this.allowance.sub(value));
              });
            }

            if (features.AllowanceTracking) {
              it('emits an Approval event', async function () {
                await expect(this.receipt)
                  .to.emit(this.contract, 'Approval')
                  .withArgs(accounts[fromIndex].address, accounts[senderIndex].address, withEIP717 ? MaxUInt256 : this.allowance.sub(value));
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
          burnsBySender(Zero);
        });

        context('when burning a non-zero value', function () {
          burnsBySender(One);
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
            await expect(batchBurnFrom(this.contract.connect(spender), [spender.address, spender.address], [One]), revertMessages.InconsistentArrays);
            await expect(batchBurnFrom(this.contract.connect(spender), [spender.address], [One, One]), revertMessages.InconsistentArrays);
          });

          it('reverts when one of the owners is the zero address', async function () {
            await expect(batchBurnFrom(this.contract.connect(spender), [ZeroAddress], [One]), revertMessages.BurnExceedsAllowance);
            await expect(
              batchBurnFrom(this.contract.connect(spender), [owner.address, ZeroAddress], [One, One]),
              revertMessages.BurnExceedsAllowance
            );
          });

          it('reverts with an insufficient balance', async function () {
            await expect(batchBurnFrom(this.contract.connect(spender), [owner.address], [initialSupply.add(One)]), revertMessages.BurnExceedsBalance);
            await expect(
              batchBurnFrom(this.contract.connect(spender), [owner.address, owner.address], [initialSupply, One]),
              revertMessages.BurnExceedsBalance
            );
          });

          it('reverts with an insufficient allowance', async function () {
            await expect(
              batchBurnFrom(this.contract.connect(spender), [owner.address], [initialAllowance.add(One)]),
              revertMessages.BurnExceedsAllowance
            );
            await expect(
              batchBurnFrom(this.contract.connect(spender), [owner.address, owner.address], [initialAllowance, One]),
              revertMessages.BurnExceedsAllowance
            );
          });

          it('reverts when values overflow', async function () {
            await expect(
              batchBurnFrom(this.contract.connect(maxSpender), [owner.address, owner.address], [initialAllowance, MaxUInt256]),
              revertMessages.BatchBurnValuesOverflow
            );
          });
        });

        const burnWasSuccessful = function (ownerIndexes, values, senderIndex, withEIP717) {
          let totalValue = Zero;
          let aggregatedValues = {};
          for (let i = 0; i < ownerIndexes.length; ++i) {
            const fromIndex = ownerIndexes[i];
            const value = values[i];
            totalValue = totalValue.add(value);

            it('emits a Transfer event', async function () {
              await expect(this.receipt).to.emit(this.contract, 'Transfer').withArgs(accounts[fromIndex].address, ZeroAddress, value);
            });

            aggregatedValues[fromIndex] = aggregatedValues[fromIndex] ? aggregatedValues[fromIndex].add(value) : value;
          }

          for (const fromIndex of Object.keys(aggregatedValues)) {
            it('decreases the owners balance', async function () {
              expect(await this.contract.balanceOf(accounts[fromIndex].address)).to.equal(
                this.fromBalances[fromIndex].sub(aggregatedValues[fromIndex])
              );
            });

            if (fromIndex != senderIndex) {
              if (withEIP717) {
                it('[EIP717] keeps allowance at max ', async function () {
                  expect(await this.contract.allowance(accounts[fromIndex].address, accounts[senderIndex].address)).to.equal(MaxUInt256);
                });
              } else {
                it('decreases the spender allowance', async function () {
                  expect(await this.contract.allowance(accounts[fromIndex].address, accounts[senderIndex].address)).to.equal(
                    this.fromAllowances[fromIndex].sub(aggregatedValues[fromIndex])
                  );
                });
              }

              if (features.AllowanceTracking) {
                it('emits an Approval event', async function () {
                  await expect(this.receipt)
                    .to.emit(this.contract, 'Approval')
                    .withArgs(
                      accounts[fromIndex].address,
                      accounts[senderIndex].address,
                      withEIP717 ? MaxUInt256 : this.fromAllowances[fromIndex].sub(aggregatedValues[fromIndex])
                    );
                });
              }
            }
          }

          it('decreases the token(s) total supply', async function () {
            expect(await this.contract.totalSupply()).to.equal(initialSupply.sub(totalValue));
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
              values
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
          burnsBySender([AccountIndex.owner], [Zero]);
        });

        context('when burning zero values', function () {
          burnsBySender([AccountIndex.owner, AccountIndex.owner, AccountIndex.owner], [Zero, One, Zero]);
        });

        context('when burning the full allowance', function () {
          burnsBySender([AccountIndex.owner], [initialAllowance]);
          burnsBySender([AccountIndex.owner, AccountIndex.owner], [initialAllowance.sub(One), One]);
        });
      });
    }

    if (features.ERC165 && interfaces.ERC20Burnable) {
      supporstInterfaces(['IERC20Burnable']);
    }
  });
}

module.exports = {
  behavesLikeERC20Burnable,
};
