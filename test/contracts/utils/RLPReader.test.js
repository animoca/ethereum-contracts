const {artifacts} = require('hardhat');
const {expectRevert} = require('@openzeppelin/test-helpers');
const {ZeroAddress} = require('../../../src/constants');

const {createFixtureLoader} = require('../../utils/fixture');
const fixtureLoader = createFixtureLoader();

let rlp = require('rlp');
let assert = require('chai').assert;

let toHex = (buf) => {
  buf = buf.toString('hex');
  if (buf.substring(0, 2) == '0x') return buf;
  return '0x' + buf.toString('hex');
};

let toRLPHeader = (block) => {
  return rlp.encode([
    block.parentHash,
    block.sha3Uncles,
    block.miner,
    block.stateRoot,
    block.transactionsRoot,
    block.receiptsRoot,
    block.logsBloom,
    new web3.utils.BN(block.difficulty),
    new web3.utils.BN(block.number),
    block.gasLimit,
    block.gasUsed,
    block.timestamp,
    block.extraData,
    block.mixHash,
    block.nonce,
  ]);
};

contract('RLPReader', async (accounts) => {
  const fixture = async function () {
    this.contract = await artifacts.require('RLPReaderMock').new();
  };
  beforeEach(async function () {
    await fixtureLoader(fixture, this);
  });

  describe('rlpLen()', function () {
    it('detects a 0 length item', async function () {
      (await this.contract.rlpLen(toHex(''))).should.be.bignumber.equal('0');
    });
    it('detects a non-0 length item', async function () {
      (await this.contract.rlpLen(toHex('1'))).should.be.bignumber.equal('1');
    });
  });

  describe('isList()', function () {
    it('returns true for a list', async function () {
      (await this.contract.isList(toHex(rlp.encode([1, 2, 3])))).should.be.true;
    });
    it('returns false for a 0 length item', async function () {
      (await this.contract.isList(toHex(''))).should.be.false;
    });
    it('returns false for a non-0 length, non-list item', async function () {
      (await this.contract.isList(toHex(rlp.encode('thisisnotalistbutjustareallylongstringsoyeahdealwithit')))).should.be.false;
    });
  });

  describe('itemLength()', function () {
    // covers 4 different scenarios listed on the spec in addition to the nested/empty structures
    it('detects the entire byte length of a short RLP item list', async function () {
      const item = rlp.encode([1, 2, 3]);
      (await this.contract.itemLength(toHex(item))).should.be.bignumber.equal(`${item.length}`);
    });
    it('detects the entire byte length of a long RLP item list', async function () {
      const item = rlp.encode(Array(1024).fill('a'));
      (await this.contract.itemLength(toHex(item))).should.be.bignumber.equal(`${item.length}`);
    });
    it('detects the entire byte length of an integer RLP item', async function () {
      const item = rlp.encode(1);
      (await this.contract.itemLength(toHex(item))).should.be.bignumber.equal(`${item.length}`);
    });
    it('detects the entire byte length of a long RLP item string', async function () {
      const item = rlp.encode('a'.repeat(1024));
      (await this.contract.itemLength(toHex(item))).should.be.bignumber.equal(`${item.length}`);
    });
    it('detects the entire byte length of a short RLP item string', async function () {
      const item = rlp.encode('somenormalstringthatisnot55characterslong');
      (await this.contract.itemLength(toHex(item))).should.be.bignumber.equal(`${item.length}`);
    });
    it('detects the entire byte length of a RLP item list with nested structure', async function () {
      const item = rlp.encode([[2, 3], 1]);
      (await this.contract.itemLength(toHex(item))).should.be.bignumber.equal(`${item.length}`);
    });

    it('detects the entire byte length of a empty RLP item list', async function () {
      const item = rlp.encode([]);
      (await this.contract.itemLength(toHex(item))).should.be.bignumber.equal(`${item.length}`);
    });
  });

  describe('payloadLocation()', function () {
    it('returns the correct payload memory offset and length for an integer', async function () {
      const result = await this.contract.payloadLocation(toHex(rlp.encode(1)));
      result.payloadLen.should.be.bignumber.equal('1');
      result.payloadMemPtr.sub(result.itemMemPtr).should.be.bignumber.equal('0');
    });
    it('returns the correct payload memory offset and length for a short array', async function () {
      const result = await this.contract.payloadLocation(toHex(rlp.encode(toHex(Array(36).fill(0).join('')))));
      result.payloadLen.should.be.bignumber.equal('18');
      result.payloadMemPtr.sub(result.itemMemPtr).should.be.bignumber.equal('1');
    });
    it('returns the correct payload memory offset and length for a long array', async function () {
      const result = await this.contract.payloadLocation(toHex(rlp.encode(toHex(Array(200).fill(0).join('')))));
      result.payloadLen.should.be.bignumber.equal('100');
      result.payloadMemPtr.sub(result.itemMemPtr).should.be.bignumber.equal('2');
    });
  });

  describe('numItems()', function () {
    it('reverts with a non-list item', async function () {
      await expectRevert(this.contract.numItems('0x'), 'RLP: ITEM_NOT_LIST');
    });
    it('detects the correct amount of items in an integers list', async function () {
      const el = [1, 2, 3];
      (await this.contract.numItems(toHex(rlp.encode(el)))).should.be.bignumber.equal(`${el.length}`);
    });
    it('detects the correct amount of items in a bytes list', async function () {
      const el = Array(1024).fill('a');
      (await this.contract.numItems(toHex(rlp.encode(el)))).should.be.bignumber.equal(`${el.length}`);
    });
    it('detects the correct amount of items in an empty list', async function () {
      const el = [];
      (await this.contract.numItems(toHex(rlp.encode(el)))).should.be.bignumber.equal(`${el.length}`);
    });
    it('detects the correct amount of items in a nested structure', async function () {
      const el = [[2, 3], 1];
      (await this.contract.numItems(toHex(rlp.encode(el)))).should.be.bignumber.equal(`${el.length}`);
    });
  });

  describe('toBytes()', function () {
    it('reverts on a wrong bytes input', async function () {
      await expectRevert(this.contract.toBytes(toHex('')), 'RLP: INVALID_BYTES_LENGTH');
    });
    it('empty bytes', async function () {
      const el = '0x';
      assert((await this.contract.toBytes(toHex(rlp.encode(el).toString('hex')))) == null);
    });
    it('1 word length', async function () {
      const el = '0x1111111111111111111111111111111111111111111111111111111111111111';
      (await this.contract.toBytes(toHex(rlp.encode(el).toString('hex')))).should.be.equal(el);
    });
    it('more than 1 word length', async function () {
      const el = '0x1234' + Buffer.alloc(33).toString('hex');
      (await this.contract.toBytes(toHex(rlp.encode(el).toString('hex')))).should.be.equal(el);
    });
  });

  describe('toUint()', function () {
    it('reverts on a wrong uint input', async function () {
      await expectRevert(this.contract.toUint(toHex(rlp.encode(toHex(Array(66).fill(0).join(''))))), 'RLP: INVALID_UINT_LENGTH');
      await expectRevert(this.contract.toUint(toHex('')), 'RLP: INVALID_UINT_LENGTH');
    });
    it('larger than 1 bytes', async function () {
      const el = 65537;
      (await this.contract.toUint(toHex(rlp.encode(el)))).should.be.bignumber.equal(`${el}`);
    });
    it('full zero uint', async function () {
      const el = Array(64).fill(0).join('');
      (await this.contract.toUint(toHex(rlp.encode(toHex(el))))).should.be.bignumber.equal('0');
    });
  });

  describe('toUintStrict()', function () {
    it('reverts on a wrong strict uint input', async function () {
      await expectRevert(this.contract.toUintStrict(toHex(rlp.encode(10))), 'RLP: INVALID_UINT_STRICT_LENGTH');
    });
    it('correct conversion', async function () {
      const el = Array(63).fill(0).join('') + '1';
      (await this.contract.toUintStrict(toHex(rlp.encode(toHex(el))))).should.be.bignumber.equal('1');
    });
  });

  describe('toAddress()', function () {
    it('reverts on a wrong address input', async function () {
      await expectRevert(this.contract.toAddress(toHex(rlp.encode('0x123'))), 'RLP: INVALID_ADDRESS_LENGTH');
      await expectRevert(this.contract.toAddress(toHex(rlp.encode(ZeroAddress + '1'))), 'RLP: INVALID_ADDRESS_LENGTH');
      await expectRevert(this.contract.toAddress(toHex('')), 'RLP: INVALID_ADDRESS_LENGTH');
    });
    it('correct conversion', async function () {
      const el = ZeroAddress;
      (await this.contract.toAddress(toHex(rlp.encode(el)))).should.be.equal(ZeroAddress);
    });
  });

  describe('toBoolean()', function () {
    it('reverts on a wrong boolean input', async function () {
      await expectRevert(this.contract.toBoolean(toHex(rlp.encode(256))), 'RLP: INVALID_BOOLEAN_LENGTH');
      await expectRevert(this.contract.toBoolean(toHex(toHex(''))), 'RLP: INVALID_BOOLEAN_LENGTH');
    });
    it('true value', async function () {
      const el = 1;
      (await this.contract.toBoolean(toHex(rlp.encode(el)))).should.be.true;
    });
    it('false value', async function () {
      const el = 0;
      (await this.contract.toBoolean(toHex(rlp.encode(el)))).should.be.false;
    });
  });

  describe('customDestructure()', function () {
    it('correct destructuration', async function () {
      const result = await this.contract.customDestructure(toHex(rlp.encode([ZeroAddress, 1, 65537])));
      result[0].should.be.equal(ZeroAddress);
      result[1].should.be.true;
      result[2].should.be.bignumber.equal('65537');
    });
  });

  describe('customNestedDestructure()', function () {
    it('correct destructuration', async function () {
      const result = await this.contract.customNestedDestructure(toHex(rlp.encode([[ZeroAddress, 1024]])));
      result[0].should.be.equal(ZeroAddress);
      result[1].should.be.bignumber.equal('1024');
    });
  });

  describe('bytesToString()', function () {
    it('correct conversion', async function () {
      const str = 'hello';
      (await this.contract.bytesToString(toHex(rlp.encode(str)))).should.be.equal(str);
    });
  });

  describe('toRlpBytes()', function () {
    it("converts an empty rlpItem to it's raw byte form", async function () {
      const res = await this.contract.toRlpBytes('0x');
      assert(res == null);
    });
    it("converts an rlpItem to it's raw byte form", async function () {
      let str = toHex(rlp.encode([1, 2, 3]).toString('hex'));
      (await this.contract.toRlpBytes(toHex(str))).should.be.equal(str);
    });
  });

  describe('customNestedToRlpBytes()', function () {
    it("correctly converts a nested rlpItem to it's raw byte from", async function () {
      let nestedStr = ['something'];
      let str = rlp.encode([nestedStr, 'foo']).toString('hex');
      nestedStr = rlp.encode(nestedStr).toString('hex');
      result = await this.contract.customNestedToRlpBytes(toHex(str));
      assert(toHex(result) == toHex(nestedStr), "incorrectly converted nested structure to it's raw rlp bytes");
    });
  });

  describe('toIterator()', function () {
    it('reverts when creating an iterator out of a non-list item', async function () {
      await expectRevert(this.contract.toIterator(toHex(rlp.encode('foo'))), 'RLP: ITEM_NOT_LIST');
    });
    it('creates an iterator out of a valid list', async function () {
      await this.contract.toIterator(toHex(rlp.encode([1, 'isvalid', 2])));
    });
  });

  describe('next()', function () {
    it('reverts when getting the next element at the end of a list', async function () {
      await expectRevert(this.contract.next(toHex(rlp.encode([]))), 'RLP: NO_NEXT_ITEM');
    });
    it('creates an iterator out of a valid list', async function () {
      await this.contract.next(toHex(rlp.encode([Array(1024).fill('a')])));
    });
  });

  describe('nestedIteration()', function () {
    it('creates an nested iterator out of a valid nested list', async function () {
      (await this.contract.nestedIteration(toHex(rlp.encode([['yeah!']])))).should.be.equal('yeah!');
    });
  });

  describe('toBlockHeader()', function () {
    it('correctly iterates over an RLP list (e.g., an RLP encoded block header)', async function () {
      // Block 8000000 from the Ethereum main net with a couple of fields omitted
      const block = {
        parentHash: '0x487e074bba7f0749950d7e2f226307c8ac388cb0410cfe817931a5a44077e159',
        sha3Uncles: '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347',
        stateRoot: '0x7b814195793c699d345339dd7a4225112ad91b9ba7f03787563a9e98ba692e52',
        transactionsRoot: '0xad6c9f611dfdd446855cb430b8392e20538db4f0349336063e710c6c483e9e43',
        receiptsRoot: '0xf022ddad6e90316614df496922cb73508a9abecfda2d3076a5f1129a01497869',
        difficulty: '2037888242889388',
        number: 8000000,
        extraData: '0x5050594520737061726b706f6f6c2d6574682d636e2d687a',
        gasLimit: 8002255,
        gasUsed: 7985243,
        timestamp: 1561100149,
        nonce: '0x00daa7b00156a516',
        hash: '0x4e454b49dc8a2e2a229e0ce911e9fd4d2aa647de4cf6e0df40cf71bff7283330',
        logsBloom:
          // eslint-disable-next-line max-len
          '0xc29754f51412a148104c6716000a3084218a2c2eb411080f0204cc2000182520544cd8896089451840a4c3d492209909825614420c21350104e0a81810b82018838f088200f3022616869299810060089f08291289c920ea25d1006460513529851001477aa905491218501179c40b01348430400ad167600e0141344140022135a01484482520131c40141583050710042168c050220010c1c443f2291b41688340084524418d0048b1328844438630c88000940524800c4001202a1540b00498350932001812960220043b200016c02cf06433548b5100429220aa00423421e25121330b410051204098d8406a600b3610403d208c8381c51bd15a9dc30004',
        miner: '0x5A0b54D5dc17e0AadC383d2db43B0a0D3E029c4c',
        mixHash: '0x8a24dc2c8fb497ff40a622173d9c7804a274de3da4b335b2ba0e3c53e3fae714',
        totalDifficulty: '10690776258913596267754',
      };
      const rlpHeader = toRLPHeader(block);
      const result = await this.contract.toBlockHeader(rlpHeader);
      assert(result.parentHash == block.parentHash, 'parentHash not equal');
      assert(result.sha3Uncles == block.sha3Uncles, 'sha3Uncles not equal');
      assert(result.stateRoot == block.stateRoot, 'stateRoot not equal');
      assert(result.transactionsRoot == block.transactionsRoot, 'transactionsRoot not equal');
      assert(result.receiptsRoot == block.receiptsRoot, 'receiptsRoot not equal');
      assert(result.difficulty == block.difficulty, 'difficulty not equal');
      assert(result.number == block.number, 'number not equal');
      assert(result.gasLimit == block.gasLimit, 'gasLimit not equal');
      assert(result.gasUsed == block.gasUsed, 'gasUsed not equal');
      assert(result.timestamp == block.timestamp, 'timestamp not equal');
      assert(result.nonce.toString() == web3.utils.toBN(block.nonce).toString(), 'nonce not equal');
    });
  });

  describe('rlpBytesKeccak256()', function () {
    it('correctly computes keccak256 hash of RLP bytes', async function () {
      let data = rlp.encode('foo');
      let result = await this.contract.rlpBytesKeccak256(toHex(data));
      assert.equal(result, web3.utils.keccak256(data), 'string');

      data = rlp.encode(42);
      result = await this.contract.rlpBytesKeccak256(toHex(data));
      assert.equal(result, web3.utils.keccak256(data), 'uint');

      data = rlp.encode(['foo', 42]);
      result = await this.contract.rlpBytesKeccak256(toHex(data));
      assert.equal(result, web3.utils.keccak256(data), 'list');
    });
  });
  describe('payloadKeccak256()', function () {
    it('correctly computes keccak256 hash of the item payload', async function () {
      const data = '0xdeadbeef';
      const rlpBytes = rlp.encode(Buffer.from(data.slice(2), 'hex'));
      const result = await this.contract.payloadKeccak256(rlpBytes);
      assert.equal(result, web3.utils.keccak256(data));
    });
    it('payloadKeccak256 for empty payload is the same as keccak256(new bytes(0))', async function () {
      // keccak256(new bytes(0))
      const EMPTY_BYTES_HASH = '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470';

      const emptyListRlpBytes = rlp.encode([]); // 0xc0
      const emptyListDataHash = await this.contract.payloadKeccak256(emptyListRlpBytes);
      assert.equal(emptyListDataHash, EMPTY_BYTES_HASH, 'empty list');

      const emptyBytesRlpBytes = rlp.encode(Buffer.alloc(0)); // 0x80
      const emptyBytesDataHash = await this.contract.payloadKeccak256(emptyBytesRlpBytes);
      assert.equal(emptyBytesDataHash, EMPTY_BYTES_HASH, 'empty bytes');
    });
  });
  describe('customNestedDestructureKeccak()', function () {
    it('correctly computes keccak256 hash of the item payload (nested list)', async function () {
      const data_0_0 = '0xdeadbeef';
      const data_0_1 = '0xaabbcc';

      const rlpBytes = rlp.encode([[Buffer.from(data_0_0.slice(2), 'hex'), Buffer.from(data_0_1.slice(2), 'hex')]]);

      const result = await this.contract.customNestedDestructureKeccak(rlpBytes);

      assert.equal(result[0], web3.utils.keccak256(data_0_0), 'item [0][0]');
      assert.equal(result[1], web3.utils.keccak256(data_0_1), 'item [0][1]');
    });
  });
});
