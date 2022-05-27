const {getDeployerAddress, getForwarderRegistryAddress, runBehaviorTests} = require('../../helpers/run');
const {loadFixture} = require('../../helpers/fixtures');

const config = {
  immutable: {name: 'AccessControlMock', ctorArguments: ['forwarderRegistry'], metaTxSupport: true},
  diamond: {
    facets: [
      {name: 'ProxyAdminFacet', ctorArguments: ['forwarderRegistry'], init: {method: 'initProxyAdminStorage', arguments: ['initialAdmin']}},
      {
        name: 'ContractOwnershipFacet',
        ctorArguments: ['forwarderRegistry'],
        init: {method: 'initContractOwnershipStorage', arguments: ['initialOwner']},
      },
      {name: 'AccessControlFacetMock', ctorArguments: ['forwarderRegistry'], metaTxSupport: true},
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
      expect(this.contract.connect(other).grantRole(this.role, other.address)).to.be.revertedWith('Ownership: not the owner');
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
      await expect(this.contract.connect(other).revokeRole(this.role, other.address)).to.be.revertedWith('Ownership: not the owner');
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
      await expect(this.contract.connect(other).renounceRole(this.role)).to.be.revertedWith(
        `AccessControl: missing '${ethers.utils.parseBytes32String(this.role)}' role`
      );
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
      await expect(this.contract.enforceHasRole(this.role, other.address)).to.be.revertedWith(
        `AccessControl: missing '${ethers.utils.parseBytes32String(this.role)}' role`
      );
    });

    it('does not revert with an account which has the role', async function () {
      await this.contract.enforceHasRole(this.role, deployer.address);
    });
  });
});
