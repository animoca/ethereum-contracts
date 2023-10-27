const {ethers} = require('hardhat');
const {expect} = require('chai');
const {expectRevert} = require('@animoca/ethereum-contract-helpers/src/test/revert');
const {loadFixture} = require('@animoca/ethereum-contract-helpers/src/test/fixtures');
const {deployContract} = require('@animoca/ethereum-contract-helpers/src/test/deploy');
const {supportsInterfaces} = require('../../../introspection/behaviors/SupportsInterface.behavior');

function behavesLikeERC721Standard({deploy, mint, errors}, operatorFilterRegistryAddress = null) {
  describe('like an ERC721', function () {
    let accounts, deployer, owner, approved, operator, other;

    before(async function () {
      accounts = await ethers.getSigners();
      [deployer, owner, approved, operator, other] = accounts;
    });

    const nft1 = 1;
    const nft2 = 2;
    const nft3 = 3;
    const unknownNFT = 1000;

    const fixture = async function () {
      this.token = await deploy(deployer);
      await mint(this.token, owner.address, nft1, 1, deployer);
      await mint(this.token, owner.address, nft2, 1, deployer);
      await mint(this.token, owner.address, nft3, 1, deployer);
      await this.token.connect(owner).approve(approved.address, nft1);
      await this.token.connect(owner).approve(approved.address, nft2);
      await this.token.connect(owner).setApprovalForAll(operator.address, true);
      this.receiver721 = await deployContract('ERC721ReceiverMock', true, await this.token.getAddress());
      this.refusingReceiver721 = await deployContract('ERC721ReceiverMock', false, await this.token.getAddress());
      this.wrongTokenReceiver721 = await deployContract('ERC721ReceiverMock', true, ethers.ZeroAddress);
      this.nftBalance = await this.token.balanceOf(owner.address);
      if (operatorFilterRegistryAddress !== null) {
        await this.token.updateOperatorFilterRegistry(operatorFilterRegistryAddress);
      }
    };

    beforeEach(async function () {
      await loadFixture(fixture, this);
    });

    describe('balanceOf(address)', function () {
      it('reverts if querying the zero address', async function () {
        await expectRevert(this.token.balanceOf(ethers.ZeroAddress), this.token, errors.BalanceOfAddressZero);
      });

      it('returns the amount of tokens owned', async function () {
        expect(await this.token.balanceOf(other.address)).to.equal(0);
        expect(await this.token.balanceOf(owner.address)).to.equal(3);
      });
    });

    describe('ownerOf(uint256)', function () {
      it('reverts if the token does not exist', async function () {
        await expectRevert(this.token.ownerOf(unknownNFT), this.token, errors.NonExistingToken, {
          tokenId: unknownNFT,
        });
      });

      it('returns the owner of the token', async function () {
        expect(await this.token.ownerOf(nft1)).to.equal(owner.address);
      });
    });

    const revertsOnPreconditions = function (transferFunction, data) {
      describe('Pre-conditions', function () {
        it('reverts if transferred to the zero address', async function () {
          this.sender = owner;
          this.from = owner.address;
          this.to = ethers.ZeroAddress;
          await expectRevert(transferFunction.call(this, nft1, data), this.token, errors.TransferToAddressZero);
        });

        it('reverts if the token does not exist', async function () {
          this.sender = owner;
          this.from = owner.address;
          this.to = other.address;
          await expectRevert(transferFunction.call(this, unknownNFT, data), this.token, errors.NonExistingToken, {
            tokenId: unknownNFT,
          });
        });

        it('reverts if `from` is not the token owner', async function () {
          this.sender = other;
          this.from = other.address;
          this.to = other.address;
          await expectRevert(transferFunction.call(this, nft1, data), this.token, errors.NonOwnedToken, {
            account: other.address,
            tokenId: nft1,
          });
        });

        it('reverts if the sender is not authorized for the token (token has no approval)', async function () {
          this.sender = other;
          this.from = owner.address;
          this.to = other.address;
          await expectRevert(transferFunction.call(this, nft3, data), this.token, errors.NonApprovedForTransfer, {
            sender: other.address,
            owner: owner.address,
            tokenId: nft3,
          });
        });

        it('reverts if the sender is not authorized for the token (token has approval but the sender is not approved)', async function () {
          this.sender = other;
          this.from = owner.address;
          this.to = other.address;
          await expectRevert(transferFunction.call(this, nft1, data), this.token, errors.NonApprovedForTransfer, {
            sender: other.address,
            owner: owner.address,
            tokenId: nft1,
          });
        });

        if (data !== undefined) {
          it('reverts if sent to a non-receiver contract', async function () {
            this.sender = owner;
            this.from = owner.address;
            this.to = await this.token.getAddress();
            await expect(transferFunction.call(this, nft1, data)).to.be.reverted;
          });
          it('reverts if sent to an ERC721Receiver which reverts', async function () {
            this.sender = owner;
            this.from = owner.address;
            this.to = await this.wrongTokenReceiver721.getAddress();
            await expect(transferFunction.call(this, nft1, data)).to.be.reverted;
          });
          it('reverts if sent to an ERC721Receiver which rejects the transfer', async function () {
            this.sender = owner;
            this.from = owner.address;
            this.to = await this.refusingReceiver721.getAddress();
            await expectRevert(transferFunction.call(this, nft1, data), this.token, errors.SafeTransferRejected, {
              recipient: this.to,
              tokenId: nft1,
            });
          });
        }
      });
    };

    const transferWasSuccessful = function (tokenId, data, isERC721Receiver, selfTransfer) {
      if (selfTransfer) {
        it('does not affect the token ownership', async function () {
          expect(await this.token.ownerOf(tokenId)).to.equal(this.from);
        });
      } else {
        it('gives the token ownership to the recipient', async function () {
          expect(await this.token.ownerOf(tokenId)).to.equal(this.to);
        });
      }

      it('clears the approval for the token', async function () {
        expect(await this.token.getApproved(tokenId)).to.equal(ethers.ZeroAddress);
      });

      it('emits a Transfer event', async function () {
        await expect(this.receipt).to.emit(this.token, 'Transfer').withArgs(this.from, this.to, tokenId);
      });

      if (selfTransfer) {
        it('does not affect the owner balance', async function () {
          expect(await this.token.balanceOf(this.from)).to.equal(this.nftBalance);
        });
      } else {
        it('decreases the owner balance', async function () {
          expect(await this.token.balanceOf(this.from)).to.equal(this.nftBalance - 1n);
        });

        it('increases the recipients balance', async function () {
          expect(await this.token.balanceOf(this.to)).to.equal(1);
        });
      }

      if (data !== undefined && isERC721Receiver) {
        it('calls on ERC721Received', async function () {
          await expect(this.receipt).to.emit(this.receiver721, 'ERC721Received').withArgs(this.sender.address, this.from, tokenId, data);
        });
      }
    };

    const transfersBySender = function (transferFunction, tokenId, data, isERC721Receiver, selfTransfer) {
      context('when called by the owner', function () {
        beforeEach(async function () {
          this.sender = owner;
          this.receipt = await transferFunction.call(this, tokenId, data);
        });
        transferWasSuccessful(tokenId, data, isERC721Receiver, selfTransfer);
      });
      context('when called by a wallet with single token approval', function () {
        beforeEach(async function () {
          this.sender = approved;
          this.receipt = await transferFunction.call(this, tokenId, data);
        });
        transferWasSuccessful(tokenId, data, isERC721Receiver, selfTransfer);
      });
      context('when called by an operator', function () {
        beforeEach(async function () {
          this.sender = operator;
          this.receipt = await transferFunction.call(this, tokenId, data);
        });
        transferWasSuccessful(tokenId, data, isERC721Receiver, selfTransfer);
      });
    };

    const transfersByRecipient = function (transferFunction, tokenId, data) {
      context('when sent to another wallet', function () {
        beforeEach(async function () {
          this.from = owner.address;
          this.to = other.address;
        });
        transfersBySender(transferFunction, tokenId, data, false);
      });

      context('when sent to the same owner', function () {
        this.beforeEach(async function () {
          this.from = owner.address;
          this.to = owner.address;
        });
        const selfTransfer = true;
        transfersBySender(transferFunction, tokenId, data, false, selfTransfer);
      });

      context('when sent to an ERC721Receiver contract', function () {
        this.beforeEach(async function () {
          this.from = owner.address;
          this.to = await this.receiver721.getAddress();
        });
        transfersBySender(transferFunction, tokenId, data, true);
      });
    };

    describe('transferFrom(address,address,uint256)', function () {
      const transferFn = async function (tokenId, _data) {
        return this.token.connect(this.sender).transferFrom(this.from, this.to, tokenId);
      };
      const data = undefined;
      revertsOnPreconditions(transferFn, data);
      transfersByRecipient(transferFn, nft1, data);
    });

    describe('safeTransferFrom(address,address,uint256)', function () {
      const transferFn = async function (tokenId, _data) {
        return this.token.connect(this.sender)['safeTransferFrom(address,address,uint256)'](this.from, this.to, tokenId);
      };
      const data = '0x';
      revertsOnPreconditions(transferFn, data);
      transfersByRecipient(transferFn, nft1, data);
    });

    describe('safeTransferFrom(address,address,uint256,bytes)', function () {
      const transferFn = async function (tokenId, data) {
        return this.token.connect(this.sender)['safeTransferFrom(address,address,uint256,bytes)'](this.from, this.to, tokenId, data);
      };
      const data = '0x42';
      revertsOnPreconditions(transferFn, data);
      transfersByRecipient(transferFn, nft1, data);
    });

    describe('approve(address,address)', function () {
      it('reverts if the token does not exist', async function () {
        await expectRevert(this.token.connect(owner).approve(approved.address, unknownNFT), this.token, errors.NonExistingToken, {
          tokenId: unknownNFT,
        });
      });

      it('reverts in case of self-approval', async function () {
        await expectRevert(this.token.connect(owner).approve(owner.address, nft1), this.token, errors.SelfApproval, {
          account: owner.address,
        });
      });

      it('reverts if the sender does not own the token and is not an operator for the owner', async function () {
        await expectRevert(this.token.connect(other).approve(approved.address, nft1), this.token, errors.NonApprovedForApproval, {
          sender: other.address,
          owner: owner.address,
          tokenId: nft1,
        });
      });

      it('reverts if the sender has an approval for the token', async function () {
        await expectRevert(this.token.connect(approved).approve(other.address, nft1), this.token, errors.NonApprovedForApproval, {
          sender: approved.address,
          owner: owner.address,
          tokenId: nft1,
        });
      });

      function approvalWasSuccessful(tokenId) {
        it('sets the token approval', async function () {
          expect(await this.token.getApproved(tokenId)).to.equal(this.approvedAddress);
        });

        it('emits an Approval event', async function () {
          await expect(this.receipt).to.emit(this.token, 'Approval').withArgs(owner.address, this.approvedAddress, tokenId);
        });
      }

      function setApprovalBySender(tokenId) {
        context('when sent by the token owner', function () {
          beforeEach(async function () {
            this.receipt = await this.token.connect(owner).approve(this.approvedAddress, tokenId);
          });
          approvalWasSuccessful(tokenId);
        });

        context('when sent by an operator for the token owner', function () {
          beforeEach(async function () {
            this.receipt = await this.token.connect(operator).approve(this.approvedAddress, tokenId);
          });
          approvalWasSuccessful(tokenId);
        });
      }

      context('when setting an approval', function () {
        context('when there was no prior approval', function () {
          beforeEach(async function () {
            this.approvedAddress = approved.address;
          });
          setApprovalBySender(nft3);
        });

        context('when there was a prior approval to the same address', function () {
          beforeEach(async function () {
            this.approvedAddress = approved.address;
          });
          setApprovalBySender(nft1);
        });

        context('when there was a prior approval to a different address', function () {
          this.beforeEach(async function () {
            this.approvedAddress = other.address;
          });
          setApprovalBySender(nft1);
        });
      });

      context('when clearing an approval', function () {
        context('when there was no prior approval', function () {
          beforeEach(async function () {
            this.approvedAddress = ethers.ZeroAddress;
          });
          setApprovalBySender(nft3);
        });
        context('when there was a prior approval', function () {
          beforeEach(async function () {
            this.approvedAddress = ethers.ZeroAddress;
          });
          setApprovalBySender(nft1);
        });
      });
    });

    describe('getApproved(uint256)', function () {
      it('reverts if the token does not exist', async function () {
        await expectRevert(this.token.getApproved(unknownNFT), this.token, errors.NonExistingToken, {
          tokenId: unknownNFT,
        });
      });

      it('returns the approved address if an approval was set', async function () {
        expect(await this.token.getApproved(nft1)).to.equal(approved.address);
      });

      it('returns the zero address if no approval was set', async function () {
        expect(await this.token.getApproved(nft3)).to.equal(ethers.ZeroAddress);
      });
    });

    describe('setApprovalForAll(address,bool)', function () {
      it('reverts in case of self-approval', async function () {
        await expectRevert(this.token.connect(owner).setApprovalForAll(owner.address, true), this.token, errors.SelfApprovalForAll, {
          account: owner.address,
        });
        await expectRevert(this.token.connect(owner).setApprovalForAll(owner.address, false), this.token, errors.SelfApprovalForAll, {
          account: owner.address,
        });
      });

      context('when setting an operator', function () {
        beforeEach(async function () {
          this.receipt = await this.token.connect(owner).setApprovalForAll(other.address, true);
        });
        it('sets the operator', async function () {
          expect(await this.token.isApprovedForAll(owner.address, other.address)).to.be.true;
        });
        it('emits an ApprovalForAll event', async function () {
          await expect(this.receipt).to.emit(this.token, 'ApprovalForAll').withArgs(owner.address, other.address, true);
        });
      });

      context('when unsetting an operator', function () {
        beforeEach(async function () {
          this.receipt = await this.token.connect(owner).setApprovalForAll(operator.address, false);
        });
        it('unsets the operator', async function () {
          expect(await this.token.isApprovedForAll(owner.address, operator.address)).to.be.false;
        });
        it('emits an ApprovalForAll event', async function () {
          await expect(this.receipt).to.emit(this.token, 'ApprovalForAll').withArgs(owner.address, operator.address, false);
        });
      });
    });

    describe('isApprovedForAll(address,address)', function () {
      it('returns true for an operator', async function () {
        expect(await this.token.isApprovedForAll(owner.address, operator.address)).to.equal(true);
      });

      it('returns false for a non-operator', async function () {
        expect(await this.token.isApprovedForAll(owner.address, other.address)).to.equal(false);
      });
    });

    supportsInterfaces(['IERC165', 'IERC721']);
  });
}

module.exports = {
  behavesLikeERC721Standard,
};
