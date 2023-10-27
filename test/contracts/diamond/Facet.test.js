const {deployContract} = require('@animoca/ethereum-contract-helpers/src/test/deploy');

describe('Facet', function () {
  it('calls all the empty functions (for code coverage)', async function () {
    const facet = await deployContract('FacetMock');

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
