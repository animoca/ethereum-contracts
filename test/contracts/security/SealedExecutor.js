const {ethers} = require('hardhat');
const {expect} = require('chai');
const {deployContract} = require('@animoca/ethereum-contract-helpers/src/test/deploy');
const {runBehaviorTests} = require('@animoca/ethereum-contract-helpers/src/test/run');
const {loadFixture} = require('@animoca/ethereum-contract-helpers/src/test/fixtures');
const {getForwarderRegistryAddress} = require('../../helpers/registries');

const config = {
  immutable: {name: 'SealedExecutorMock', ctorArguments: ['forwarderRegistry'], testMsgData: true},
  defaultArguments: {
    forwarderRegistry: getForwarderRegistryAddress,
  },
};

runBehaviorTests('SealedExecutor', config, function (deployFn) {
  let deployer, sealer;

  before(async function () {
    [deployer, sealer] = await ethers.getSigners();
  });

  const fixture = async function () {
    this.contract = await deployFn();
    this.nonMinterContract = await deployFn();
    const sealerRole = await this.contract.SEALER_ROLE();
    await this.contract.grantRole(sealerRole, sealer.address);
    await this.nonMinterContract.grantRole(sealerRole, sealer.address);

    this.target = await deployContract('ERC20SimpleMock', await getForwarderRegistryAddress());
    await this.target.grantRole(await this.target.MINTER_ROLE(), this.contract.address);
    this.encodedCall = this.target.interface.encodeFunctionData('mint', [deployer.address, 1]);
    this.sealId = 1;
  };

  beforeEach(async function () {
    await loadFixture(fixture, this);
  });

  describe('sealedCall(address,bytes,uint256)', function () {
    context('Pre-conditions', function () {
      it('reverts if the sender is not a sealer', async function () {
        await expect(this.contract.sealedCall(this.target.address, this.encodedCall, this.sealId)).to.be.revertedWith(
          "AccessControl: missing 'sealer' role"
        );
      });

      it('reverts if the contract lacks the role for the target call', async function () {
        await expect(this.nonMinterContract.connect(sealer).sealedCall(this.target.address, this.encodedCall, this.sealId)).to.be.revertedWith(
          "AccessControl: missing 'minter' role"
        );
      });

      it('reverts if using a sealId previously used', async function () {
        await this.contract.connect(sealer).sealedCall(this.target.address, this.encodedCall, this.sealId);
        await expect(this.contract.connect(sealer).sealedCall(this.target.address, this.encodedCall, this.sealId)).to.be.revertedWith(
          'Seals: sealed'
        );
      });
    });

    context('when successful', function () {
      beforeEach(async function () {
        this.receipt = await this.contract.connect(sealer).sealedCall(this.target.address, this.encodedCall, this.sealId);
      });

      it('sets the sealId as sealed', async function () {
        expect(await this.contract.isSealed(this.sealId)).to.be.true;
      });

      it('emits an ExecutionSealed event', async function () {
        await expect(this.receipt).to.emit(this.contract, 'Sealed').withArgs(this.sealId, sealer.address);
      });

      it('the target emits an event', async function () {
        await expect(this.receipt).to.emit(this.target, 'Transfer');
      });
    });
  });
});
