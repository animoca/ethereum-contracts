const {ZeroAddress, EmptyByte} = require('../../../src/constants');
const {loadFixture} = require('../../helpers/fixtures');
const {FacetCutAction, deployDiamond, getSelectors, newFacetFilter} = require('../../helpers/diamond');
const {getForwarderRegistryAddress} = require('../../helpers/run');
const {shouldSupportInterfaces} = require('../introspection/behaviors/SupportsInterface.behavior');

const EmptyInit = [ZeroAddress, EmptyByte];

async function expectDiamondCutEvent(receipt, expectedCuts, expectedInit, expectedCalldata) {
  const event = (await receipt.wait()).events.find((e) => e.event == 'DiamondCut');
  const cuts = event.args[0];
  expect(cuts.length).to.equal(expectedCuts.length);
  for (let i = 0; i < cuts.length; i++) {
    const cut = cuts[i];
    const expectedCut = expectedCuts[i];
    expect(cut[0]).to.equal(expectedCut[0]);
    expect(cut[1]).to.equal(expectedCut[1]);
    const selectors = cut[2];
    const expectedSelectors = expectedCut[2];
    expect(selectors.length).to.equal(expectedSelectors.length);
    for (let j = 0; j < selectors.length; j++) {
      expect(selectors[j]).to.equal(expectedSelectors[j]);
    }
  }
  expect(event.args[1]).to.equal(expectedInit);
  expect(event.args[2]).to.equal(expectedCalldata);
}

const facetsConfig = [
  {name: 'ProxyAdminFacet', ctorArguments: ['forwarderRegistry'], init: {method: 'initProxyAdminStorage', arguments: ['initialAdmin']}},
  {name: 'DiamondCutFacet', ctorArguments: ['forwarderRegistry'], init: {method: 'initDiamondCutStorage'}},
  {name: 'DiamondLoupeFacet', ctorArguments: ['forwarderRegistry'], init: {method: 'initDiamondLoupeStorage'}},
  {name: 'InterfaceDetectionFacet'},
];

