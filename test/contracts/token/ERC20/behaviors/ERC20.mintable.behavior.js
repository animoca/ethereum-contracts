const {loadFixture} = require('../../../../helpers/fixtures');
const {shouldSupportInterfaces} = require('../../../introspection/behaviors/SupportsInterface.behavior');

const {Zero, One, Two, MaxUInt256, ZeroAddress} = require('../../../../../src/constants');

function behavesLikeERC20Mintable(implementation) {
  const {contractName, features, interfaces, revertMessages, methods, deploy} = implementation;
  const {'mint(address,uint256)': mint, 'batchMint(address[],uint256[])': batchMint} = methods;

  describe('like a mintable ERC20', function () {
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

    describe('mint(address,uint256)', function () {
      if (mint === undefined) {
        console.log(
          `ERC20Mintable: non-standard ERC20 method mint(address,uint256) is not supported by ${contractName}, associated tests will be skipped`
        );
        return;
      }

      context('Pre-conditions', function () {
        it('reverts if sent by a non-minter', async function () {
          await expect(mint(this.contract.connect(recipient1), recipient1.address, One)).to.be.revertedWith(revertMessages.NotMinter);
        });

        it('reverts if minted to the zero address', async function () {
          await expect(mint(this.contract, ZeroAddress, One)).to.be.revertedWith(revertMessages.MintToZero);
        });

        it('reverts if minting would overflow the total supply', async function () {
          await mint(this.contract, recipient1.address, MaxUInt256);
          await expect(mint(this.contract, recipient2.address, One)).to.be.revertedWith(revertMessages.SupplyOverflow);
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
          await expect(this.receipt).to.emit(this.contract, 'Transfer').withArgs(ZeroAddress, accounts[toIndex].address, value);
        });
      };

      const shouldMintTokens = function (toIndex, value) {
        beforeEach(async function () {
          this.receipt = await mint(this.contract, accounts[toIndex].address, value);
        });
        mintWasSuccessful(toIndex, value);
      };

      context('when minting zero value', function () {
        shouldMintTokens(AccountIndex.recipient1, Zero);
      });

      context('when minting some tokens', function () {
        shouldMintTokens(AccountIndex.recipient1, One);
      });

      context('when minting the maximum supply', function () {
        shouldMintTokens(AccountIndex.recipient1, MaxUInt256);
      });
    });

    describe('batchMint(address[],uint256[])', function () {
      if (batchMint === undefined) {
        console.log(
          `ERC20Mintable: non-standard ERC20 method batchMint(address[],uint256[]) is not supported by ${contractName}, ` +
            'associated tests will be skipped'
        );
        return;
      }

      context('Pre-conditions', function () {
        it('reverts if sent by a non-minter', async function () {
          await expect(batchMint(this.contract.connect(recipient1), [recipient1.address], [One])).to.be.revertedWith(revertMessages.NotMinter);
        });

        it('reverts with inconsistent arrays', async function () {
          await expect(batchMint(this.contract, [recipient1.address], [])).to.be.revertedWith(revertMessages.InconsistentArrays);
          await expect(batchMint(this.contract, [], [One])).to.be.revertedWith(revertMessages.InconsistentArrays);
        });

        it('reverts if minted to the zero address', async function () {
          await expect(batchMint(this.contract, [ZeroAddress], [One])).to.be.revertedWith(revertMessages.MintToZero);
        });

        it('reverts if minting would overflow the total supply', async function () {
          await batchMint(this.contract, [recipient1.address], [MaxUInt256]);
          await expect(batchMint(this.contract, [recipient2.address], [One])).to.be.revertedWith(revertMessages.SupplyOverflow);
        });

        it('reverts if cumulative values overflow', async function () {
          await expect(batchMint(this.contract, [recipient1.address, recipient2.address], [One, MaxUInt256])).to.be.revertedWith(
            revertMessages.BatchMintValuesOverflow
          );
        });
      });

      const mintWasSuccessful = function (recipientIndexes, values) {
        let aggregatedValues = {};
        let totalValue = Zero;
        for (let i = 0; i < recipientIndexes.length; ++i) {
          const toIndex = recipientIndexes[i];
          const value = values[i];

          it('emits a Transfer event', async function () {
            await expect(this.receipt).to.emit(this.contract, 'Transfer').withArgs(ZeroAddress, accounts[toIndex].address, value);
          });

          aggregatedValues[toIndex] = aggregatedValues[toIndex] ? aggregatedValues[toIndex].add(value) : value;
          totalValue = totalValue.add(value);
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

      const shouldMintTokens = function (recipientIndexes, values) {
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
        shouldMintTokens([], []);
      });

      context('when minting a zero total value', function () {
        shouldMintTokens([AccountIndex.recipient1], [Zero]);
      });

      context('when minting some tokens', function () {
        shouldMintTokens([AccountIndex.recipient1, AccountIndex.recipient2], [One, Two]);
      });

      context('when minting some tokens including zero values', function () {
        shouldMintTokens([AccountIndex.recipient1, AccountIndex.recipient1, AccountIndex.recipient2], [One, Zero, One]);
      });

      context('when minting the maximum supply', function () {
        shouldMintTokens([AccountIndex.recipient1], [MaxUInt256]);
      });
    });

    if (features.ERC165 && interfaces.ERC20Mintable) {
      shouldSupportInterfaces(['IERC20Mintable']);
    }
  });
}

module.exports = {
  behavesLikeERC20Mintable,
};
