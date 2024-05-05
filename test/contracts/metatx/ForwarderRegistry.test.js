const {ethers} = require('hardhat');
const {expect} = require('chai');
const {deployContract} = require('@animoca/ethereum-contract-helpers/src/test/deploy');
const {loadFixture} = require('@animoca/ethereum-contract-helpers/src/test/fixtures');

const ForwarderApprovalType = {
  ForwarderApproval: [
    {name: 'sender', type: 'address'},
    {name: 'forwarder', type: 'address'},
    {name: 'target', type: 'address'},
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
    this.receiver = await deployContract('ForwarderRegistryReceiverMock', this.contract.getAddress());
    this.erc1271 = await deployContract('ERC1271Mock', deployer.address);

    this.domain = {
      name: 'ForwarderRegistry',
      chainId: await getChainId(),
      verifyingContract: await this.contract.getAddress(),
    };
  };

  beforeEach(async function () {
    await loadFixture(fixture, this);
  });

  describe('ForwarderRegistry', function () {
    describe('isTrustedForwarder(address)', function () {
      it('always returns true', async function () {
        expect(await this.contract.isTrustedForwarder(ethers.ZeroAddress)).to.be.true;
        expect(await this.contract.isTrustedForwarder(deployer.address)).to.be.true;
        expect(await this.contract.isTrustedForwarder(other.address)).to.be.true;
        expect(await this.contract.isTrustedForwarder(this.contract.getAddress())).to.be.true;
      });
    });

    describe('DOMAIN_SEPARATOR()', function () {
      it('returns the correct domain separator', async function () {
        expect(await this.contract.DOMAIN_SEPARATOR()).to.equal(ethers.TypedDataEncoder.hashDomain(this.domain));
      });
    });

    describe('setForwarderApproval(address,address,bool)', function () {
      context('when setting approval', function () {
        beforeEach(async function () {
          this.receipt = await this.contract.setForwarderApproval(this.forwarder.getAddress(), this.receiver.getAddress(), true);
        });

        it('sets the forwarder approval', async function () {
          expect(await this.contract.isApprovedForwarder(deployer.address, this.forwarder.getAddress(), this.receiver.getAddress())).to.be.true;
        });

        it('updates the forwarder approval nonce', async function () {
          expect(await this.contract.getNonce(deployer.address, this.forwarder.getAddress(), this.receiver.getAddress())).to.equal(1);
        });

        it('emits a ForwarderApproval event', async function () {
          await expect(this.receipt)
            .to.emit(this.contract, 'ForwarderApproval')
            .withArgs(deployer.address, await this.forwarder.getAddress(), this.receiver.getAddress(), true, 0);
        });
      });

      context('when unsetting approval', function () {
        beforeEach(async function () {
          this.receipt = await this.contract.setForwarderApproval(this.forwarder.getAddress(), this.receiver.getAddress(), false);
        });

        it('sets the forwarder approval', async function () {
          expect(await this.contract.isApprovedForwarder(deployer.address, this.forwarder.getAddress(), this.receiver.getAddress())).to.be.false;
        });

        it('updates the forwarder approval nonce', async function () {
          expect(await this.contract.getNonce(deployer.address, this.forwarder.getAddress(), this.receiver.getAddress())).to.equal(1);
        });

        it('emits a ForwarderApproval event', async function () {
          await expect(this.receipt)
            .to.emit(this.contract, 'ForwarderApproval')
            .withArgs(deployer.address, await this.forwarder.getAddress(), this.receiver.getAddress(), false, 0);
        });
      });
    });

    function describeSetForwarderApproval(isEIP712Signature) {
      beforeEach(async function () {
        if (isEIP712Signature) {
          this.signer = await this.erc1271.getAddress();
          this.errorMsg = 'InvalidEIP1271Signature';
        } else {
          this.signer = deployer.address;
          this.errorMsg = 'WrongSigner';
        }
      });

      it('reverts with an invalid signature', async function () {
        const signature = await deployer.signTypedData(this.domain, ForwarderApprovalType, {
          sender: this.signer,
          forwarder: await this.forwarder.getAddress(),
          target: await this.receiver.getAddress(),
          approved: false, // should be true
          nonce: 0,
        });

        const {data: relayerData} = await this.contract.setForwarderApproval.populateTransaction(
          this.signer,
          this.forwarder.getAddress(),
          this.receiver.getAddress(),
          true,
          signature,
          isEIP712Signature
        );
        await expect(this.forwarder.forward(this.signer, this.contract.getAddress(), relayerData)).to.be.revertedWithCustomError(
          this.contract,
          this.errorMsg
        );
      });

      context('when successful', function () {
        beforeEach(async function () {
          const signature = await deployer.signTypedData(this.domain, ForwarderApprovalType, {
            sender: this.signer,
            forwarder: await this.forwarder.getAddress(),
            target: await this.receiver.getAddress(),
            approved: true,
            nonce: 0,
          });

          const {data: relayerData} = await this.contract.setForwarderApproval.populateTransaction(
            this.signer,
            this.forwarder.getAddress(),
            this.receiver.getAddress(),
            true,
            signature,
            isEIP712Signature
          );
          this.receipt = await this.forwarder.forward(this.signer, this.contract.getAddress(), relayerData);
        });

        it('sets the forwarder approval', async function () {
          expect(await this.contract.isApprovedForwarder(this.signer, this.forwarder.getAddress(), this.receiver.getAddress())).to.be.true;
        });

        it('updates the forwarder approval nonce', async function () {
          expect(await this.contract.getNonce(this.signer, this.forwarder.getAddress(), this.receiver.getAddress())).to.equal(1);
        });

        it('emits a ForwarderApproval event', async function () {
          await expect(this.receipt)
            .to.emit(this.contract, 'ForwarderApproval')
            .withArgs(this.signer, await this.forwarder.getAddress(), await this.receiver.getAddress(), true, 0);
        });

        it('allows direct forwarding to a receiver contract', async function () {
          const {data: relayerData} = await this.receiver.test.populateTransaction(42);
          await this.forwarder.forward(this.signer, this.receiver.getAddress(), relayerData);
          expect(await this.receiver.getData(this.signer)).to.equal(42);
        });
      });
    }

    describe('setForwarderApproval(address,address,address,bool,bytes,bool) DIRECT', function () {
      describeSetForwarderApproval(false);
    });
    describe('setForwarderApproval(address,address,address,bool,bytes,bool) ERC1271', function () {
      describeSetForwarderApproval(true);
    });

    describe('approveAndForward(bytes,bool,address,bytes)', function () {
      it('reverts with an invalid signature', async function () {
        const signature = await deployer.signTypedData(this.domain, ForwarderApprovalType, {
          sender: deployer.address,
          forwarder: await this.forwarder.getAddress(),
          target: await this.receiver.getAddress(),
          approved: false, // should be true
          nonce: 0,
        });

        const {to, data} = await this.receiver.test.populateTransaction(42);
        const {data: relayerData} = await this.contract.approveAndForward.populateTransaction(signature, 0, to, data);
        await expect(this.forwarder.forward(deployer.address, this.contract.getAddress(), relayerData)).to.be.revertedWithCustomError(
          this.contract,
          'WrongSigner'
        );
      });

      context('when successful', function () {
        beforeEach(async function () {
          const signature = await deployer.signTypedData(this.domain, ForwarderApprovalType, {
            sender: deployer.address,
            forwarder: await this.forwarder.getAddress(),
            target: await this.receiver.getAddress(),
            approved: true,
            nonce: 0,
          });
          const {to, data} = await this.receiver.test.populateTransaction(42);
          const {data: relayerData} = await this.contract.approveAndForward.populateTransaction(signature, 0, to, data);
          this.receipt = await this.forwarder.forward(deployer.address, this.contract.getAddress(), relayerData);
        });

        it('sets the forwarder approval', async function () {
          expect(await this.contract.isApprovedForwarder(deployer.address, this.forwarder.getAddress(), this.receiver.getAddress())).to.be.true;
        });

        it('updates the forwarder approval nonce', async function () {
          expect(await this.contract.getNonce(deployer.address, this.forwarder.getAddress(), this.receiver.getAddress())).to.equal(1);
        });

        it('calls the target function', async function () {
          expect(await this.receiver.getData(deployer.address)).to.equal(42);
        });

        it('emits a ForwarderApproval event', async function () {
          await expect(this.receipt)
            .to.emit(this.contract, 'ForwarderApproval')
            .withArgs(deployer.address, await this.forwarder.getAddress(), await this.receiver.getAddress(), true, 0);
        });

        it('allows direct forwarding to a receiver contract', async function () {
          const {data: relayerData} = await this.receiver.test.populateTransaction(42);
          await this.forwarder.forward(deployer.address, this.receiver.getAddress(), relayerData);
          expect(await this.receiver.getData(deployer.address)).to.equal(42);
        });
      });
    });

    describe('forward(address,bytes)', function () {
      it('reverts if the approval is not set', async function () {
        const {to, data} = await this.receiver.test.populateTransaction(42);
        const {data: relayerData} = await this.contract.forward.populateTransaction(to, data);
        await expect(
          other.sendTransaction({
            to: this.contract.getAddress(),
            data: relayerData + deployer.address.slice(2),
          })
        )
          .to.be.revertedWithCustomError(this.contract, 'ForwarderNotApproved')
          .withArgs(deployer.address, other.address, await this.receiver.getAddress());
      });

      context('when successful', function () {
        beforeEach(async function () {
          const signature = await deployer.signTypedData(this.domain, ForwarderApprovalType, {
            sender: deployer.address,
            forwarder: other.address,
            target: await this.receiver.getAddress(),
            approved: true,
            nonce: 0,
          });

          const {data: approvalData} = await this.contract.setForwarderApproval.populateTransaction(
            deployer.address,
            other.address,
            this.receiver.getAddress(),
            true,
            signature,
            false
          );
          await this.forwarder.forward(ethers.ZeroAddress, this.contract.getAddress(), approvalData);

          const {to, data} = await this.receiver.test.populateTransaction(42);
          const {data: relayerData} = await this.contract.forward.populateTransaction(to, data);
          this.receipt = await other.sendTransaction({
            to: this.contract.getAddress(),
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
        const signature = await deployer.signTypedData(this.domain, ForwarderApprovalType, {
          sender: deployer.address,
          forwarder: await this.forwarder.getAddress(),
          target: await this.receiver.getAddress(),
          approved: true,
          nonce: 0,
        });

        const {data: relayerData} = await this.contract.setForwarderApproval.populateTransaction(
          deployer.address,
          this.forwarder.getAddress(),
          this.receiver.getAddress(),
          true,
          signature,
          false
        );
        this.receipt = await this.forwarder.forward(deployer.address, this.contract.getAddress(), relayerData);

        // Forward non-EIP-2771 payload
        const {to, data} = await this.receiver.smallDataTest.populateTransaction();
        await this.forwarder.non2771Forward(to, data);
        expect(await this.receiver.getData(deployer.address)).to.equal(0);
        expect(await this.receiver.getData(this.forwarder.getAddress())).to.equal(1);
      });

      it('_msgSender() == msg.sender if msg.sender != tx.origin and msg.sender is not an approved forwarder', async function () {
        const {to, data} = await this.receiver.test.populateTransaction(42);
        await this.forwarder.forward(deployer.address, to, data);
        expect(await this.receiver.getData(deployer.address)).to.equal(0);
        expect(await this.receiver.getData(this.forwarder.getAddress())).to.equal(42);
      });
    });
  });
});
