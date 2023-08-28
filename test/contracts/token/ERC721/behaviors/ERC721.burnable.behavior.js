const {ethers} = require('hardhat');
const {constants} = ethers;
const {expect} = require('chai');
const {expectRevert} = require('@animoca/ethereum-contract-helpers/src/test/revert');
const {loadFixture} = require('@animoca/ethereum-contract-helpers/src/test/fixtures');
const {supportsInterfaces} = require('../../../introspection/behaviors/SupportsInterface.behavior');

function behavesLikeERC721Burnable({deploy, mint, features, errors, interfaces, methods}) {
  const {
    'burnFrom(address,uint256)': burnFrom,
    'batchBurnFrom(address,uint256[])': batchBurnFrom,
    'mint(address,uint256)': mint_ERC721,
    'safeMint(address,uint256,bytes)': safeMint_ERC721,
    'batchMint(address,uint256[])': batchMint_ERC721,
    'safeMint(address,uint256,uint256,bytes)': safeMint_ERC1155,
    'safeBatchMint(address,uint256[],uint256[],bytes)': safeBatchMint_ERC1155,
  } = methods || {};

  describe('like an ERC721 Burnable', function () {
    let accounts, deployer, owner, other, approved, operator;
    let nft1 = 1;
    let nft2 = 2;
    let nft3 = 3;
    let nft4 = 4;
    let unknownNFT = 1000;

    before(async function () {
      accounts = await ethers.getSigners();
      [deployer, minter, owner, other, approved, operator] = accounts;
    });

    const fixture = async function () {
      this.token = await deploy(deployer);
      await mint(this.token, owner.address, nft1, 1, deployer);
      await mint(this.token, owner.address, nft2, 1, deployer);
      await mint(this.token, owner.address, nft3, 1, deployer);
      await mint(this.token, owner.address, nft4, 1, deployer);
      await this.token.connect(owner).approve(approved.address, nft1);
      await this.token.connect(owner).approve(approved.address, nft2);
      await this.token.connect(owner).setApprovalForAll(operator.address, true);
      this.nftBalance = await this.token.balanceOf(owner.address);
    };

    beforeEach(async function () {
      await loadFixture(fixture, this);
    });

    const revertsOnPreconditions = function (burnFunction) {
      describe('Pre-condition', function () {
        it('reverts if the token does not exist', async function () {
          this.sender = owner;
          this.from = owner.address;
          await expectRevert(burnFunction.call(this, unknownNFT), this.token, errors.NonExistingToken, {
            tokenId: unknownNFT,
          });
        });

        it('reverts if `from` is not the token owner', async function () {
          this.sender = other;
          this.from = other.address;
          await expectRevert(burnFunction.call(this, nft1), this.token, errors.NonOwnedToken, {
            account: other.address,
            tokenId: nft1,
          });
        });

        it('reverts if the sender is not authorized for the token (token has no approval)', async function () {
          this.sender = other;
          this.from = owner.address;
          await expectRevert(burnFunction.call(this, nft3), this.token, errors.NonApprovedForTransfer, {
            sender: other.address,
            owner: owner.address,
            tokenId: nft3,
          });
        });

        it('reverts if the sender is not authorized for the token (sender is not the approved account)', async function () {
          this.sender = other;
          this.from = owner.address;
          await expectRevert(burnFunction.call(this, nft1), this.token, errors.NonApprovedForTransfer, {
            sender: other.address,
            owner: owner.address,
            tokenId: nft1,
          });
        });
      });
    };

    const canBeMintedAgain = function (ids) {
      ids = Array.isArray(ids) ? ids : [ids];

      if (mint_ERC721 !== undefined) {
        it('can be minted again, using mint(address,uint256)', async function () {
          for (const id of ids) {
            await mint_ERC721(this.token, owner.address, id, deployer);
          }
        });
      }

      if (batchMint_ERC721 !== undefined) {
        it('can be minted again, using batchMint(address,uint256[])', async function () {
          await batchMint_ERC721(this.token, owner.address, ids, deployer);
        });
      }

      if (safeMint_ERC721 !== undefined) {
        it('can be minted again, using safeMint(address,uint256,bytes)', async function () {
          for (const id of ids) {
            await safeMint_ERC721(this.token, owner.address, id, 0x0, deployer);
          }
        });
      }

      if (interfaces && interfaces.ERC721Deliverable) {
        it('can be minted again, using deliver(address[],uint256[])', async function () {
          await this.token.deliver(
            ids.map(() => owner.address),
            ids
          );
        });
      }

      if (safeMint_ERC1155 !== undefined) {
        it('can be minted again, using safeMint(address,uint256,uint256,bytes)', async function () {
          for (const id of ids) {
            await safeMint_ERC1155(this.token, owner.address, id, 1, '0x42');
          }
        });
      }

      if (safeBatchMint_ERC1155 !== undefined) {
        it('can be minted again, using safeBatchMint(address,uint256[],uint256[],bytes)', async function () {
          await safeBatchMint_ERC1155(
            this.token,
            owner.address,
            ids.map(([id]) => id),
            ids.map(() => 1),
            '0x42'
          );
        });
      }

      // if (interfaces && interfaces.ERC1155Deliverable) {
      //   it('can be minted again, using safeDeliver(address[],uint256[],uint256[],bytes)', async function () {
      //     await this.token.safeDeliver(
      //       ids.map(() => owner.address),
      //       ids,
      //       ids.map(() => 1),
      //       '0x42'
      //     );
      //   });
      // }
    };

    const cannotBeMintedAgain = function (ids) {
      ids = Array.isArray(ids) ? ids : [ids];

      it('[ERC721MintableOnce] wasBurnt(uint256) returns true', async function () {
        for (const id of ids) {
          expect(await this.token.wasBurnt(id)).to.be.true;
        }
      });

      if (mint_ERC721 !== undefined) {
        it('[ERC721MintableOnce] cannot be minted again, using mint(address,uint256)', async function () {
          for (const id of ids) {
            await expectRevert(mint_ERC721(this.token, owner.address, id, deployer), this.token, errors.BurntToken, {
              tokenId: id,
            });
          }
        });
      }

      if (batchMint_ERC721 !== undefined) {
        it('[ERC721MintableOnce] cannot be minted again, using batchMint(address,uint256[])', async function () {
          await expectRevert(batchMint_ERC721(this.token, owner.address, ids, deployer), this.token, errors.BurntToken, {
            tokenId: ids[0],
          });
        });
      }

      if (safeMint_ERC721 !== undefined) {
        it('[ERC721MintableOnce] cannot be minted again, using safeMint(address,uint256[],bytes)', async function () {
          for (const id of ids) {
            await expectRevert(safeMint_ERC721(this.token, owner.address, id, 0x0, deployer), this.token, errors.BurntToken, {
              tokenId: id,
            });
          }
        });
      }

      if (interfaces && interfaces.ERC721Deliverable) {
        it('[ERC721MintableOnce] cannot be minted again, using deliver(address[],uint256[])', async function () {
          await expectRevert(
            this.token.deliver(
              ids.map(() => owner.address),
              ids
            ),
            this.token,
            errors.BurntToken,
            {
              tokenId: ids[0],
            }
          );
        });
      }

      // if (safeMint_ERC1155 !== undefined) {
      //   it('[ERC721MintableOnce] cannot be minted again, using safeMint(address,uint256,uint256,bytes)', async function () {
      //     for (const id of ids) {
      //       await expectRevert(safeMint_ERC1155(this.token, owner.address, id, 1, '0x42'), this.token, errors.BurntToken, {
      //         tokenId: id,
      //       });
      //     }
      //   });
      // }

      // if (safeBatchMint_ERC1155 !== undefined) {
      //   it('[ERC721MintableOnce] cannot be minted again, using safeBatchMint(address,uint256[],uint256[],bytes)', async function () {
      //     await expectRevert(
      //       safeBatchMint_ERC1155(
      //         this.token,
      //         owner.address,
      //         ids.map(([id]) => id),
      //         ids.map(() => 1),
      //         '0x42'
      //       ),
      //       this.token,
      //       errors.BurntToken,
      //       {
      //         tokenId: ids[0],
      //       }
      //     );
      //   });
      // }

      // if (interfaces.ERC1155Deliverable) {
      //   it('[ERC721MintableOnce] cannot be minted again, using safeDeliver(address[],uint256[],uint256[],bytes)', async function () {
      //     await expectRevert(
      //       this.token.safeDeliver(
      //         ids.map(() => owner.address),
      //         ids,

      //         ids.map(() => 1),
      //         '0x42'
      //       ),
      //       this.token,
      //       errors.BurntToken,
      //       {
      //         tokenId: ids[0],
      //       }
      //     );
      //   });
      // }
    };

    const burnWasSuccessful = function (tokenIds) {
      const ids = Array.isArray(tokenIds) ? tokenIds : [tokenIds];

      it('clears the ownership of the token(s)', async function () {
        for (const id of ids) {
          await expectRevert(this.token.ownerOf(id), this.token, errors.NonExistingToken, {tokenId: id});
        }
      });

      it('clears the approval for the token(s)', async function () {
        for (const id of ids) {
          await expectRevert(this.token.getApproved(id), this.token, errors.NonExistingToken, {tokenId: id});
        }
      });

      it('decreases the sender balance', async function () {
        expect(await this.token.balanceOf(owner.address)).to.equal(this.nftBalance - ids.length);
      });

      it('emits Transfer event(s)', async function () {
        for (const id of ids) {
          await expect(this.receipt).to.emit(this.token, 'Transfer').withArgs(owner.address, constants.AddressZero, id);
        }
      });

      if (ids.length > 0) {
        if (features && features.ERC721MintableOnce) {
          cannotBeMintedAgain(ids);
        } else {
          canBeMintedAgain(ids);
        }
      }
    };

    const burnsBySender = function (burnFunction, ids) {
      context('when called by the owner', function () {
        beforeEach(async function () {
          this.sender = owner;
          this.from = owner.address;
          this.receipt = await burnFunction.call(this, ids);
        });
        burnWasSuccessful(ids, owner);
      });

      context('when called by a wallet with single token approval', function () {
        beforeEach(async function () {
          this.sender = approved;
          this.from = owner.address;
          this.receipt = await burnFunction.call(this, ids);
        });
        burnWasSuccessful(ids, approved);
      });

      context('when called by an operator', function () {
        beforeEach(async function () {
          this.sender = operator;
          this.from = owner.address;
          this.receipt = await burnFunction.call(this, ids);
        });
        burnWasSuccessful(ids, operator);
      });
    };

    if (burnFrom !== undefined) {
      describe('burnFrom(address,uint256)', function () {
        const burnFn = async function (tokenId) {
          return burnFrom(this.token, this.from, tokenId, this.sender);
        };
        revertsOnPreconditions(burnFn);
        burnsBySender(burnFn, nft1);
      });
    }

    if (batchBurnFrom !== undefined) {
      describe('batchBurnFrom(address,uint256[])', function () {
        const burnFn = async function (tokenIds) {
          const ids = Array.isArray(tokenIds) ? tokenIds : [tokenIds];
          return batchBurnFrom(this.token, this.from, ids, this.sender);
        };
        revertsOnPreconditions(burnFn);

        context('with an empty list of tokens', function () {
          burnsBySender(burnFn, []);
        });

        context('with a single token', function () {
          burnsBySender(burnFn, [nft1]);
        });

        context('with a list of tokens from the same collection', function () {
          burnsBySender(burnFn, [nft1, nft2]);
        });
      });
    }

    if (interfaces && interfaces.ERC721Burnable) {
      supportsInterfaces(['IERC721Burnable']);
    }
  });
}

module.exports = {
  behavesLikeERC721Burnable,
};
