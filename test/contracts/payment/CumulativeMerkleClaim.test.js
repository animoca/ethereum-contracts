const {ethers} = require('hardhat');
const {expect} = require('chai');
const {MerkleTree} = require('merkletreejs');
const keccak256 = require('keccak256');
const {deployContract} = require('@animoca/ethereum-contract-helpers/src/test/deploy');
const {loadFixture} = require('@animoca/ethereum-contract-helpers/src/test/fixtures');

describe('CumulativeMerkleClaim', function () {
  let other;

  before(async function () {
    [deployer, claimer1, claimer2, claimer3, claimer4, other] = await ethers.getSigners();
  });

  const fixture = async function () {
    this.contract = await deployContract('CumulativeMerkleClaimMock');
  };

  beforeEach(async function () {
    await loadFixture(fixture, this);
  });

  context('constructor', function () {
    it('is paused at construction', async function () {
      expect(await this.contract.paused()).to.be.true;
    });
  });

  context('setMerkleRoot(bytes32)', function () {
    it('reverts if not sent by the contract owner', async function () {
      await expect(this.contract.connect(other).setMerkleRoot(ethers.ZeroHash))
        .to.be.revertedWithCustomError(this.contract, 'NotContractOwner')
        .withArgs(other.address);
    });
    it('reverts if the contract is not paused', async function () {
      await this.contract.unpause();
      await expect(this.contract.setMerkleRoot(ethers.ZeroHash)).to.be.revertedWithCustomError(this.contract, 'NotPaused');
    });
    it('increments the nonce', async function () {
      const nonce = await this.contract.nonce();
      await this.contract.setMerkleRoot(ethers.ZeroHash);
      expect(await this.contract.nonce()).to.equal(nonce + 1n);
    });

    it('unpauses the contract', async function () {
      await this.contract.setMerkleRoot(ethers.ZeroHash);
      expect(await this.contract.paused()).to.be.false;
    });
    it('emits a MerkleRootSet event', async function () {
      const root = ethers.ZeroHash;
      await expect(this.contract.setMerkleRoot(root)).to.emit(this.contract, 'MerkleRootSet').withArgs(root);
    });

    it('emits an Unpaused event', async function () {
      await expect(this.contract.setMerkleRoot(ethers.ZeroHash)).to.emit(this.contract, 'Unpause');
    });
  });

  context('claimPayout(address,bytes,bytes32[])', function () {
    it('reverts if the contract is paused', async function () {
      await expect(this.contract.claimPayout(ethers.ZeroAddress, ethers.ZeroHash, [])).to.be.revertedWithCustomError(this.contract, 'Paused');
    });
    context('with a merkle root set', function () {
      beforeEach(async function () {
        this.nextNonce = (await this.contract.nonce()) + 1n;

        this.elements = [
          {
            claimer: claimer1.address,
            amount: 1n,
          },
          {
            claimer: claimer2.address,
            amount: 2n,
          },
          {
            claimer: claimer3.address,
            amount: 3n,
          },
          {
            claimer: claimer4.address,
            amount: 4n,
          },
        ];
        this.leaves = this.elements.map((el) =>
          ethers.solidityPacked(
            ['address', 'bytes', 'uint256'],
            [el.claimer, ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [el.amount]), this.nextNonce],
          ),
        );
        this.tree = new MerkleTree(this.leaves, keccak256, {hashLeaves: true, sortPairs: true});
        this.root = this.tree.getHexRoot();
        await this.contract.setMerkleRoot(this.root);
      });
      it('reverts with InvalidProof if the proof canot be verified', async function () {
        const claimData = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [this.elements[0].amount]);
        await expect(this.contract.claimPayout(deployer.address, claimData, this.tree.getHexProof(keccak256(this.leaves[0]))))
          .to.revertedWithCustomError(this.contract, 'InvalidProof')
          .withArgs(deployer.address, claimData, this.nextNonce);
      });
      it('reverts with AlreadyClaimed if the leaf is claimed twice', async function () {
        const claimData = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [this.elements[0].amount]);
        await this.contract.claimPayout(this.elements[0].claimer, claimData, this.tree.getHexProof(keccak256(this.leaves[0])));
        await expect(this.contract.claimPayout(this.elements[0].claimer, claimData, this.tree.getHexProof(keccak256(this.leaves[0]))))
          .to.revertedWithCustomError(this.contract, 'AlreadyClaimed')
          .withArgs(this.elements[0].claimer, claimData, this.nextNonce);
      });
      it('emits a PayoutClaimed event', async function () {
        const claimData = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [this.elements[0].amount]);
        await expect(this.contract.claimPayout(this.elements[0].claimer, claimData, this.tree.getHexProof(keccak256(this.leaves[0]))))
          .to.emit(this.contract, 'PayoutClaimed')
          .withArgs(this.root, this.elements[0].claimer, claimData, this.nextNonce);
      });
      it('calls the distribution function with correct arguments', async function () {
        const claimData = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [this.elements[0].amount]);
        await expect(this.contract.claimPayout(this.elements[0].claimer, claimData, this.tree.getHexProof(keccak256(this.leaves[0]))))
          .to.emit(this.contract, 'Distributed')
          .withArgs(this.elements[0].claimer, this.elements[0].amount);
      });
    });
  });
});
