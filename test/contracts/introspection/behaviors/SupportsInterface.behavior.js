const {artifacts} = require('hardhat');
const {utils} = require('ethers');
const helper = require('@openzeppelin/test-helpers');

function makeInterfaceId(interface) {
  const abi = artifacts.require(interface).abi;
  const functions = abi.filter((el) => el.type == 'function').map((fn) => utils.Fragment.from(fn).format());
  return helper.makeInterfaceId.ERC165(functions);
}

function shouldSupportInterfaces(interfaces, maxGas = 30000) {
  describe('ERC165 supportsInterface(bytes4)', function () {
    beforeEach(function () {
      this.contract = this.contract || this.mock || this.token;
    });

    for (const interface of interfaces) {
      const interfaceId = makeInterfaceId(interface);

      describe(`${interface} (${interfaceId})`, function () {
        it('is supported', async function () {
          (await this.contract.supportsInterface(interfaceId)).should.equal(true);
        });

        it(`should use less than ${maxGas} gas [ @skip-on-coverage ]`, async function () {
          (await this.contract.supportsInterface.estimateGas(interfaceId)).should.be.lte(maxGas);
        });
      });
    }
  });
}

module.exports = {
  makeInterfaceId,
  shouldSupportInterfaces,
};
