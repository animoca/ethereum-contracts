const {ethers} = require('hardhat');
const {expect} = require('chai');
const {ZeroAddress} = require('../../../src/constants');
const {loadFixture} = require('../../helpers/fixtures');
const {deployContract} = require('../../helpers/contract');

const ForwarderApprovalType = {
  ForwarderApproval: [
    {name: 'forwarder', type: 'address'},
    {name: 'approved', type: 'bool'},
    {name: 'nonce', type: 'uint256'},
  ],
};

// TODO: missing test for EIP-712 in case of network fork.
// pending https://github.com/NomicFoundation/hardhat/issues/3074

describe('Meta Transactions', function () {
  let deployer, other;

  before(async function () {
    [deployer, other] = await ethers.getSigners();
  });

  const fixture = async function () {
    this.contract = await deployContract('ForwarderRegistry');
    this.forwarder = await deployContract('ForwarderMock');
    this.receiver = await deployContract('ForwarderRegistryReceiverMock', this.contract.address);
    this.erc1271 = await deployContract('ERC1271Mock', deployer.address);

    this.domain = {
      name: 'ForwarderRegistry',
      chainId: await getChainId(),
      verifyingContract: this.contract.address,
    };
  };

  beforeEach(async function () {
    await loadFixture(fixture, this);
  });

  describe('ForwarderRegistry', function () {
    describe('isTrustedForwarder(address)', function () {
      it('always returns true', async function () {
        expect(await this.contract.isTrustedForwarder(ZeroAddress)).to.be.true;
        expect(await this.contract.isTrustedForwarder(deployer.address)).to.be.true;
        expect(await this.contract.isTrustedForwarder(other.address)).to.be.true;
        expect(await this.contract.isTrustedForwarder(this.contract.address)).to.be.true;
      });
    });

    describe('DOMAIN_SEPARATOR()', function () {
      it('returns the correct domain separator', async function () {
        expect(await this.contract.DOMAIN_SEPARATOR()).to.equal(ethers.utils._TypedDataEncoder.hashDomain(this.domain));
      });
    });

    describe('removeForwarderApproval(address,bool)', function () {
      beforeEach(async function () {
        this.receipt = await this.contract.removeForwarderApproval(this.forwarder.address);
      });

      it('sets the forwarder approval', async function () {
        expect(await this.contract.isApprovedForwarder(deployer.address, this.forwarder.address)).to.be.false;
      });

      it('updates the forwarder approval nonce', async function () {
        expect(await this.contract.getNonce(deployer.address, this.forwarder.address)).to.equal(1);
      });

      it('emits a ForwarderApproval event', async function () {
        await expect(this.receipt).to.emit(this.contract, 'ForwarderApproval').withArgs(deployer.address, this.forwarder.address, false, 0);
      });
    });

    function describeSetForwarderApproval(isEIP712Signature) {
      beforeEach(async function () {
        if (isEIP712Signature) {
          this.signer = this.erc1271.address;
          this.errorMsg = 'InvalidEIP1271Signature';
        } else {
          this.signer = deployer.address;
          this.errorMsg = 'WrongSigner';
        }
      });

      it('reverts with an invalid signature', async function () {
        const signature = await deployer._signTypedData(this.domain, ForwarderApprovalType, {
          forwarder: this.forwarder.address,
          approved: false, // should be true
          nonce: 0,
        });

        const {data: relayerData} = await this.contract.populateTransaction.setForwarderApproval(
          this.signer,
          this.forwarder.address,
          true,
          signature,
          isEIP712Signature
        );
        await expect(this.forwarder.forward(this.signer, this.contract.address, relayerData)).to.be.revertedWithCustomError(
          this.contract,
          this.errorMsg
        );
      });

      context('when successful', function () {
        beforeEach(async function () {
          const signature = await deployer._signTypedData(this.domain, ForwarderApprovalType, {
            forwarder: this.forwarder.address,
            approved: true,
            nonce: 0,
          });

          const {data: relayerData} = await this.contract.populateTransaction.setForwarderApproval(
            this.signer,
            this.forwarder.address,
            true,
            signature,
            isEIP712Signature
          );
          this.receipt = await this.forwarder.forward(this.signer, this.contract.address, relayerData);
        });

        it('sets the forwarder approval', async function () {
          expect(await this.contract.isApprovedForwarder(this.signer, this.forwarder.address)).to.be.true;
        });

        it('updates the forwarder approval nonce', async function () {
          expect(await this.contract.getNonce(this.signer, this.forwarder.address)).to.equal(1);
        });

        it('emits a ForwarderApproval event', async function () {
          await expect(this.receipt).to.emit(this.contract, 'ForwarderApproval').withArgs(this.signer, this.forwarder.address, true, 0);
        });

        it('allows direct forwarding to a receiver contract', async function () {
          const {data: relayerData} = await this.receiver.populateTransaction.test(42);
          await this.forwarder.forward(this.signer, this.receiver.address, relayerData);
          expect(await this.receiver.getData(this.signer)).to.equal(42);
        });
      });
    }

    describe('setForwarderApproval(address,address,bool,bytes,bool) DIRECT', function () {
      describeSetForwarderApproval(false);
    });
    describe('setForwarderApproval(address,address,bool,bytes,bool) ERC1271', function () {
      describeSetForwarderApproval(true);
    });

    describe('approveAndForward(bytes,bool,address,bytes)', function () {
      it('reverts with an invalid signature', async function () {
        const signature = await deployer._signTypedData(this.domain, ForwarderApprovalType, {
          forwarder: this.forwarder.address,
          approved: false, // should be true
          nonce: 0,
        });

        const {to, data} = await this.receiver.populateTransaction.test(42);
        const {data: relayerData} = await this.contract.populateTransaction.approveAndForward(signature, 0, to, data);
        await expect(this.forwarder.forward(deployer.address, this.contract.address, relayerData)).to.be.revertedWithCustomError(
          this.contract,
          'WrongSigner'
        );
      });

      context('when successful', function () {
        beforeEach(async function () {
          const signature = await deployer._signTypedData(this.domain, ForwarderApprovalType, {
            forwarder: this.forwarder.address,
            approved: true,
            nonce: 0,
          });
          const {to, data} = await this.receiver.populateTransaction.test(42);
          const {data: relayerData} = await this.contract.populateTransaction.approveAndForward(signature, 0, to, data);
          this.receipt = await this.forwarder.forward(deployer.address, this.contract.address, relayerData);
        });

        it('sets the forwarder approval', async function () {
          expect(await this.contract.isApprovedForwarder(deployer.address, this.forwarder.address)).to.be.true;
        });

        it('updates the forwarder approval nonce', async function () {
          expect(await this.contract.getNonce(deployer.address, this.forwarder.address)).to.equal(1);
        });

        it('calls the target function', async function () {
          expect(await this.receiver.getData(deployer.address)).to.equal(42);
        });

        it('emits a ForwarderApproval event', async function () {
          await expect(this.receipt).to.emit(this.contract, 'ForwarderApproval').withArgs(deployer.address, this.forwarder.address, true, 0);
        });

        it('allows direct forwarding to a receiver contract', async function () {
          const {data: relayerData} = await this.receiver.populateTransaction.test(42);
          await this.forwarder.forward(deployer.address, this.receiver.address, relayerData);
          expect(await this.receiver.getData(deployer.address)).to.equal(42);
        });
      });
    });

    describe('forward(address,bytes)', function () {
      it('reverts if the approval is not set', async function () {
        const {to, data} = await this.receiver.populateTransaction.test(42);
        const {data: relayerData} = await this.contract.populateTransaction.forward(to, data);
        await expect(
          other.sendTransaction({
            to: this.contract.address,
            data: relayerData + deployer.address.slice(2),
          })
        )
          .to.be.revertedWithCustomError(this.contract, 'ForwarderNotApproved')
          .withArgs(deployer.address, other.address);
      });

      context('when successful', function () {
        beforeEach(async function () {
          const signature = await deployer._signTypedData(this.domain, ForwarderApprovalType, {
            forwarder: other.address,
            approved: true,
            nonce: 0,
          });

          const {data: approvalData} = await this.contract.populateTransaction.setForwarderApproval(
            deployer.address,
            other.address,
            true,
            signature,
            false
          );
          await this.forwarder.forward(ZeroAddress, this.contract.address, approvalData);

          const {to, data} = await this.receiver.populateTransaction.test(42);
          const {data: relayerData} = await this.contract.populateTransaction.forward(to, data);
          this.receipt = await other.sendTransaction({
            to: this.contract.address,
            data: relayerData + deployer.address.slice(2),
          });
        });

        it('calls the target function', async function () {
          expect(await this.receiver.getData(deployer.address)).to.equal(42);
        });
      });
    });
  });

  describe('ForwarderRegistryReceiver', function () {
    describe('_msgSender() and _msgData()', function () {
      it('_msgSender() == msg.sender if msg.sender == tx.origin', async function () {
        await this.receiver.test(42);
        expect(await this.receiver.getData(deployer.address)).to.equal(42);
      });

      it('_msgSender() == msg.sender if msg.sender != tx.origin and msg.data.length < 24', async function () {
        // Approve forwarder
        const signature = await deployer._signTypedData(this.domain, ForwarderApprovalType, {
          forwarder: this.forwarder.address,
          approved: true,
          nonce: 0,
        });

        const {data: relayerData} = await this.contract.populateTransaction.setForwarderApproval(
          deployer.address,
          this.forwarder.address,
          true,
          signature,
          false
        );
        this.receipt = await this.forwarder.forward(deployer.address, this.contract.address, relayerData);

        // Forward non-EIP-2771 payload
        const {to, data} = await this.receiver.populateTransaction.smallDataTest();
        await this.forwarder.non2771Forward(to, data);
        expect(await this.receiver.getData(deployer.address)).to.equal(0);
        expect(await this.receiver.getData(this.forwarder.address)).to.equal(1);
      });

      it('_msgSender() == msg.sender if msg.sender != tx.origin and msg.sender is not an approved forwarder', async function () {
        const {to, data} = await this.receiver.populateTransaction.test(42);
        await this.forwarder.forward(deployer.address, to, data);
        expect(await this.receiver.getData(deployer.address)).to.equal(0);
        expect(await this.receiver.getData(this.forwarder.address)).to.equal(42);
      });
    });
  });
});
