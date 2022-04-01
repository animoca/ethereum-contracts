const {ethers} = require('hardhat');
const {loadFixture} = require('../../../../helpers/fixtures');
const {shouldSupportInterfaces} = require('../../../introspection/behaviors/SupportsInterface.behavior');
const {decodeSignature} = require('../../../../helpers/signing');

const {Zero, One, MaxUInt256, ZeroAddress} = require('../../../../../src/constants');

const PermitType = {
  Permit: [
    {name: 'owner', type: 'address'},
    {name: 'spender', type: 'address'},
    {name: 'value', type: 'uint256'},
    {name: 'nonce', type: 'uint256'},
    {name: 'deadline', type: 'uint256'},
  ],
};

function behavesLikeERC20Permit(implementation) {
  const {features, revertMessages, deploy} = implementation;

  describe('like a permit ERC20', function () {
    let deployer, owner, spender, other;

    const initialSupply = ethers.BigNumber.from('100');
    const noDeadline = MaxUInt256;

    before(async function () {
      [deployer, owner, spender, other] = await ethers.getSigners();
    });

    const fixture = async function () {
      this.contract = await deploy([owner.address], [initialSupply], deployer);
      this.chainId = await getChainId();
      this.domain = {
        name: implementation.name,
        version: '1',
        chainId: await getChainId(),
        verifyingContract: this.contract.address,
      };
    };

    beforeEach(async function () {
      await loadFixture(fixture, this);
    });

    describe('permit(address,address,uint256,uint256,uint8,bytes32,bytes32)', function () {
      it('reverts when the permit is invalid', async function () {
        const nonce = await this.contract.nonces(owner.address);
        const signature = decodeSignature(
          await owner._signTypedData(this.domain, PermitType, {
            owner: owner.address,
            spender: spender.address,
            value: One,
            nonce: nonce.add(One), // invalid nonce
            deadline: MaxUInt256,
          })
        );
        await expect(
          this.contract.permit(owner.address, spender.address, nonce, MaxUInt256, signature.v, signature.r, signature.s)
        ).to.be.revertedWith(revertMessages.PermitInvalid);
      });

      it('reverts when using the zero address as owner/signer', async function () {
        const signature = decodeSignature(
          await owner._signTypedData(this.domain, PermitType, {
            owner: owner.address,
            spender: spender.address,
            value: One,
            nonce: await this.contract.nonces(owner.address),
            deadline: 0,
          })
        );
        await expect(this.contract.permit(ZeroAddress, spender.address, One, 0, signature.v, signature.r, signature.s)).to.be.revertedWith(
          revertMessages.PermitFromZero
        );
      });

      it('reverts when the permit is expired', async function () {
        const signature = decodeSignature(
          await owner._signTypedData(this.domain, PermitType, {
            owner: owner.address,
            spender: spender.address,
            value: One,
            nonce: await this.contract.nonces(owner.address),
            deadline: 0,
          })
        );
        await expect(this.contract.permit(owner.address, spender.address, One, 0, signature.v, signature.r, signature.s)).to.be.revertedWith(
          revertMessages.PermitExpired
        );
      });

      context('when the permit is valid', function () {
        const value = One;
        const deadline = noDeadline;

        beforeEach(async function () {
          this.nonce = await this.contract.nonces(owner.address);
          this.signature = decodeSignature(
            await owner._signTypedData(this.domain, PermitType, {
              owner: owner.address,
              spender: spender.address,
              value: One,
              nonce: await this.nonce,
              deadline: noDeadline,
            })
          );
        });

        context('when successful', function () {
          beforeEach(async function () {
            this.receipt = await this.contract.permit(
              owner.address,
              spender.address,
              value,
              deadline,
              this.signature.v,
              this.signature.r,
              this.signature.s
            );
          });

          it('updates the permit nonce of the owner correctly', async function () {
            expect(await this.contract.nonces(owner.address)).to.equal(this.nonce.add(One));
          });

          it('approves the spender allowance from the owner', async function () {
            expect(await this.contract.allowance(owner.address, spender.address)).to.equal(value);
          });

          it('emits the Approval event', async function () {
            expect(this.receipt).to.emit(this.contract, 'Approval').withArgs(owner.address, spender.address, value);
          });
        });
      });
    });

    describe('nonces(address)', function () {
      it('returns zero when the nonce is for an account with no previous permits', async function () {
        expect(await this.contract.nonces(other.address)).to.equal(Zero);
      });
    });

    describe('DOMAIN_SEPARATOR()', function () {
      it('returns the correct domain separator', async function () {
        expect(await this.contract.DOMAIN_SEPARATOR()).to.equal(ethers.utils._TypedDataEncoder.hashDomain(this.domain));
      });
    });

    if (features.ERC165) {
      shouldSupportInterfaces(['IERC20Permit']);
    }
  });
}

module.exports = {
  behavesLikeERC20Permit,
};
