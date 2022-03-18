const {artifacts, ethers} = require('hardhat');
const {utils} = ethers;
const {expectEvent, expectRevert} = require('@openzeppelin/test-helpers');
const {ZeroAddress, EmptyByte} = require('../../../src/constants');

const {createFixtureLoader} = require('../../utils/fixture');
const fixtureLoader = createFixtureLoader();

const {FacetCutAction, deployDiamond, getSelectors, newFacetFilter} = require('../../utils/diamond');

const {shouldSupportInterfaces} = require('../introspection/behaviors/SupportsInterface.behavior');

const [deployer, other] = require('../../.accounts');

const EmptyInit = [ZeroAddress, EmptyByte];

const facetsConfig = [
  {
    name: 'ProxyAdminFacet',
    initMethod: 'initProxyAdminStorage',
    initArguments: ['initialAdmin'],
  },
  {name: 'DiamondCutFacet', initMethod: 'initDiamondCutStorage'},
  {name: 'DiamondLoupeFacet', initMethod: 'initDiamondLoupeStorage'},
  {name: 'ERC165Facet', initMethod: 'initInterfaceDetectionStorage'},
];

describe('Diamond', function () {
  const fixture = async function () {
    const deployments = await deployDiamond(facetsConfig, {initialAdmin: deployer}, ['FacetMock'], newFacetFilter, 'DiamondMock');
    this.contract = deployments.diamond;
    this.facets = deployments.facets;
    this.facet = await artifacts.require('FacetMock').new();
  };

  beforeEach(async function () {
    await fixtureLoader(fixture, this);
  });

  describe('fallback function', function () {
    it('reverts with an unknown function', async function () {
      await expectRevert(this.contract.init(), 'Diamond: function not found');
    });
  });

  describe('diamondCut(FacetCut[],address,bytes)', function () {
    const batchInit = false;
    it('reverts when not called by the proxy admin', async function () {
      await expectRevert(this.contract.diamondCut([], ...EmptyInit, {from: other}), 'ProxyAdmin: not the admin');
    });

    describeDiamondCut(async function (contract, cuts, init) {
      return contract.methods['diamondCut((address,uint8,bytes4[])[],address,bytes)'](cuts, ...init);
    }, batchInit);
  });

  describe('diamondCut(FacetCut[],Initialization[])', function () {
    const batchInit = true;
    it('reverts when not called by the proxy admin', async function () {
      await expectRevert(
        this.contract.methods['diamondCut((address,uint8,bytes4[])[],(address,bytes)[])']([], [EmptyInit], {from: other}),
        'ProxyAdmin: not the admin'
      );
    });

    describeDiamondCut(async function (contract, cuts, init) {
      return contract.methods['diamondCut((address,uint8,bytes4[])[],(address,bytes)[])'](cuts, [init]);
    }, batchInit);
  });

  shouldSupportInterfaces(['contracts/introspection/interfaces/IERC165.sol:IERC165', 'IDiamondLoupe', 'IDiamondCut', 'IDiamondCutBatchInit']);
});