describe('Diamond', function () {
  let deployer, other;

  before(async function () {
    [deployer, other] = await ethers.getSigners();
  });

  const fixture = async function () {
    const forwarderRegistryAddress = await getForwarderRegistryAddress();
    const deployments = await deployDiamond(
      facetsConfig,
      {forwarderRegistry: forwarderRegistryAddress, initialAdmin: deployer.address},
      ['FacetMock'],
      newFacetFilter,
      'DiamondMock'
    );
    this.contract = deployments.diamond;
    this.facets = deployments.facets;
    const Facet = await ethers.getContractFactory('FacetMock');
    this.facet = await Facet.deploy();
    await this.facet.deployed();
  };

  beforeEach(async function () {
    await loadFixture(fixture, this);
  });

  describe('fallback function', function () {
    it('reverts with an unknown function', async function () {
      await expect(this.contract.doSomething()).to.be.revertedWith('Diamond: function not found');
    });
  });

  function describeDiamondCut(cutFn, batchInit) {
    describe('facet cuts', function () {
      it('reverts when the cut action is incorrect', async function () {
        await expect(cutFn(this.contract, [[this.facet.address, 3, []]], EmptyInit)).to.be.reverted;
      });

      describe('ADD action', function () {
        it('reverts with a zero address facet', async function () {
          await expect(cutFn(this.contract, [[ZeroAddress, FacetCutAction.Add, getSelectors(this.facet)]], EmptyInit)).to.be.revertedWith(
            'Diamond: facet has no code'
          );
        });

        it('reverts with an empty list of selectors', async function () {
          await expect(cutFn(this.contract, [[this.facet.address, FacetCutAction.Add, []]], EmptyInit)).to.be.revertedWith(
            'Diamond: no function selectors'
          );
        });

        it('reverts with a non-contract facet', async function () {
          await expect(cutFn(this.contract, [[deployer.address, FacetCutAction.Add, getSelectors(this.facet)]], EmptyInit)).to.be.revertedWith(
            'Diamond: facet has no code'
          );
        });

        it('reverts with an existing function selector', async function () {
          const cutFacet = this.facets['DiamondCutFacet'];
          await expect(cutFn(this.contract, [[cutFacet.address, FacetCutAction.Add, getSelectors(cutFacet)]], EmptyInit)).to.be.revertedWith(
            'Diamond: selector already added'
          );
        });

        context('when successful', function () {
          beforeEach(async function () {
            this.cuts = [[this.facet.address, FacetCutAction.Add, getSelectors(this.facet)]];
            this.receipt = await cutFn(this.contract, this.cuts, EmptyInit);
          });

          it('adds the facet in facets()', async function () {
            const facets = await this.contract.facets();
            const facet = facets.find((f) => f.facet == this.facet.address);
            expect(facet).not.to.be.undefined;

            const selectors = getSelectors(this.facet);
            expect(selectors.length).to.equal(facet.selectors.length);
            for (const selector of selectors) {
              expect(facet.selectors.find((s) => s == selector)).not.to.be.undefined;
            }
          });

          it('adds the selectors in facetFunctionSelectors(address)', async function () {
            const selectors = getSelectors(this.facet);
            const facetFunctionSelectors = await this.contract.facetFunctionSelectors(this.facet.address);
            expect(selectors.length).to.equal(facetFunctionSelectors.length);
            for (const selector of selectors) {
              expect(facetFunctionSelectors.find((s) => s == selector)).not.to.be.undefined;
            }
          });

          it('adds the facet address in facetAddresses()', async function () {
            const facetAddresses = await this.contract.facetAddresses();
            expect(facetAddresses.find((f) => f == this.facet.address)).to.not.be.undefined;
          });

          it('adds each function selector in facetAddress(bytes4)', async function () {
            const selectors = getSelectors(this.facet);
            for (const selector of selectors) {
              expect(await this.contract.facetAddress(selector)).to.equal(this.facet.address);
            }
          });

          it('emits a DiamondCut event', async function () {
            await expectDiamondCutEvent(this.receipt, this.cuts, EmptyInit[0], EmptyInit[1]);
          });
        });
      });

      describe('REMOVE action', function () {
        it('reverts with a non-zero address facet', async function () {
          await expect(cutFn(this.contract, [[this.facet.address, FacetCutAction.Remove, getSelectors(this.facet)]], EmptyInit)).to.be.revertedWith(
            'Diamond: non-zero address facet'
          );
        });

        it('reverts with an empty list of selectors', async function () {
          await expect(cutFn(this.contract, [[ZeroAddress, FacetCutAction.Remove, []]], EmptyInit)).to.be.revertedWith(
            'Diamond: no function selectors'
          );
        });

        it('reverts with a non-existing function selector', async function () {
          await expect(cutFn(this.contract, [[ZeroAddress, FacetCutAction.Remove, getSelectors(this.facet)]], EmptyInit)).to.be.revertedWith(
            'Diamond: selector not found'
          );
        });

        it('reverts with an immutable function selector', async function () {
          const artifact = await ethers.getContractFactory('DiamondMock');
          const selectors = [ethers.utils.Interface.getSighash(artifact.interface.functions['immutableFunction()'])];
          await expect(cutFn(this.contract, [[ZeroAddress, FacetCutAction.Remove, selectors]], EmptyInit)).to.be.revertedWith(
            'Diamond: immutable function'
          );
        });

        context('when successful (full facet removal)', function () {
          context('when selectors slot was fully filled', function () {
            beforeEach(async function () {
              await cutFn(this.contract, [[this.facet.address, FacetCutAction.Add, getSelectors(this.facet)]], EmptyInit);
              this.cuts = [[ZeroAddress, FacetCutAction.Remove, getSelectors(this.facet)]];
              this.receipt = await cutFn(this.contract, this.cuts, EmptyInit);
            });

            it('removes the facet in facets()', async function () {
              const facets = await this.contract.facets();
              expect(facets.find((facet) => facet.facet == this.facet.address)).to.be.undefined;
            });

            it('removes the selectors in facetFunctionSelectors(address)', async function () {
              expect((await this.contract.facetFunctionSelectors(this.facet.address)).length).to.equal(0);
            });

            it('removes the facet address in facetAddresses()', async function () {
              const facetAddresses = await this.contract.facetAddresses();
              expect(facetAddresses.find((f) => f.address == this.facet.address)).to.be.undefined;
            });

            it('removes each function selector in facetAddress(bytes4)', async function () {
              const selectors = getSelectors(this.facet);
              for (const selector of selectors) {
                expect(await this.contract.facetAddress(selector)).to.equal(ZeroAddress);
              }
            });

            it('emits a DiamondCut event', async function () {
              await expectDiamondCutEvent(this.receipt, this.cuts, EmptyInit[0], EmptyInit[1]);
            });
          });

          context('when selectors slot was partially filled', function () {
            beforeEach(async function () {
              const selectors = getSelectors(this.facet, (el) => el.name !== 'c');
              await cutFn(this.contract, [[this.facet.address, FacetCutAction.Add, selectors]], EmptyInit);
              this.cuts = [[ZeroAddress, FacetCutAction.Remove, selectors]];
              this.receipt = await cutFn(this.contract, this.cuts, EmptyInit);
            });

            it('removes the facet in facets()', async function () {
              const facets = await this.contract.facets();
              expect(facets.find((facet) => facet.facet == this.facet.address)).to.be.undefined;
            });

            it('removes the selectors in facetFunctionSelectors(address)', async function () {
              expect((await this.contract.facetFunctionSelectors(this.facet.address)).length).to.equal(0);
            });

            it('removes the facet address in facetAddresses()', async function () {
              const facetAddresses = await this.contract.facetAddresses();
              expect(facetAddresses.find((f) => f.address == this.facet.address)).to.be.undefined;
            });

            it('removes each function selector in facetAddress(bytes4)', async function () {
              const selectors = getSelectors(this.facet);
              for (const selector of selectors) {
                expect(await this.contract.facetAddress(selector)).to.equal(ZeroAddress);
              }
            });

            it('emits a DiamondCut event', async function () {
              await expectDiamondCutEvent(this.receipt, this.cuts, EmptyInit[0], EmptyInit[1]);
            });
          });
        });

        context('when successful (partial facet removal)', function () {
          context('when removing down to a fully filled selectors slot', function () {
            beforeEach(async function () {
              await cutFn(this.contract, [[this.facet.address, FacetCutAction.Add, getSelectors(this.facet)]], EmptyInit);
              this.removedSelectors = getSelectors(
                this.facet,
                (el) =>
                  el.name === 'a' ||
                  el.name === 'b' ||
                  el.name === 'c' ||
                  el.name === 'd' ||
                  el.name === 'e' ||
                  el.name === 'f' ||
                  el.name === 'g' ||
                  el.name === 'h'
              );
              this.cuts = [[ZeroAddress, FacetCutAction.Remove, this.removedSelectors]];
              this.receipt = await cutFn(this.contract, this.cuts, EmptyInit);
            });

            it('keeps the facet in facets()', async function () {
              const facets = await this.contract.facets();
              expect(facets.find((facet) => facet.facet == this.facet.address)).not.to.be.undefined;
            });

            it('removes the removed selectors in facetFunctionSelectors(address)', async function () {
              const facetFunctionSelectors = await this.contract.facetFunctionSelectors(this.facet.address);
              expect(facetFunctionSelectors.length).not.to.equal(0);
              for (const removedSelector of this.removedSelectors) {
                expect(facetFunctionSelectors.find((s) => s == removedSelector)).to.be.undefined;
              }
            });

            it('keeps the facet address in facetAddresses()', async function () {
              const facetAddresses = await this.contract.facetAddresses();
              expect(facetAddresses.find((f) => f == this.facet.address)).to.not.be.undefined;
            });

            it('removes each function selector in facetAddress(bytes4)', async function () {
              for (const removedSelector of this.removedSelectors) {
                expect(await this.contract.facetAddress(removedSelector)).to.equal(ZeroAddress);
              }
            });

            it('emits a DiamondCut event', async function () {
              await expectDiamondCutEvent(this.receipt, this.cuts, EmptyInit[0], EmptyInit[1]);
            });
          });

          context('when removing down to a partially filled selectors slot', function () {
            beforeEach(async function () {
              const selectors = getSelectors(this.facet, (el) => el.name !== 'doSomething');
              await cutFn(this.contract, [[this.facet.address, FacetCutAction.Add, selectors]], EmptyInit);
              this.removedSelectors = getSelectors(this.facet, (el) => el.name !== 'doSomething' && el.name === 'a');
              this.cuts = [[ZeroAddress, FacetCutAction.Remove, this.removedSelectors]];
              this.receipt = await cutFn(this.contract, this.cuts, EmptyInit);
            });

            it('keeps the facet in facets()', async function () {
              const facets = await this.contract.facets();
              expect(facets.find((facet) => facet.facet == this.facet.address)).not.to.be.undefined;
            });

            it('removes the removed selectors in facetFunctionSelectors(address)', async function () {
              const facetFunctionSelectors = await this.contract.facetFunctionSelectors(this.facet.address);
              expect(facetFunctionSelectors.length).not.to.equal(0);
              for (const removedSelector of this.removedSelectors) {
                expect(facetFunctionSelectors.find((s) => s == removedSelector)).to.be.undefined;
              }
            });

            it('keeps the facet address in facetAddresses()', async function () {
              const facetAddresses = await this.contract.facetAddresses();
              expect(facetAddresses.find((f) => f == this.facet.address)).to.not.be.undefined;
            });

            it('removes each function selector in facetAddress(bytes4)', async function () {
              for (const removedSelector of this.removedSelectors) {
                expect(await this.contract.facetAddress(removedSelector)).to.equal(ZeroAddress);
              }
            });

            it('emits a DiamondCut event', async function () {
              await expectDiamondCutEvent(this.receipt, this.cuts, EmptyInit[0], EmptyInit[1]);
            });
          });
        });
      });

      describe('REPLACE action', function () {
        it('reverts with a zero address facet', async function () {
          await expect(cutFn(this.contract, [[ZeroAddress, FacetCutAction.Replace, getSelectors(this.facet)]], EmptyInit)).to.be.revertedWith(
            'Diamond: facet has no code'
          );
        });

        it('reverts with an empty list of selectors', async function () {
          await expect(cutFn(this.contract, [[this.facet.address, FacetCutAction.Replace, []]], EmptyInit)).to.be.revertedWith(
            'Diamond: no function selectors'
          );
        });

        it('reverts with a non-contract facet', async function () {
          await expect(
            cutFn(
              this.contract,
              [
                [this.facet.address, FacetCutAction.Add, getSelectors(this.facet)],
                [deployer.address, FacetCutAction.Replace, getSelectors(this.facet)],
              ],
              EmptyInit
            )
          ).to.be.revertedWith('Diamond: facet has no code');
        });

        it('reverts when replacing a function from an identical facet', async function () {
          await expect(
            cutFn(
              this.contract,
              [
                [this.facet.address, FacetCutAction.Add, getSelectors(this.facet)],
                [this.facet.address, FacetCutAction.Replace, getSelectors(this.facet)],
              ],
              EmptyInit
            )
          ).to.be.revertedWith('Diamond: identical function');
        });

        it('reverts when replacing a function does not exist', async function () {
          await expect(cutFn(this.contract, [[this.facet.address, FacetCutAction.Replace, getSelectors(this.facet)]], EmptyInit)).to.be.revertedWith(
            'Diamond: selector not found'
          );
        });

        it('reverts with an immutable function selector', async function () {
          const artifact = await ethers.getContractFactory('DiamondMock');
          const selectors = [ethers.utils.Interface.getSighash(artifact.interface.functions['immutableFunction()'])];
          await expect(cutFn(this.contract, [[this.facet.address, FacetCutAction.Replace, selectors]], EmptyInit)).to.be.revertedWith(
            'Diamond: immutable function'
          );
        });

        context('when successful (full facet replacement)', function () {
          beforeEach(async function () {
            await cutFn(this.contract, [[this.facet.address, FacetCutAction.Add, getSelectors(this.facet)]], EmptyInit);
            const Facet = await ethers.getContractFactory('FacetMock');
            this.newFacet = await Facet.deploy();
            await this.newFacet.deployed();
            this.cuts = [[this.newFacet.address, FacetCutAction.Replace, getSelectors(this.newFacet)]];
            this.receipt = await cutFn(this.contract, this.cuts, EmptyInit);
          });

          it('removes the old facet in facets()', async function () {
            const facets = await this.contract.facets();
            expect(facets.find((facet) => facet.facet == this.facet.address)).to.be.undefined;
          });

          it('adds the new facet in facets()', async function () {
            const facets = await this.contract.facets();
            const newFacet = facets.find((f) => f.facet == this.newFacet.address);
            expect(newFacet).not.to.be.undefined;

            const selectors = getSelectors(this.newFacet);
            expect(selectors.length).to.equal(newFacet.selectors.length);
            for (const selector of selectors) {
              expect(newFacet.selectors.find((s) => s == selector)).not.to.be.undefined;
            }
          });

          it('adds the selectors in facetFunctionSelectors(address)', async function () {
            const selectors = getSelectors(this.newFacet);
            const facetFunctionSelectors = await this.contract.facetFunctionSelectors(this.newFacet.address);
            expect(selectors.length).to.equal(facetFunctionSelectors.length);
            for (const selector of selectors) {
              expect(facetFunctionSelectors.find((s) => s == selector)).not.to.be.undefined;
            }
          });

          it('removes the old facet address in facetAddresses()', async function () {
            const facetAddresses = await this.contract.facetAddresses();
            expect(facetAddresses.find((f) => f == this.facet.address)).to.be.undefined;
          });

          it('adds the new facet address in facetAddresses()', async function () {
            const facetAddresses = await this.contract.facetAddresses();
            expect(facetAddresses.find((f) => f == this.newFacet.address)).not.to.be.undefined;
          });

          it('adds each function selector in facetAddress(bytes4)', async function () {
            const selectors = getSelectors(this.newFacet);
            for (const selector of selectors) {
              expect(await this.contract.facetAddress(selector)).to.equal(this.newFacet.address);
            }
          });

          it('emits a DiamondCut event', async function () {
            await expectDiamondCutEvent(this.receipt, this.cuts, EmptyInit[0], EmptyInit[1]);
          });
        });

        context('when successful (partial facet replacement)', function () {
          beforeEach(async function () {
            await cutFn(this.contract, [[this.facet.address, FacetCutAction.Add, getSelectors(this.facet)]], EmptyInit);
            const Facet = await ethers.getContractFactory('FacetMock');
            this.newFacet = await Facet.deploy();
            await this.newFacet.deployed();
            this.replacedSelectors = getSelectors(this.newFacet, (el) => el.name !== 'doSomething');
            this.cuts = [[this.newFacet.address, FacetCutAction.Replace, this.replacedSelectors]];
            this.receipt = await cutFn(this.contract, this.cuts, EmptyInit);
          });

          it('keeps the old facet in facets()', async function () {
            const facets = await this.contract.facets();
            expect(facets.find((facet) => facet.facet == this.facet.address)).not.to.be.undefined;
          });

          it('adds the new facet in facets()', async function () {
            const facets = await this.contract.facets();
            const newFacet = facets.find((facet) => facet.facet == this.newFacet.address);
            expect(this.replacedSelectors.length).to.equal(newFacet.selectors.length);
            for (const replaceSelector of this.replacedSelectors) {
              expect(newFacet.selectors.find((s) => s == replaceSelector)).not.to.be.undefined;
            }
          });

          it('adds the selectors in facetFunctionSelectors(address)', async function () {
            const facetFunctionSelectors = await this.contract.facetFunctionSelectors(this.newFacet.address);
            expect(this.replacedSelectors.length).to.equal(facetFunctionSelectors.length);
            for (const replacedSelector of this.replacedSelectors) {
              expect(facetFunctionSelectors.find((s) => s == replacedSelector)).not.to.be.undefined;
            }
          });

          it('keeps the old facet address in facetAddresses()', async function () {
            const facetAddresses = await this.contract.facetAddresses();
            expect(facetAddresses.find((f) => f == this.facet.address)).not.to.be.undefined;
          });

          it('adds the new facet address in facetAddresses()', async function () {
            const facetAddresses = await this.contract.facetAddresses();
            expect(facetAddresses.find((f) => f == this.newFacet.address)).not.to.be.undefined;
          });

          it('replaces each function selector in facetAddress(bytes4)', async function () {
            for (const replacedSelector of this.replacedSelectors) {
              expect(await this.contract.facetAddress(replacedSelector)).to.equal(this.newFacet.address);
            }
          });

          it('emits a DiamondCut event', async function () {
            await expectDiamondCutEvent(this.receipt, this.cuts, EmptyInit[0], EmptyInit[1]);
          });
        });
      });
    });

    describe('initialization', function () {
      beforeEach(async function () {
        this.cuts = [[this.facet.address, FacetCutAction.Add, getSelectors(this.facet)]];
      });
      it('reverts with a zero address as init target and a non-empty init calldata', async function () {
        await expect(cutFn(this.contract, [], [ZeroAddress, '0x00'])).to.be.revertedWith('Diamond: data is not empty');
      });

      it('reverts with a non-zero address as init target and an empty init calldata', async function () {
        await expect(cutFn(this.contract, [], [this.facet.address, EmptyByte])).to.be.revertedWith('Diamond: data is empty');
      });

      it('reverts with non-contract target address', async function () {
        await expect(cutFn(this.contract, [], [deployer.address, '0x00'])).to.be.revertedWith('Diamond: target has no code');
      });

      it('reverts when the init function reverts (without an error message)', async function () {
        await expect(
          cutFn(this.contract, this.cuts, [this.facet.address, this.facet.interface.encodeFunctionData('revertsWithoutMessage', [])])
        ).to.be.revertedWith('Diamond: init call reverted');
      });

      it('reverts when the init function reverts (with an error message)', async function () {
        await expect(
          cutFn(this.contract, this.cuts, [this.facet.address, this.facet.interface.encodeFunctionData('revertsWithMessage', [])])
        ).to.be.revertedWith('Facet: reverted');
      });

      context('when successful (with a facet function)', function () {
        beforeEach(async function () {
          this.inits = [this.facet.address, this.facet.interface.encodeFunctionData('doSomething', [])];
          this.receipt = await cutFn(this.contract, this.cuts, this.inits);
        });

        it('emits a DiamondCut event', async function () {
          await expectDiamondCutEvent(this.receipt, this.cuts, batchInit ? EmptyInit[0] : this.inits[0], batchInit ? EmptyInit[1] : this.inits[1]);
        });

        it('calls the function', async function () {
          await expect(this.receipt).to.emit(this.contract, 'FacetFunctionCalled');
        });
      });

      context('when successful (with an immutable function)', function () {
        beforeEach(async function () {
          this.inits = [this.contract.address, this.contract.interface.encodeFunctionData('immutableFunction', [])];
          this.receipt = await cutFn(this.contract, [], this.inits);
        });

        it('emits a DiamondCut event', async function () {
          await expectDiamondCutEvent(this.receipt, [], batchInit ? EmptyInit[0] : this.inits[0], batchInit ? EmptyInit[1] : this.inits[1]);
        });

        it('calls the function', async function () {
          await expect(this.receipt).to.emit(this.contract, 'ImmutableFunctionCalled');
        });
      });
    });
  }

  describe('diamondCut(FacetCut[],address,bytes)', function () {
    const batchInit = false;
    it('reverts when not called by the proxy admin', async function () {
      await expect(
        this.contract.connect(other).functions['diamondCut((address,uint8,bytes4[])[],address,bytes)']([], ...EmptyInit)
      ).to.be.revertedWith('ProxyAdmin: not the admin');
    });

    describeDiamondCut(async function (contract, cuts, init) {
      return contract.functions['diamondCut((address,uint8,bytes4[])[],address,bytes)'](cuts, ...init);
    }, batchInit);
  });

  describe('diamondCut(FacetCut[],Initialization[])', function () {
    const batchInit = true;
    it('reverts when not called by the proxy admin', async function () {
      await expect(
        this.contract.connect(other).functions['diamondCut((address,uint8,bytes4[])[],(address,bytes)[])']([], [EmptyInit])
      ).to.be.revertedWith('ProxyAdmin: not the admin');
    });

    describeDiamondCut(async function (contract, cuts, init) {
      return contract.functions['diamondCut((address,uint8,bytes4[])[],(address,bytes)[])'](cuts, [init]);
    }, batchInit);
  });

  shouldSupportInterfaces(['contracts/introspection/interfaces/IERC165.sol:IERC165', 'IDiamondLoupe', 'IDiamondCut', 'IDiamondCutBatchInit']);
});

describe('Facet', function () {
  it('calls all the empty functions (for code coverage)', async function () {
    const Facet = await ethers.getContractFactory('FacetMock');
    const facet = await Facet.deploy();
    await facet.deployed();

    await facet.a();
    await facet.b();
    await facet.c();
    await facet.d();
    await facet.e();
    await facet.f();
    await facet.g();
    await facet.h();
    await facet.i();
    await facet.j();
    await facet.k();
  });
});
