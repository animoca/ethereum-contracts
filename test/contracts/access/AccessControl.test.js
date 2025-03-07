const {ethers} = require('hardhat');
const {expect} = require('chai');
const {runBehaviorTests} = require('@animoca/ethereum-contract-helpers/src/test/run');
const {loadFixture} = require('@animoca/ethereum-contract-helpers/src/test/fixtures');
const {getDeployerAddress} = require('@animoca/ethereum-contract-helpers/src/test/accounts');
const {getForwarderRegistryAddress} = require('../../helpers/registries');

const config = {
  immutable: {name: 'AccessControlMock', ctorArguments: ['forwarderRegistry'], testMsgData: true},
  diamond: {
    facets: [
      {name: 'ProxyAdminFacet', ctorArguments: ['forwarderRegistry'], init: {method: 'initProxyAdminStorage', arguments: ['initialAdmin']}},
      {
        name: 'ContractOwnershipFacet',
        ctorArguments: ['forwarderRegistry'],
        init: {method: 'initContractOwnershipStorage', arguments: ['initialOwner']},
      },
      {name: 'AccessControlFacetMock', ctorArguments: ['forwarderRegistry'], testMsgData: true},
    ],
  },
  defaultArguments: {
    forwarderRegistry: getForwarderRegistryAddress,
    initialAdmin: getDeployerAddress,
    initialOwner: getDeployerAddress,
  },
};

runBehaviorTests('AccessControl', config, function (deployFn) {
  let deployer, other;

  before(async function () {
    [deployer, other] = await ethers.getSigners();
  });

  const fixture = async function () {
    this.contract = await deployFn();
    this.role = await this.contract.TEST_ROLE();
    await this.contract.grantRole(this.role, deployer.address);
  };

  beforeEach(async function () {
    await loadFixture(fixture, this);
  });

  describe('grantRole(bytes32,address)', function () {
    it('reverts if the caller is not the contract owner', async function () {
      expect(this.contract.connect(other).grantRole(this.role, other.address))
        .to.be.revertedWithCustomError(this.contract, 'NotContractOwner')
        .withArgs(other.address);
    });

    context('when successful (account did not have the role)', function () {
      beforeEach(async function () {
        this.receipt = await this.contract.grantRole(this.role, other.address);
      });

      it('sets the role on the account', async function () {
        expect(await this.contract.hasRole(this.role, other.address)).to.be.true;
      });

      it('emits a RoleGranted event', async function () {
        await expect(this.receipt).to.emit(this.contract, 'RoleGranted').withArgs(this.role, other.address, deployer.address);
      });
    });

    context('when successful (account already had the role)', function () {
      beforeEach(async function () {
        await this.contract.grantRole(this.role, other.address);
        this.receipt = await this.contract.grantRole(this.role, other.address);
      });

      it('keeps the role set on the account', async function () {
        expect(await this.contract.hasRole(this.role, other.address)).to.be.true;
      });

      it('does not emit a RoleGranted event', async function () {
        await expect(this.receipt).to.not.emit(this.contract, 'RoleGranted');
      });
    });
  });

  describe('revokeRole(bytes32,address)', function () {
    it('reverts if the caller is not the contract owner', async function () {
      await expect(this.contract.connect(other).revokeRole(this.role, other.address))
        .to.be.revertedWithCustomError(this.contract, 'NotContractOwner')
        .withArgs(other.address);
    });

    context('when successful (account already had the role)', function () {
      beforeEach(async function () {
        await this.contract.grantRole(this.role, other.address);
        this.receipt = await this.contract.revokeRole(this.role, other.address);
      });

      it('removes the role on the account', async function () {
        expect(await this.contract.hasRole(this.role, other.address)).to.be.false;
      });

      it('emits a RoleRevoked event', async function () {
        await expect(this.receipt).to.emit(this.contract, 'RoleRevoked').withArgs(this.role, other.address, deployer.address);
      });
    });

    context('when successful (account did not have the role)', function () {
      beforeEach(async function () {
        this.receipt = await this.contract.revokeRole(this.role, other.address);
      });

      it('keeps the role unset on the account', async function () {
        expect(await this.contract.hasRole(this.role, other.address)).to.be.false;
      });

      it('does not emit a RoleRevoked event', async function () {
        await expect(this.receipt).not.to.emit(this.contract, 'RoleRevoked');
      });
    });
  });

  describe('renounceRole(bytes32)', function () {
    it('reverts if the caller does not have the role', async function () {
      await expect(this.contract.connect(other).renounceRole(this.role))
        .to.be.revertedWithCustomError(this.contract, 'NotRoleHolder')
        .withArgs(this.role, other.address);
    });

    context('when successful', function () {
      beforeEach(async function () {
        await this.contract.grantRole(this.role, other.address);
        this.receipt = await this.contract.connect(other).renounceRole(this.role);
      });

      it('removes the role on the account', async function () {
        expect(await this.contract.hasRole(this.role, other.address)).to.be.false;
      });

      it('emits a RoleRevoked event', async function () {
        await expect(this.receipt).to.emit(this.contract, 'RoleRevoked').withArgs(this.role, other.address, other.address);
      });
    });
  });

  describe('AccessControlStorage.enforceHasRole(bytes32,address)', function () {
    it('reverts with an account which does not have the role', async function () {
      await expect(this.contract.enforceHasRole(this.role, other.address))
        .to.be.revertedWithCustomError(this.contract, 'NotRoleHolder')
        .withArgs(this.role, other.address);
    });

    it('does not revert with an account which has the role', async function () {
      await this.contract.enforceHasRole(this.role, deployer.address);
    });
  });

  describe('AccessControlStorage.enforceHasTargetContractRole(address,bytes32,address)', function () {
    it('reverts with a target which is not a contract', async function () {
      await expect(this.contract.enforceHasTargetContractRole(deployer.address, this.role, other.address))
        .to.be.revertedWithCustomError(this.contract, 'TargetIsNotAContract')
        .withArgs(deployer.address);
    });

    it('reverts with an account which does not have the role on the target contract', async function () {
      const targetContract = await deployFn();
      const role = await targetContract.TEST_ROLE();
      await expect(this.contract.enforceHasTargetContractRole(targetContract.getAddress(), role, other.address))
        .to.be.revertedWithCustomError(this.contract, 'NotTargetContractRoleHolder')
        .withArgs(await targetContract.getAddress(), this.role, other.address);
    });

    it('does not revert with an account which has the role', async function () {
      const targetContract = await deployFn();
      const role = await targetContract.TEST_ROLE();
      await targetContract.grantRole(role, deployer.address);
      await this.contract.enforceHasTargetContractRole(targetContract.getAddress(), role, deployer.address);
    });
  });
});
