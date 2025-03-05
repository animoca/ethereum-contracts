const {ethers} = require('hardhat');
const {expect} = require('chai');
const {expectRevert} = require('@animoca/ethereum-contract-helpers/src/test/revert');
const {loadFixture} = require('@animoca/ethereum-contract-helpers/src/test/fixtures');
const {supportsInterfaces} = require('../../../introspection/behaviors/SupportsInterface.behavior');
const {decodeSignature} = require('@animoca/ethereum-contract-helpers/src/test/signing');

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
  const {features, errors, deploy} = implementation;

  describe('like an ERC20 Permit', function () {
    let deployer, owner, spender, other;

    const initialSupply = 100n;
    const noDeadline = ethers.MaxUint256;

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
        verifyingContract: await this.contract.getAddress(),
      };
    };

    beforeEach(async function () {
      await loadFixture(fixture, this);
    });

    describe('permit(address,address,uint256,uint256,uint8,bytes32,bytes32)', function () {
      it('reverts when the permit is invalid', async function () {
        const nonce = await this.contract.nonces(owner.address);
        const signature = decodeSignature(
          await owner.signTypedData(this.domain, PermitType, {
            owner: owner.address,
            spender: spender.address,
            value: 1,
            nonce: nonce + 1n, // invalid nonce
            deadline: ethers.MaxUint256,
          }),
        );
        await expectRevert(
          this.contract.permit(owner.address, spender.address, nonce, ethers.MaxUint256, signature.v, signature.r, signature.s),
          this.contract,
          errors.PermitInvalid,
        );
      });

      it('reverts when using the zero address as owner/signer', async function () {
        const signature = decodeSignature(
          await owner.signTypedData(this.domain, PermitType, {
            owner: owner.address,
            spender: spender.address,
            value: 1,
            nonce: await this.contract.nonces(owner.address),
            deadline: 0,
          }),
        );
        await expectRevert(
          this.contract.permit(ethers.ZeroAddress, spender.address, 1, 0, signature.v, signature.r, signature.s),
          this.contract,
          errors.PermitFromAddressZero,
        );
      });

      it('reverts when the permit is expired', async function () {
        const signature = decodeSignature(
          await owner.signTypedData(this.domain, PermitType, {
            owner: owner.address,
            spender: spender.address,
            value: 1,
            nonce: await this.contract.nonces(owner.address),
            deadline: 0,
          }),
        );
        await expectRevert(
          this.contract.permit(owner.address, spender.address, 1, 0, signature.v, signature.r, signature.s),
          this.contract,
          errors.PermitExpired,
          {
            deadline: 0,
          },
        );
      });

      context('when the permit is valid', function () {
        const value = 1;
        const deadline = noDeadline;

        beforeEach(async function () {
          this.nonce = await this.contract.nonces(owner.address);
          this.signature = decodeSignature(
            await owner.signTypedData(this.domain, PermitType, {
              owner: owner.address,
              spender: spender.address,
              value: 1,
              nonce: await this.nonce,
              deadline: noDeadline,
            }),
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
              this.signature.s,
            );
          });

          it('updates the permit nonce of the owner correctly', async function () {
            expect(await this.contract.nonces(owner.address)).to.equal(this.nonce + 1n);
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
        expect(await this.contract.nonces(other.address)).to.equal(0);
      });
    });

    describe('DOMAIN_SEPARATOR()', function () {
      it('returns the correct domain separator', async function () {
        expect(await this.contract.DOMAIN_SEPARATOR()).to.equal(ethers.TypedDataEncoder.hashDomain(this.domain));
      });
    });

    if (features && features.ERC165) {
      supportsInterfaces(['contracts/token/ERC20/interfaces/IERC20Permit.sol:IERC20Permit']);
    }
  });
}

module.exports = {
  behavesLikeERC20Permit,
};
