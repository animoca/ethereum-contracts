const {loadFixture} = require('../../helpers/fixtures');
const {ZeroAddress} = require('../../../src/constants');
const {expect} = require('chai');

const ApproveForwarderType = {
  ApproveForwarder: [
    {name: 'forwarder', type: 'address'},
    {name: 'approved', type: 'bool'},
    {name: 'nonce', type: 'uint256'},
  ],
};

describe('Meta Transactions', function () {
  let deployer, other;

  before(async function () {
    [deployer, other] = await ethers.getSigners();
  });

  const fixture = async function () {
    const ForwarderRegistry = await ethers.getContractFactory('ForwarderRegistry');
    this.contract = await ForwarderRegistry.deploy();
    await this.contract.deployed();
    const Forwarder = await ethers.getContractFactory('ForwarderMock');
    this.forwarder = await Forwarder.deploy();
    await this.forwarder.deployed();
    const ForwarderRegistryReceiver = await ethers.getContractFactory('ForwarderRegistryReceiverMock');
    this.receiver = await ForwarderRegistryReceiver.deploy(this.contract.address);
    await this.receiver.deployed();
    const ERC1271 = await ethers.getContractFactory('ERC1271Mock');
    this.erc1271 = await ERC1271.deploy(deployer.address);
    await this.erc1271.deployed();
    const ERC1654 = await ethers.getContractFactory('ERC1654Mock');
    this.erc1654 = await ERC1654.deploy(deployer.address);
    await this.erc1654.deployed();
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

    describe('approveForwarder(address,bool)', function () {
      beforeEach(async function () {
        this.receipt = await this.contract.functions['approveForwarder(address,bool)'](this.forwarder.address, true);
      });

      it('sets the forwarder approval', async function () {
        expect(await this.contract.isForwarderFor(deployer.address, this.forwarder.address)).to.be.true;
      });

      it('updates the forwarder approval nonce', async function () {
        expect(await this.contract.getNonce(deployer.address, this.forwarder.address)).to.equal(1);
      });

      it('emits a ForwarderApproved event', async function () {
        await expect(this.receipt).to.emit(this.contract, 'ForwarderApproved').withArgs(deployer.address, this.forwarder.address, true, 0);
      });

      it('allows direct forwarding to a receiver contract', async function () {
        const {data: relayerData} = await this.receiver.populateTransaction.test(42);
        await this.forwarder.forward(deployer.address, this.receiver.address, relayerData);
        expect(await this.receiver.getData(deployer.address)).to.equal(42);
      });
    });

    function describeApproveForwarder(signatureType) {
      beforeEach(async function () {
        switch (signatureType) {
          case 0:
            this.signer = deployer.address;
            this.errorMsg = 'SIGNATURE_WRONG_SIGNER';
            break;
          case 1:
            this.signer = this.erc1654.address;
            this.errorMsg = 'SIGNATURE_1654_INVALID';
            break;
          case 2:
            this.signer = this.erc1271.address;
            this.errorMsg = 'SIGNATURE_1271_INVALID';
            break;
        }
      });

      it('reverts with an invalid signature', async function () {
        const signature = await deployer._signTypedData(this.domain, ApproveForwarderType, {
          forwarder: this.forwarder.address,
          approved: false, // should be true
          nonce: 0,
        });

        const {data: relayerData} = await this.contract.populateTransaction['approveForwarder(bool,bytes,uint8)'](true, signature, signatureType);
        await expect(this.forwarder.forward(this.signer, this.contract.address, relayerData)).to.be.revertedWith(this.errorMsg);
      });

      context('when successful', function () {
        beforeEach(async function () {
          const signature = await deployer._signTypedData(this.domain, ApproveForwarderType, {
            forwarder: this.forwarder.address,
            approved: true,
            nonce: 0,
          });

          const {data: relayerData} = await this.contract.populateTransaction['approveForwarder(bool,bytes,uint8)'](true, signature, signatureType);
          this.receipt = this.forwarder.forward(this.signer, this.contract.address, relayerData);
        });

        it('sets the forwarder approval', async function () {
          expect(await this.contract.isForwarderFor(this.signer, this.forwarder.address)).to.be.true;
        });

        it('updates the forwarder approval nonce', async function () {
          expect(await this.contract.getNonce(this.signer, this.forwarder.address)).to.equal(1);
        });

        it('emits a ForwarderApproved event', async function () {
          await expect(this.receipt).to.emit(this.contract, 'ForwarderApproved').withArgs(this.signer, this.forwarder.address, true, 0);
        });

        it('allows direct forwarding to a receiver contract', async function () {
          const {data: relayerData} = await this.receiver.populateTransaction.test(42);
          await this.forwarder.forward(this.signer, this.receiver.address, relayerData);
          expect(await this.receiver.getData(this.signer)).to.equal(42);
        });
      });
    }

    describe('approveForwarder(bool,bytes,SignatureType) DIRECT', function () {
      describeApproveForwarder(0);
    });
    describe('approveForwarder(bool,bytes,SignatureType) ERC1654', function () {
      describeApproveForwarder(1);
    });
    describe('approveForwarder(bool,bytes,SignatureType) ERC1271', function () {
      describeApproveForwarder(2);
    });

    describe('checkApprovalAndForward(bytes,SignatureType,address,bytes)', function () {
      it('reverts with an invalid signature', async function () {
        const signature = await deployer._signTypedData(this.domain, ApproveForwarderType, {
          forwarder: other.address,
          approved: false, // should be true
          nonce: 0,
        });

        const {to, data} = await this.receiver.populateTransaction.test(42);
        const {data: relayerData} = await this.contract.populateTransaction.checkApprovalAndForward(signature, 0, to, data);
        await expect(
          other.sendTransaction({
            to: this.contract.address,
            data: relayerData + deployer.address.slice(2),
          })
        ).to.be.revertedWith('SIGNATURE_WRONG_SIGNER');
      });

      context('when successful', function () {
        beforeEach(async function () {
          const signature = await deployer._signTypedData(this.domain, ApproveForwarderType, {
            forwarder: other.address,
            approved: true,
            nonce: 0,
          });
          const {to, data} = await this.receiver.populateTransaction.test(42);
          const {data: relayerData} = await this.contract.populateTransaction.checkApprovalAndForward(signature, 0, to, data);
          this.receipt = await other.sendTransaction({
            to: this.contract.address,
            data: relayerData + deployer.address.slice(2),
          });
        });

        it('does not set the forwarder approval', async function () {
          expect(await this.contract.isForwarderFor(deployer.address, other.address)).to.be.false;
        });

        it('does not update the forwarder approval nonce', async function () {
          expect(await this.contract.getNonce(deployer.address, other.address)).to.equal(0);
        });

        it('calls the target function', async function () {
          expect(await this.receiver.getData(deployer.address)).to.equal(42);
        });

        it('does not emit a ForwarderApproved event', async function () {
          await expect(this.receipt).not.to.emit(this.contract, 'ForwarderApproved');
        });
      });
    });

    describe('approveAndForward(bytes,SignatureType,address,bytes)', function () {
      it('reverts with an invalid signature', async function () {
        const signature = await deployer._signTypedData(this.domain, ApproveForwarderType, {
          forwarder: this.forwarder.address,
          approved: false, // should be true
          nonce: 0,
        });

        const {to, data} = await this.receiver.populateTransaction.test(42);
        const {data: relayerData} = await this.contract.populateTransaction.approveAndForward(signature, 0, to, data);
        await expect(this.forwarder.forward(deployer.address, this.contract.address, relayerData)).to.be.revertedWith('SIGNATURE_WRONG_SIGNER');
      });

      context('when successful', function () {
        beforeEach(async function () {
          const signature = await deployer._signTypedData(this.domain, ApproveForwarderType, {
            forwarder: this.forwarder.address,
            approved: true,
            nonce: 0,
          });
          const {to, data} = await this.receiver.populateTransaction.test(42);
          const {data: relayerData} = await this.contract.populateTransaction.approveAndForward(signature, 0, to, data);
          this.receipt = this.forwarder.forward(deployer.address, this.contract.address, relayerData);
        });

        it('sets the forwarder approval', async function () {
          expect(await this.contract.isForwarderFor(deployer.address, this.forwarder.address)).to.be.true;
        });

        it('updates the forwarder approval nonce', async function () {
          expect(await this.contract.getNonce(deployer.address, this.forwarder.address)).to.equal(1);
        });

        it('calls the target function', async function () {
          expect(await this.receiver.getData(deployer.address)).to.equal(42);
        });

        it('emits a ForwarderApproved event', async function () {
          await expect(this.receipt).to.emit(this.contract, 'ForwarderApproved').withArgs(deployer.address, this.forwarder.address, true, 0);
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
        ).to.be.revertedWith('NOT_AUTHORIZED_FORWARDER');
      });

      context('when successful', function () {
        beforeEach(async function () {
          await this.contract.functions['approveForwarder(address,bool)'](other.address, true);
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

      it('_msgSender() == msg.sender if msg.sender != tx.origin and msg.sender is not an approved forwarder', async function () {
        const {to, data} = await this.receiver.populateTransaction.test(42);
        await this.forwarder.forward(deployer.address, to, data);
        expect(await this.receiver.getData(deployer.address)).to.equal(0);
        expect(await this.receiver.getData(this.forwarder.address)).to.equal(42);
      });
    });
  });
});
