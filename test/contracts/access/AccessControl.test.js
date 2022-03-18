const {utils} = require('ethers');
const {parseBytes32String} = utils;
const {expectEvent, expectRevert} = require('@openzeppelin/test-helpers');

const {runBehaviorTests} = require('../../utils/run');
const {createFixtureLoader} = require('../../utils/fixture');
const fixtureLoader = createFixtureLoader();

const [deployer, other] = require('../../.accounts');

const config = {
  immutable: {name: 'AccessControlMock'},
  diamond: {
    facetDependencies: [
      {
        name: 'ProxyAdminFacet',
        initMethod: 'initProxyAdminStorage',
        initArguments: ['initialAdmin'],
      },
      {name: 'DiamondCutFacet', initMethod: 'initDiamondCutStorage'},
      {
        name: 'OwnableFacet',
        initMethod: 'initOwnershipStorage',
        initArguments: ['initialOwner'],
      },
    ],
    mainFacet: {
      name: 'AccessControlFacetMock',
      defaultArguments: {initialAdmin: deployer, initialOwner: deployer},
    },
  },
  abiExtensions: ['LibAccessControl'],
};

runBehaviorTests('AccessControl', config, function (deployFn) {
  const fixture = async function () {
    const deployment = await deployFn({initialAdmin: deployer, initialOwner: deployer}, deployer);
    this.contract = deployment.contract;
    this.tx = deployment.tx;
    this.role = await this.contract.TEST_ROLE();
    await this.contract.grantRole(this.role, deployer, {from: deployer});
  };

  beforeEach(async function () {
    await fixtureLoader(fixture, this);
  });

  describe('grantRole(bytes32,address)', function () {
    it('reverts if the caller is not the contract owner', async function () {
      await expectRevert(this.contract.grantRole(this.role, other, {from: other}), 'Ownership: not the owner');
    });

    context('when successful (account did not have the role)', function () {
      beforeEach(async function () {
        this.receipt = await this.contract.grantRole(this.role, other, {
          from: deployer,
        });
      });

      it('sets the role on the account', async function () {
        (await this.contract.hasRole(this.role, other)).should.be.true;
      });

      it('emits a RoleGranted event', async function () {
        expectEvent(this.receipt, 'RoleGranted', {
          role: this.role,
          account: other,
          operator: deployer,
        });
      });
    });

    context('when successful (account already had the role)', function () {
      beforeEach(async function () {
        await this.contract.grantRole(this.role, other, {from: deployer});
        this.receipt = await this.contract.grantRole(this.role, other, {
          from: deployer,
        });
      });

      it('keeps the role set on the account', async function () {
        (await this.contract.hasRole(this.role, other)).should.be.true;
      });

      it('does not emit a RoleGranted event', async function () {
        await expectEvent.notEmitted(this.receipt, 'RoleGranted');
      });
    });
  });

  describe('revokeRole(bytes32,address)', function () {
    it('reverts if the caller is not the contract owner', async function () {
      await expectRevert(this.contract.revokeRole(this.role, other, {from: other}), 'Ownership: not the owner');
    });

    context('when successful (account already had the role)', function () {
      beforeEach(async function () {
        await this.contract.grantRole(this.role, other, {from: deployer});
        this.receipt = await this.contract.revokeRole(this.role, other, {
          from: deployer,
        });
      });

      it('removes the role on the account', async function () {
        (await this.contract.hasRole(this.role, other)).should.be.false;
      });

      it('emits a RoleRevoked event', async function () {
        expectEvent(this.receipt, 'RoleRevoked', {
          role: this.role,
          account: other,
          operator: deployer,
        });
      });
    });

    context('when successful (account did not have the role)', function () {
      beforeEach(async function () {
        this.receipt = await this.contract.revokeRole(this.role, other, {
          from: deployer,
        });
      });

      it('keeps the role unset on the account', async function () {
        (await this.contract.hasRole(this.role, other)).should.be.false;
      });

      it('does not emit a RoleRevoked event', async function () {
        await expectEvent.notEmitted(this.receipt, 'RoleRevoked');
      });
    });
  });

  describe('renounceRole(bytes32)', function () {
    it('reverts if the caller does not have the role', async function () {
      await expectRevert(this.contract.renounceRole(this.role, {from: other}), `AccessControl: missing '${parseBytes32String(this.role)}' role`);
    });

    context('when successful', function () {
      beforeEach(async function () {
        await this.contract.grantRole(this.role, other, {from: deployer});
        this.receipt = await this.contract.renounceRole(this.role, {
          from: other,
        });
      });

      it('removes the role on the account', async function () {
        (await this.contract.hasRole(this.role, other)).should.be.false;
      });

      it('emits a RoleRevoked event', async function () {
        expectEvent(this.receipt, 'RoleRevoked', {
          role: this.role,
          account: other,
          operator: other,
        });
      });
    });
  });

  describe('LibAccessControl.enforceHasRole(bytes32,address)', function () {
    it('reverts with an account which does not have the role', async function () {
      await expectRevert(this.contract.enforceHasRole(this.role, other), `AccessControl: missing '${parseBytes32String(this.role)}' role`);
    });

    it('does not revert with an account which has the role', async function () {
      await this.contract.enforceHasRole(this.role, deployer);
    });
    describe('AccessControl', function () {});
  });
});
