const {ethers} = require('hardhat');
const {expect} = require('chai');
const {getDeployerAddress, getForwarderRegistryAddress, runBehaviorTests} = require('../../helpers/run');
const {loadFixture} = require('../../helpers/fixtures');

const config = {
  immutable: {name: 'SealedDelegateCallMock', ctorArguments: ['forwarderRegistry'], testMsgData: true},
  diamond: {
    facets: [
      {name: 'ProxyAdminFacet', ctorArguments: ['forwarderRegistry'], init: {method: 'initProxyAdminStorage', arguments: ['initialAdmin']}},
      {name: 'DiamondCutFacet', ctorArguments: ['forwarderRegistry'], init: {method: 'initDiamondCutStorage'}},
      {
        name: 'ContractOwnershipFacet',
        ctorArguments: ['forwarderRegistry'],
        init: {method: 'initContractOwnershipStorage', arguments: ['initialOwner']},
      },
      {name: 'AccessControlFacet', ctorArguments: ['forwarderRegistry']},
      {name: 'SealedDelegateCallFacetMock', ctorArguments: ['forwarderRegistry'], testMsgData: true},
    ],
  },
  defaultArguments: {
    forwarderRegistry: getForwarderRegistryAddress,
    initialAdmin: getDeployerAddress,
    initialOwner: getDeployerAddress,
  },
};

runBehaviorTests('SealedDelegateCall', config, function (deployFn) {
  let deployer, sealer;

  before(async function () {
    [deployer, sealer] = await ethers.getSigners();
  });

  const fixture = async function () {
    this.contract = await deployFn();
    await this.contract.grantRole(await this.contract.SEALER_ROLE(), sealer.address);
    this.encodedCall = this.contract.interface.encodeFunctionData('owner');
    this.sealId = 1;
  };

  beforeEach(async function () {
    await loadFixture(fixture, this);
  });

  describe('sealedDelegateCall(bytes,uint256)', function () {
    context('Pre-conditions', function () {
      it('reverts if the sender is not a sealer', async function () {
        await expect(this.contract.sealedDelegateCall(this.encodedCall, this.sealId)).to.be.revertedWith("AccessControl: missing 'sealer' role");
      });

      it('reverts if the sender lacks a role in the function call', async function () {
        await expect(
          this.contract
            .connect(sealer)
            .sealedDelegateCall(this.contract.interface.encodeFunctionData('transferOwnership', [sealer.address]), this.sealId)
        ).to.be.revertedWith('Ownership: not the owner');
      });

      it('reverts if using a sealId previously used', async function () {
        await this.contract.connect(sealer).sealedDelegateCall(this.encodedCall, this.sealId);
        await expect(this.contract.connect(sealer).sealedDelegateCall(this.encodedCall, this.sealId)).to.be.revertedWith('Seals: sealed');
      });
    });

    context('when successful', function () {
      beforeEach(async function () {
        this.receipt = await this.contract.connect(sealer).sealedDelegateCall(this.encodedCall, this.sealId);
      });

      it('sets the sealId as sealed', async function () {
        expect(await this.contract.isSealed(this.sealId)).to.be.true;
      });

      it('emits an ExecutionSealed event', async function () {
        await expect(this.receipt).to.emit(this.contract, 'Sealed').withArgs(this.sealId, sealer.address);
      });
    });
  });
});