function describeDiamondCut(cutFn, batchInit) {
  describe('facet cuts', function () {
    it('reverts when the cut action is incorrect', async function () {
      await expectRevert.unspecified(cutFn(this.contract, [[this.facet.address, 3, []]], EmptyInit));
    });

    describe('ADD action', function () {
      it('reverts with a zero address facet', async function () {
        await expectRevert(
          cutFn(this.contract, [[ZeroAddress, FacetCutAction.Add, getSelectors(this.facet)]], EmptyInit),
          'Diamond: zero address facet'
        );
      });

      it('reverts with an empty list of selectors', async function () {
        await expectRevert(cutFn(this.contract, [[this.facet.address, FacetCutAction.Add, []]], EmptyInit), 'Diamond: no function selectors');
      });

      it('reverts with a non-contract facet', async function () {
        await expectRevert(cutFn(this.contract, [[deployer, FacetCutAction.Add, getSelectors(this.facet)]], EmptyInit), 'Diamond: facet has no code');
      });

      it('reverts with an existing function selector', async function () {
        const cutFacet = this.facets['DiamondCutFacet'];
        await expectRevert(
          cutFn(this.contract, [[cutFacet.address, FacetCutAction.Add, getSelectors(cutFacet)]], EmptyInit),
          'Diamond: existing function'
        );
      });

      context('when successful', function () {
        beforeEach(async function () {
          this.cuts = [[this.facet.address, FacetCutAction.Add, getSelectors(this.facet)]];
          this.receipt = await cutFn(this.contract, this.cuts, EmptyInit);
        });

        it('adds the facet in facets()', async function () {
          const facets = await this.contract.facets();
          const facet = facets[facets.length - 1];
          facet.facetAddress.should.be.equal(this.facet.address);
          const selectors = getSelectors(this.facet);
          selectors.length.should.be.equal(facet.functionSelectors.length);
          for (const selector of selectors) {
            facet.functionSelectors.indexOf(selector).should.not.be.equal(-1);
          }
        });

        it('adds the selectors in facetFunctionSelectors(address)', async function () {
          const selectors = getSelectors(this.facet);
          const facetFunctionSelectors = await this.contract.facetFunctionSelectors(this.facet.address);
          selectors.length.should.be.equal(facetFunctionSelectors.length);
          for (const selector of selectors) {
            facetFunctionSelectors.indexOf(selector).should.not.be.equal(-1);
          }
        });

        it('adds the facet address in facetAddresses()', async function () {
          const facetAddresses = await this.contract.facetAddresses();
          facetAddresses.indexOf(this.facet.address).should.not.be.equal(-1);
        });

        it('adds each function selector in facetAddress(bytes4)', async function () {
          const selectors = getSelectors(this.facet);
          for (const selector of selectors) {
            (await this.contract.facetAddress(selector)).should.be.equal(this.facet.address);
          }
        });

        it('emits a DiamondCut event', async function () {
          expectEvent(this.receipt, 'DiamondCut', {
            _diamondCut: this.cuts,
            _init: EmptyInit[0],
            _calldata: EmptyInit[1],
          });
        });
      });
    });

    describe('REMOVE action', function () {
      it('reverts with a non-zero address facet', async function () {
        await expectRevert(
          cutFn(this.contract, [[this.facet.address, FacetCutAction.Remove, getSelectors(this.facet)]], EmptyInit),
          'Diamond: non-zero address facet'
        );
      });

      it('reverts with an empty list of selectors', async function () {
        await expectRevert(cutFn(this.contract, [[ZeroAddress, FacetCutAction.Remove, []]], EmptyInit), 'Diamond: no function selectors');
      });

      it('reverts with a non-existing function selector', async function () {
        await expectRevert(
          cutFn(this.contract, [[ZeroAddress, FacetCutAction.Remove, getSelectors(this.facet)]], EmptyInit),
          'Diamond: function not found'
        );
      });

      it('reverts with an immutable function selector', async function () {
        await expectRevert(
          cutFn(this.contract, [[ZeroAddress, FacetCutAction.Remove, getSelectors(artifacts.require('DiamondMock'))]], EmptyInit),
          'Diamond: immutable function'
        );
      });

      context('when successful (full facet removal)', function () {
        beforeEach(async function () {
          this.cuts = [
            [this.facet.address, FacetCutAction.Add, getSelectors(this.facet)],
            [ZeroAddress, FacetCutAction.Remove, getSelectors(this.facet)],
          ];
          this.receipt = await cutFn(this.contract, this.cuts, EmptyInit);
        });

        it('removes the facet in facets()', async function () {
          const facets = await this.contract.facets();
          (typeof facets.find((facet) => facet.facetAddress == this.facet.address)).should.equal('undefined');
        });

        it('removes the selectors in facetFunctionSelectors(address)', async function () {
          const facetFunctionSelectors = await this.contract.facetFunctionSelectors(this.facet.address);
          facetFunctionSelectors.length.should.be.zero;
        });

        it('removes the facet address in facetAddresses()', async function () {
          const facetAddresses = await this.contract.facetAddresses();
          facetAddresses.indexOf(this.facet.address).should.be.equal(-1);
        });

        it('removes each function selector in facetAddress(bytes4)', async function () {
          const selectors = getSelectors(this.facet);
          for (const selector of selectors) {
            (await this.contract.facetAddress(selector)).should.be.equal(ZeroAddress);
          }
        });

        it('emits a DiamondCut event', async function () {
          expectEvent(this.receipt, 'DiamondCut', {
            _diamondCut: this.cuts,
            _init: EmptyInit[0],
            _calldata: EmptyInit[1],
          });
        });
      });

      context('when successful (partial facet removal)', function () {
        beforeEach(async function () {
          this.removedSelectors = getSelectors(this.facet, newFacetFilter);
          this.cuts = [
            [this.facet.address, FacetCutAction.Add, getSelectors(this.facet)],
            [ZeroAddress, FacetCutAction.Remove, this.removedSelectors],
          ];
          this.receipt = await cutFn(this.contract, this.cuts, EmptyInit);
        });

        it('keeps the facet in facets()', async function () {
          const facets = await this.contract.facets();
          (typeof facets.find((facet) => facet.facetAddress == this.facet.address)).should.not.equal('undefined');
        });

        it('removes the removed selectors in facetFunctionSelectors(address)', async function () {
          const facetFunctionSelectors = await this.contract.facetFunctionSelectors(this.facet.address);
          facetFunctionSelectors.length.should.not.be.zero;
          for (const removedSelector of this.removedSelectors) {
            facetFunctionSelectors.indexOf(removedSelector).should.be.equal(-1);
          }
        });

        it('keeps the facet address in facetAddresses()', async function () {
          const facetAddresses = await this.contract.facetAddresses();
          facetAddresses.indexOf(this.facet.address).should.not.be.equal(-1);
        });

        it('removes each function selector in facetAddress(bytes4)', async function () {
          for (const removedSelector of this.removedSelectors) {
            (await this.contract.facetAddress(removedSelector)).should.be.equal(ZeroAddress);
          }
        });

        it('emits a DiamondCut event', async function () {
          expectEvent(this.receipt, 'DiamondCut', {
            _diamondCut: this.cuts,
            _init: EmptyInit[0],
            _calldata: EmptyInit[1],
          });
        });
      });
    });

    describe('REPLACE action', function () {
      it('reverts with a zero address facet', async function () {
        await expectRevert(
          cutFn(this.contract, [[ZeroAddress, FacetCutAction.Replace, getSelectors(this.facet)]], EmptyInit),
          'Diamond: zero address facet'
        );
      });

      it('reverts with an empty list of selectors', async function () {
        await expectRevert(cutFn(this.contract, [[this.facet.address, FacetCutAction.Replace, []]], EmptyInit), 'Diamond: no function selectors');
      });

      it('reverts with a non-contract facet', async function () {
        await expectRevert(
          cutFn(
            this.contract,
            [
              [this.facet.address, FacetCutAction.Add, getSelectors(this.facet)],
              [deployer, FacetCutAction.Replace, getSelectors(this.facet)],
            ],
            EmptyInit
          ),
          'Diamond: facet has no code'
        );
      });

      it('reverts when replacing a function from an identical facet', async function () {
        await expectRevert(
          cutFn(
            this.contract,
            [
              [this.facet.address, FacetCutAction.Add, getSelectors(this.facet)],
              [this.facet.address, FacetCutAction.Replace, getSelectors(this.facet)],
            ],
            EmptyInit
          ),
          'Diamond: identical function'
        );
      });

      context('when successful (full facet replacement)', function () {
        beforeEach(async function () {
          this.newFacet = await artifacts.require('FacetMock').new();
          this.cuts = [
            [this.facet.address, FacetCutAction.Add, getSelectors(this.facet)],
            [this.newFacet.address, FacetCutAction.Replace, getSelectors(this.newFacet)],
          ];
          this.receipt = await cutFn(this.contract, this.cuts, EmptyInit);
        });

        it('removes the old facet in facets()', async function () {
          const facets = await this.contract.facets();
          const oldFacet = facets.find((facet) => facet.facetAddress == this.facet.address);
          (typeof oldFacet).should.be.equal('undefined');
        });

        it('adds the new facet in facets()', async function () {
          const facets = await this.contract.facets();
          const newFacet = facets.find((facet) => facet.facetAddress == this.newFacet.address);
          const selectors = getSelectors(this.newFacet);
          selectors.length.should.be.equal(newFacet.functionSelectors.length);
          for (const selector of selectors) {
            newFacet.functionSelectors.indexOf(selector).should.not.be.equal(-1);
          }
        });

        it('adds the selectors in facetFunctionSelectors(address)', async function () {
          const selectors = getSelectors(this.newFacet);
          const facetFunctionSelectors = await this.contract.facetFunctionSelectors(this.newFacet.address);
          selectors.length.should.be.equal(facetFunctionSelectors.length);
          for (const selector of selectors) {
            facetFunctionSelectors.indexOf(selector).should.not.be.equal(-1);
          }
        });

        it('removes the old facet address in facetAddresses()', async function () {
          const facetAddresses = await this.contract.facetAddresses();
          facetAddresses.indexOf(this.facet.address).should.be.equal(-1);
        });

        it('adds the new facet address in facetAddresses()', async function () {
          const facetAddresses = await this.contract.facetAddresses();
          facetAddresses.indexOf(this.newFacet.address).should.not.be.equal(-1);
        });

        it('adds each function selector in facetAddress(bytes4)', async function () {
          const selectors = getSelectors(this.newFacet);
          for (const selector of selectors) {
            (await this.contract.facetAddress(selector)).should.be.equal(this.newFacet.address);
          }
        });

        it('emits a DiamondCut event', async function () {
          expectEvent(this.receipt, 'DiamondCut', {
            _diamondCut: this.cuts,
            _init: EmptyInit[0],
            _calldata: EmptyInit[1],
          });
        });
      });

      context('when successful (partial facet replacement)', function () {
        beforeEach(async function () {
          this.newFacet = await artifacts.require('FacetMock').new();
          this.replacedSelectors = getSelectors(this.newFacet, newFacetFilter);
          this.cuts = [
            [this.facet.address, FacetCutAction.Add, getSelectors(this.facet)],
            [this.newFacet.address, FacetCutAction.Replace, this.replacedSelectors],
          ];
          this.receipt = await cutFn(this.contract, this.cuts, EmptyInit);
        });

        it('keeps the old facet in facets()', async function () {
          const facets = await this.contract.facets();
          (typeof facets.find((facet) => facet.facetAddress == this.facet.address)).should.not.be.equal('undefined');
        });

        it('adds the new facet in facets()', async function () {
          const facets = await this.contract.facets();
          const newFacet = facets.find((facet) => facet.facetAddress == this.newFacet.address);
          this.replacedSelectors.length.should.be.equal(newFacet.functionSelectors.length);
          for (const replaceSelector of this.replacedSelectors) {
            newFacet.functionSelectors.indexOf(replaceSelector).should.not.be.equal(-1);
          }
        });

        it('adds the selectors in facetFunctionSelectors(address)', async function () {
          const facetFunctionSelectors = await this.contract.facetFunctionSelectors(this.newFacet.address);
          this.replacedSelectors.length.should.be.equal(facetFunctionSelectors.length);
          for (const replacedSelector of this.replacedSelectors) {
            facetFunctionSelectors.indexOf(replacedSelector).should.not.be.equal(-1);
          }
        });

        it('keeps the old facet address in facetAddresses()', async function () {
          const facetAddresses = await this.contract.facetAddresses();
          facetAddresses.indexOf(this.facet.address).should.not.be.equal(-1);
        });

        it('adds the new facet address in facetAddresses()', async function () {
          const facetAddresses = await this.contract.facetAddresses();
          facetAddresses.indexOf(this.newFacet.address).should.not.be.equal(-1);
        });

        it('replaces each function selector in facetAddress(bytes4)', async function () {
          for (const replacedSelector of this.replacedSelectors) {
            (await this.contract.facetAddress(replacedSelector)).should.be.equal(this.newFacet.address);
          }
        });

        it('emits a DiamondCut event', async function () {
          expectEvent(this.receipt, 'DiamondCut', {
            _diamondCut: this.cuts,
            _init: EmptyInit[0],
            _calldata: EmptyInit[1],
          });
        });
      });
    });
  });

  describe('initialization', function () {
    beforeEach(async function () {
      this.cuts = [[this.facet.address, FacetCutAction.Add, getSelectors(this.facet)]];
    });
    it('reverts with a zero address as init target and a non-empty init calldata', async function () {
      await expectRevert(cutFn(this.contract, [], [ZeroAddress, '0x00']), 'Diamond: calldata_ is not empty');
    });

    it('reverts with a non-zero address as init target and an empty init calldata', async function () {
      await expectRevert(cutFn(this.contract, [], [this.facet.address, '0x']), 'Diamond: calldata_ is empty');
    });

    it('reverts with non-contract target address', async function () {
      await expectRevert(cutFn(this.contract, [], [deployer, '0x00']), 'Diamond: init_ has no code');
    });

    it('reverts when the init function reverts (without an error message)', async function () {
      await expectRevert(
        cutFn(this.contract, this.cuts, [this.facet.address, new utils.Interface(this.facet.abi).encodeFunctionData('revertsWithoutMessage', [])]),
        'Diamond: init_ call reverted'
      );
    });

    it('reverts when the init function reverts (with an error message)', async function () {
      await expectRevert(
        cutFn(this.contract, this.cuts, [this.facet.address, new utils.Interface(this.facet.abi).encodeFunctionData('revertsWithMessage', [])]),
        'Facet: reverted'
      );
    });

    context('when successful (with a facet function)', function () {
      beforeEach(async function () {
        this.inits = [this.facet.address, new utils.Interface(this.facet.abi).encodeFunctionData('init', [])];
        this.receipt = await cutFn(this.contract, this.cuts, this.inits);
      });

      it('emits a DiamondCut event', async function () {
        expectEvent(this.receipt, 'DiamondCut', {
          _diamondCut: this.cuts,
          _init: batchInit ? EmptyInit[0] : this.inits[0],
          _calldata: batchInit ? EmptyInit[1] : this.inits[1],
        });
      });

      it('calls the function', async function () {
        expectEvent(this.receipt, 'FacetFunctionCalled', {});
      });
    });

    context('when successful (with an immutable function)', function () {
      beforeEach(async function () {
        this.inits = [this.contract.address, new utils.Interface(this.contract.abi).encodeFunctionData('immutableFunction', [])];
        this.receipt = await cutFn(this.contract, [], this.inits);
      });

      it('emits a DiamondCut event', async function () {
        expectEvent(this.receipt, 'DiamondCut', {
          _diamondCut: [],
          _init: batchInit ? EmptyInit[0] : this.inits[0],
          _calldata: batchInit ? EmptyInit[1] : this.inits[1],
        });
      });

      it('calls the function', async function () {
        expectEvent(this.receipt, 'ImmutableFunctionCalled', {});
      });
    });
  });
}
