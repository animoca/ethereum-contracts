const {ethers} = require('hardhat');
const {expect} = require('chai');

function makeInterfaceId(interfaceName) {
  const artifact = artifacts.readArtifactSync(interfaceName);
  const interface = new ethers.utils.Interface(artifact.abi);
  const sighashes = Object.values(interface.functions).map((fn) => interface.getSighash(fn));
  const interfaceId = sighashes
    .map((sighash) => Buffer.from(sighash.substring(2), 'hex'))
    .reduce((prev, curr) => {
      for (let i = 0; i < 4; i++) {
        prev[i] = prev[i] ^ curr[i];
      }
      return prev;
    }, Buffer.alloc(4));
  return `0x${interfaceId.toString('hex')}`;
}

function supportsInterfaces(interfaces, maxGas = 30000) {
  describe('ERC165 supportsInterface(bytes4)', function () {
    beforeEach(function () {
      this.contract = this.contract || this.mock || this.token;
    });

    for (const interface of interfaces) {
      const interfaceId = makeInterfaceId(interface);

      describe(`${interface} (${interfaceId})`, function () {
        it('is supported', async function () {
          expect(await this.contract.supportsInterface(interfaceId)).to.be.true;
        });

        it(`should use less than ${maxGas} gas [ @skip-on-coverage ]`, async function () {
          expect(await this.contract.estimateGas.supportsInterface(interfaceId)).to.be.lte(maxGas);
        });
      });
    }
  });
}

module.exports = {
  makeInterfaceId,
  supportsInterfaces,
};
