const {expect} = require('chai');

const integers = [0, 1, 2, 1000, 123456789];

describe('UInt256ToDecimalStringMock', function () {
  beforeEach(async function () {
    const UInt256ToDecimalStringMock = await ethers.getContractFactory('UInt256ToDecimalStringMock');
    this.contract = await UInt256ToDecimalStringMock.deploy();
    await this.contract.deployed();
  });
  it('Should returns a decimal string', async function () {
    for (const integer of integers) {
      expect(await this.contract.toDecimalString(integer)).to.equal(integer.toString());
    }
  });
});
