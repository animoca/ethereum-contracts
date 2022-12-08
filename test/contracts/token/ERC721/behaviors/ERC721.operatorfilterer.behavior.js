const {ethers} = require('hardhat');
const {expect} = require('chai');
const {loadFixture} = require('../../../../helpers/fixtures');
const {deployContract} = require('../../../../helpers/contract');
const {ZeroAddress} = require('../../../../../src/constants');

function behavesLikeERC721WithOperatorFilterer({name, deploy, mint, methods}) {
  const {'batchTransferFrom(address,address,uint256[])': batchTransferFrom_ERC721} = methods;

  describe('like an ERC721 with OperatorFilterer', function () {
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
      await this.token.connect(owner).setApprovalForAll(operator.address, true);
      this.nftBalance = await this.token.balanceOf(owner.address);
      this.refusingOperatorRegistry = await deployContract('OperatorFilterRegistryMock', false);
      await this.token.updateOperatorFilterRegistry(this.refusingOperatorRegistry.address);
    };

    beforeEach(async function () {
      await loadFixture(fixture, this);
    });

    describe('operatorFilterRegistry()', function () {
      it('returns the correct value', async function () {
        expect(await this.token.operatorFilterRegistry()).to.equal(this.refusingOperatorRegistry.address);
      });
    });

    describe('single transfers', function () {
      const revertsOnPreconditions = function (transferFunction, data) {
        describe('Pre-conditions', function () {
          it('reverts if transferred by a non-allowed approved address', async function () {
            this.sender = approved;
            this.from = owner.address;
            this.to = other.address;
            await expect(transferFunction.call(this, nft1, data))
              .to.be.revertedWithCustomError(this.token, 'OperatorNotAllowed')
              .withArgs(approved.address);
          });

          it('reverts if transferred by a non-allowed operator', async function () {
            this.sender = operator;
            this.from = owner.address;
            this.to = other.address;
            await expect(transferFunction.call(this, nft1, data))
              .to.be.revertedWithCustomError(this.token, 'OperatorNotAllowed')
              .withArgs(operator.address);
          });
        });
      };

      describe('transferFrom(address,address,uint256)', function () {
        const transferFn = async function (tokenId, _data) {
          return this.token.connect(this.sender).transferFrom(this.from, this.to, tokenId);
        };
        const data = undefined;
        revertsOnPreconditions(transferFn, data);
      });

      describe('safeTransferFrom(address,address,uint256)', function () {
        const transferFn = async function (tokenId, _data) {
          return this.token.connect(this.sender)['safeTransferFrom(address,address,uint256)'](this.from, this.to, tokenId);
        };
        const data = '0x';
        revertsOnPreconditions(transferFn, data);
      });

      describe('safeTransferFrom(address,address,uint256,bytes)', function () {
        const transferFn = async function (tokenId, data) {
          return this.token.connect(this.sender)['safeTransferFrom(address,address,uint256,bytes)'](this.from, this.to, tokenId, data);
        };
        const data = '0x42';
        revertsOnPreconditions(transferFn, data);
      });
    });

    if (batchTransferFrom_ERC721 !== undefined) {
      describe('batch transfers', function () {
        describe('batchTransferFrom(address,adress,uint256[])', function () {
          describe('Pre-conditions', function () {
            it('reverts if transferred by a non-allowed approved address', async function () {
              await expect(batchTransferFrom_ERC721(this.token, owner.address, other.address, [nft1], approved))
                .to.be.revertedWithCustomError(this.token, 'OperatorNotAllowed')
                .withArgs(approved.address);
            });

            it('reverts if transferred by a non-allowed operator', async function () {
              await expect(batchTransferFrom_ERC721(this.token, owner.address, other.address, [nft1], operator))
                .to.be.revertedWithCustomError(this.token, 'OperatorNotAllowed')
                .withArgs(operator.address);
            });
          });
        });
      });
    }

    describe('approve(address,address)', function () {
      it('reverts when setting an approval', async function () {
        await expect(this.token.connect(owner).approve(approved.address, unknownNFT))
          .to.be.revertedWithCustomError(this.token, 'OperatorNotAllowed')
          .withArgs(approved.address);
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

      context('when clearing an approval', function () {
        context('when there was no prior approval', function () {
          beforeEach(async function () {
            this.approvedAddress = ZeroAddress;
          });
          setApprovalBySender(nft3);
        });
        context('when there was a prior approval', function () {
          beforeEach(async function () {
            this.approvedAddress = ZeroAddress;
          });
          setApprovalBySender(nft1);
        });
      });
    });

    describe('setApprovalForAll(address,bool)', function () {
      it('reverts when setting an operator', async function () {
        await expect(this.token.connect(owner).setApprovalForAll(other.address, true))
          .to.be.revertedWithCustomError(this.token, 'OperatorNotAllowed')
          .withArgs(other.address);
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
  });
}

module.exports = {
  behavesLikeERC721WithOperatorFilterer,
};
