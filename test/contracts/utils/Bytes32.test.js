const {artifacts} = require('hardhat');

const {createFixtureLoader} = require('../../utils/fixture');
const fixtureLoader = createFixtureLoader();

describe('Bytes32', function () {
  const fixture = async function () {
    this.contract = await artifacts.require('Bytes32Mock').new();
  };
  beforeEach(async function () {
    await fixtureLoader(fixture, this);
  });

  context('toBase32String(bytes32)', function () {
    it('returns aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa with a zero value', async function () {
      (await this.contract.toBase32String('0x00')).should.be.equal('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    });
    it('returns h777777777777777777777777777777777777777777777777774 with a max value', async function () {
      (await this.contract.toBase32String('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')).should.be.equal(
        'h777777777777777777777777777777777777777777777777774'
      );
    });
    it('returns abaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa with a one value', async function () {
      (await this.contract.toBase32String('0x01')).should.be.equal('abaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    });
  });

  context('toASCIIString(bytes32)', function () {
    it('returns an empty string with a zero value', async function () {
      (await this.contract.toASCIIString('0x00')).should.be.equal('');
    });

    it('returns an equal and same-length string for a bytes32 converted from a short string', async function () {
      const str = 'test';
      (await this.contract.toASCIIString(await this.contract.strToBytes32(str))).should.be.equal(str);
    });

    it('returns 32-length string for a bytes32 converted from a long string', async function () {
      const str = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
      (await this.contract.toASCIIString(await this.contract.strToBytes32(str))).should.be.equal(str.slice(0, 32));
    });
  });
});
