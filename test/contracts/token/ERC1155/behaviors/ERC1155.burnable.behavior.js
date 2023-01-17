const {ethers} = require('hardhat');
const {expect} = require('chai');
const {constants} = ethers;
const {loadFixture} = require('@animoca/ethereum-contract-helpers/src/test/fixtures');
const {deployContract} = require('@animoca/ethereum-contract-helpers/src/test/deploy');
const {supportsInterfaces} = require('../../../introspection/behaviors/SupportsInterface.behavior');
const {nonFungibleTokenId, isFungible} = require('../../token');

function behavesLikeERC1155Burnable({revertMessages, interfaces, methods, features, deploy, mint}) {
  let accounts, deployer, owner, approved, operator, other;

  before(async function () {
    accounts = await ethers.getSigners();
    [deployer, owner, approved, operator, other] = accounts;
  });

  const {
    'burnFrom(address,uint256,uint256)': burnFrom,
    'batchBurnFrom(address,uint256[],uint256[])': batchBurnFrom,
    'safeMint(address,uint256,uint256,bytes)': safeMint,
    'safeBatchMint(address,uint256[],uint256[],bytes)': safeBatchMint,
    'mint(address,uint256)': mint_ERC721,
    'batchMint(address,uint256[])': batchMint_ERC721,
    'safeMint(address,uint256,bytes)': safeMint_ERC721,
  } = methods;

  describe('like a burnable ERC1155Inventory', function () {
    const fungible1 = {id: 1, supply: 10};
    const fungible2 = {id: 2, supply: 11};
    const fungible3 = {id: 3, supply: 12};
    const nft1 = nonFungibleTokenId(1);
    const nft2 = nonFungibleTokenId(2);
    const nft3 = nonFungibleTokenId(3);
    const nonExistingNFT = nonFungibleTokenId(99);

    const fixture = async function () {
      this.token = await deploy(deployer);
      await mint(this.token, owner.address, fungible1.id, fungible1.supply);
      await mint(this.token, owner.address, fungible2.id, fungible2.supply);
      await mint(this.token, owner.address, fungible3.id, fungible3.supply);
      await mint(this.token, owner.address, nft1, 1);
      await mint(this.token, owner.address, nft2, 1);
      await mint(this.token, owner.address, nft3, 1);
      await this.token.connect(owner).setApprovalForAll(operator.address, true);
      if (interfaces.ERC721) {
        await this.token.approve(approved, nft1);
        await this.token.approve(approved, nft2);
      }
      this.receiver721 = await deployContract('ERC721ReceiverMock', true, this.token.address);
      this.receiver1155 = await deployContract('ERC1155TokenReceiverMock', true, this.token.address);
      this.refusingReceiver1155 = await deployContract('ERC1155TokenReceiverMock', false, this.token.address);
      this.revertingReceiver1155 = await deployContract('ERC1155TokenReceiverMock', true, constants.AddressZero);
      // this.receiver1155721 = await ERC1155721ReceiverMock.new(true, true, this.token.address);

      // pre-transfer state
      if (interfaces.ERC721) {
        this.nftBalance = await this.token.balanceOf(owner.address);
      }
    };

    beforeEach(async function () {
      await loadFixture(fixture, this);
    });

    const revertsOnPreconditions = function (burnFunction) {
      describe('Pre-conditions', function () {
        it('reverts if the sender is not approved', async function () {
          await expect(burnFunction.call(this, owner.address, nft1, 1, other)).to.be.revertedWith(revertMessages.NonApproved);
          await expect(burnFunction.call(this, owner.address, fungible1.id, 1, other)).to.be.revertedWith(revertMessages.NonApproved);
        });

        if (interfaces.ERC721) {
          it('[ERC721] reverts if a Non-Fungible Token has a value different from 1', async function () {
            await expect(burnFunction.call(this, owner.address, nft1, 0, owner)).to.be.revertedWith(revertMessages.WrongNFTValue);
            await expect(burnFunction.call(this, owner.address, nft1, 2, owner)).to.be.revertedWith(revertMessages.WrongNFTValue);
          });

          it('[ERC721] reverts with a non-existing Non-Fungible Token', async function () {
            await expect(burnFunction.call(this, owner.address, nonExistingNFT, 1, owner)).to.be.revertedWith(revertMessages.NonOwnedNFT);
          });

          it('[ERC721/ERC1155Inventory] reverts if from is not the owner for a Non-Fungible Token', async function () {
            await expect(burnFunction.call(this, other.address, nft1, 1, other)).to.be.revertedWith(revertMessages.NonOwnedNFT);
          });
        }

        it('reverts if from has insufficient balance for a Fungible Token', async function () {
          await expect(burnFunction.call(this, other.address, fungible1.id, 1, other)).to.be.revertedWith(revertMessages.InsufficientBalance);
        });

        if (interfaces.ERC721) {
          it('[ERC721] reverts if the sender is not authorized for the token', async function () {
            await expect(burnFunction.call(this, owner.address, nft1, 1, other)).to.be.revertedWith(revertMessages.NonApproved);
          });
        }
      });
    };

    const canBeMintedAgain = function (ids) {
      ids = Array.isArray(ids) ? ids : [ids];

      if (safeMint !== undefined) {
        it('[ERC721] can be minted again, using safeMint(address,uint256,uint256,bytes)', async function () {
          for (const id of ids) {
            await safeMint(this.token, owner.address, id, 1, '0x42');
          }
        });
      }

      if (safeBatchMint !== undefined) {
        it('[ERC721] can be minted again, using safeBatchMint(address,uint256[],uint256[],bytes)', async function () {
          await safeBatchMint(
            this.token,
            owner.address,
            ids.map(([id]) => id),
            ids.map(() => 1),
            '0x42'
          );
        });
      }

      if (interfaces.ERC1155Deliverable) {
        it('[ERC721] can be minted again, using safeDeliver(address[],uint256[],uint256[],bytes)', async function () {
          await this.token.safeDeliver(
            ids.map(() => owner.address),
            ids,
            ids.map(() => 1),
            '0x42'
          );
        });
      }

      if (mint_ERC721 !== undefined) {
        it('[ERC721] can be minted again, using mint(address,uint256)', async function () {
          for (const id of ids) {
            await mint_ERC721(this.token, owner.address, id, deployer);
          }
        });
      }

      if (batchMint_ERC721 !== undefined) {
        it('[ERC721] can be minted again, using batchMint(address,uint256[])', async function () {
          await batchMint_ERC721(this.token, owner.address, ids, deployer);
        });
      }

      if (safeMint_ERC721 !== undefined) {
        it('[ERC721] can be minted again, using safeMint(address,uint256,bytes)', async function () {
          for (const id of ids) {
            await safeMint_ERC721(this.token, owner.address, id, 0x0, deployer);
          }
        });
      }

      if (interfaces.ERC721Deliverable) {
        it('[ERC721] can be minted again, using deliver(address[],uint256[])', async function () {
          await this.token.deliver(
            ids.map(() => owner.address),
            ids
          );
        });
      }
    };

    const cannotBeMintedAgain = function (ids) {
      ids = Array.isArray(ids) ? ids : [ids];

      it('[ERC721MintableOnce] wasBurnt(uint256) returns true', async function () {
        for (const id of ids) {
          expect(await this.token.wasBurnt(id)).to.be.true;
        }
      });

      if (safeMint !== undefined) {
        it('[ERC721MintableOnce] cannot be minted again, using safeMint(address,uint256,uint256,bytes)', async function () {
          for (const id of ids) {
            await safeMint(this.token, owner.address, id, 1, '0x42');
          }
        });
      }

      if (safeBatchMint !== undefined) {
        it('[ERC721MintableOnce] cannot be minted again, using safeBatchMint(address,uint256[],uint256[],bytes)', async function () {
          await safeBatchMint(
            this.token,
            owner.address,
            ids.map(([id]) => id),
            ids.map(() => 1),
            '0x42'
          );
        });
      }

      if (interfaces.ERC1155Deliverable) {
        it('[ERC721MintableOnce] cannot be minted again, using safeDeliver(address[],uint256[],uint256[],bytes)', async function () {
          await expect(
            this.token.safeDeliver(
              ids.map(() => owner.address),
              ids,
              ids.map(() => 1),
              '0x42'
            )
          ).to.be.revertedWith(revertMessages.BurntToken);
        });
      }

      if (mint_ERC721 !== undefined) {
        it('[ERC721MintableOnce] cannot be minted again, using mint(address,uint256)', async function () {
          for (const id of ids) {
            await expect(mint_ERC721(this.token, owner.address, id, deployer)).to.be.revertedWith(revertMessages.BurntToken);
          }
        });
      }

      if (batchMint_ERC721 !== undefined) {
        it('[ERC721MintableOnce] cannot be minted again, using batchMint(address,uint256[])', async function () {
          await expect(batchMint_ERC721(this.token, owner.address, ids, deployer)).to.be.revertedWith(revertMessages.BurntToken);
        });
      }

      if (safeMint_ERC721 !== undefined) {
        it('[ERC721MintableOnce] cannot be minted again, using safeMint(address,uint256[],bytes)', async function () {
          for (const id of ids) {
            await expect(safeMint_ERC721(this.token, owner.address, id, 0x0, deployer)).to.be.revertedWith(revertMessages.BurntToken);
          }
        });
      }

      if (interfaces.ERC721Deliverable) {
        it('[ERC721MintableOnce] cannot be minted again, using deliver(address[],uint256[])', async function () {
          await expect(
            this.token.deliver(
              ids.map(() => owner.address),
              ids
            )
          ).to.be.revertedWith(revertMessages.BurntToken);
        });
      }
    };

    const burnWasSuccessful = function (tokenIds, values) {
      const ids = Array.isArray(tokenIds) ? tokenIds : [tokenIds];
      const vals = Array.isArray(values) ? values : [values];
      const tokens = ids.map((id, i) => [id, vals[i]]);
      const fungibleTokens = tokens.filter(([id, _value]) => isFungible(id));
      const nonFungibleTokens = tokens.filter(([id, _value]) => !isFungible(id));

      if (tokens.length != 0) {
        it('decreases the sender balance(s)', async function () {
          for (const [id, value] of tokens) {
            let balance;
            if (!isFungible(id)) {
              balance = 0;
            } else {
              if (id == fungible1.id) {
                balance = fungible1.supply;
              } else if (id == fungible2.id) {
                balance = fungible2.supply;
              } else if (id == fungible3.id) {
                balance = fungible3.supply;
              }
              balance = balance - value;
            }
            expect(await this.token.balanceOf(owner.address, id)).to.equal(balance);
          }
        });

        if (Array.isArray(tokenIds)) {
          it('emits a TransferBatch event', async function () {
            await expect(this.receipt)
              .to.emit(this.token, 'TransferBatch')
              .withArgs(this.sender, owner.address, constants.AddressZero, tokenIds, values);
          });
        } else {
          it('emits a TransferSingle event', async function () {
            await expect(this.receipt)
              .to.emit(this.token, 'TransferSingle')
              .withArgs(this.sender, owner.address, constants.AddressZero, tokenIds, values);
          });
        }

        if (nonFungibleTokens.length != 0) {
          if (interfaces.ERC721) {
            it('[ERC721] removes the ownership of the Non-Fungible Token(s)', async function () {
              for (const [id, _value] of nonFungibleTokens) {
                await expect(this.token.ownerOf(id)).to.be.revertedWith(revertMessages.NonExistingNFT);
              }
            });

            it('[ERC721] decreases the owner NFTs balance', async function () {
              expect(await this.token.balanceOf(owner.address)).to.equal(this.nftBalance.sub(nonFungibleTokens.length));
            });

            it('[ERC721] emits Transfer event(s) for Non-Fungible Token(s)', async function () {
              for (const [id, _value] of nonFungibleTokens) {
                await expect(this.receipt).to.emit(this.token, 'Transfer').withArgs(owner.address, constants.AddressZero, id);
              }
            });

            if (features.ERC721MintableOnce) {
              cannotBeMintedAgain(ids);
            } else {
              canBeMintedAgain(ids);
            }
          }
        }
      }
    };

    const burnsBySender = function (burnFunction, tokenIds, values) {
      context('when called by the owner', function () {
        beforeEach(async function () {
          this.sender = owner.address;
          this.receipt = await burnFunction.call(this, owner.address, tokenIds, values, owner);
        });
        burnWasSuccessful(tokenIds, values);
      });

      context('when called by an operator', function () {
        beforeEach(async function () {
          this.sender = operator.address;
          this.receipt = await burnFunction.call(this, owner.address, tokenIds, values, operator);
        });
        burnWasSuccessful(tokenIds, values);
      });

      if (interfaces.ERC721) {
        const ids = Array.isArray(tokenIds) ? tokenIds : [tokenIds];
        const approvedTokenIds = ids.filter((id) => id == nft1 || id == nft2);
        // All tokens are approved NFTs
        if (ids.length != 0 && ids.length == approvedTokenIds.length) {
          context('[ERC721] when called by a wallet with single token approval', function () {
            beforeEach(async function () {
              this.sender = approved.address;
              receipt = await burnFunction.call(this, owner.address, tokenIds, values, approved);
            });
            burnWasSuccessful(tokenIds, values);
          });
        }
      }
    };

    if (burnFrom !== undefined) {
      describe('burnFrom(address,uint256,uint256)', function () {
        const burnFn = async function (from, id, value, sender) {
          return burnFrom(this.token, from, id, value, sender);
        };

        revertsOnPreconditions(burnFn);

        context('with a Fungible Token', function () {
          context('zero value burning', function () {
            burnsBySender(burnFn, fungible1.id, 0);
          });

          context('partial balance burning', function () {
            burnsBySender(burnFn, fungible1.id, 1);
          });

          context('full balance burning', function () {
            burnsBySender(burnFn, fungible1.id, fungible1.supply);
          });
        });
        context('with a Non-Fungible Token', function () {
          burnsBySender(burnFn, nft1, 1);
        });
      });
    }

    if (batchBurnFrom !== undefined) {
      describe('batchBurnFrom(address,uint256[],uint256[])', function () {
        const burnFn = async function (from, ids, values, sender) {
          const tokenIds = Array.isArray(ids) ? ids : [ids];
          const vals = Array.isArray(values) ? values : [values];
          return batchBurnFrom(this.token, from, tokenIds, vals, sender);
        };

        revertsOnPreconditions(burnFn);

        it('reverts with inconsistent arrays', async function () {
          await expect(burnFn.call(this, owner.address, [nft1, nft2], [1], owner)).to.be.revertedWith(revertMessages.InconsistentArrays);
        });

        context('with an empty list of tokens', function () {
          burnsBySender(burnFn, [], []);
        });

        context('with Fungible Tokens', function () {
          context('single zero value burning', function () {
            burnsBySender(burnFn, [fungible1.id], [0]);
          });

          context('single partial balance burning', function () {
            burnsBySender(burnFn, [fungible1.id], [1]);
          });

          context('single full balance burning', function () {
            burnsBySender(burnFn, [fungible1.id], [fungible1.supply]);
          });

          context('multiple tokens burning', function () {
            burnsBySender(burnFn, [fungible1.id, fungible2.id, fungible3.id], [fungible1.supply, 0, fungible3.supply]);
          });
        });
        context('with Non-Fungible Tokens', function () {
          context('single token burning', function () {
            burnsBySender(burnFn, [nft1], [1]);
          });
          context('multiple tokens burning', function () {
            burnsBySender(burnFn, [nft1, nft2], [1, 1]);
          });
        });
        context('with Fungible and Non-Fungible Tokens', function () {
          burnsBySender(burnFn, [fungible1.id, nft1, fungible2.id, nft2], [fungible1.supply, 1, 0, 1]);
        });
      });
    }

    if (interfaces.ERC1155InventoryBurnable) {
      supportsInterfaces(['IERC1155InventoryBurnable']);
    }
  });
}

module.exports = {
  behavesLikeERC1155Burnable,
};
