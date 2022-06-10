const {ethers} = require('hardhat');
const {expect} = require('chai');
const {ZeroBytes32} = require('../../../src/constants');
const {loadFixture} = require('../../helpers/fixtures');
const {deployContract} = require('../../helpers/contract');

describe('Bytes32', function () {
  const fixture = async function () {
    this.contract = await deployContract('Bytes32Mock');
  };
  beforeEach(async function () {
    await loadFixture(fixture, this);
  });

  context('toBase32String(bytes32)', function () {
    it('returns aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa with a zero value', async function () {
      expect(await this.contract.toBase32String(ZeroBytes32)).to.equal('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    });
    it('returns h777777777777777777777777777777777777777777777777774 with a max value', async function () {
      expect(await this.contract.toBase32String('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')).to.equal(
        'h777777777777777777777777777777777777777777777777774'
      );
    });
    it('returns abaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa with a one value', async function () {
      expect(await this.contract.toBase32String('0x0000000000000000000000000000000000000000000000000000000000000001')).to.equal(
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaae'
      );
    });
  });

  context('toASCIIString(bytes32)', function () {
    it('returns an empty string with a zero value', async function () {
      expect(await this.contract.toASCIIString(ZeroBytes32)).to.equal('');
    });

    it('returns an equal and same-length string for a bytes32 converted from a short string', async function () {
      const str = 'test';
      expect(await this.contract.toASCIIString(ethers.utils.formatBytes32String(str))).to.equal(str);
    });

    it('returns 32-length string for a bytes32 converted from a long string', async function () {
      const str = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
      expect(await this.contract.toASCIIString(ethers.utils.formatBytes32String(str))).to.equal(str.slice(0, 32));
    });
  });
});
