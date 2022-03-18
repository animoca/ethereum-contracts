const {BigNumber} = require('ethers');

// BigNumber
const Zero = BigNumber.from('0');
const One = BigNumber.from('1');
const Two = BigNumber.from('2');
const Three = BigNumber.from('3');
const Four = BigNumber.from('4');
const Five = BigNumber.from('5');

const MaxUInt256 = BigNumber.from('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
const MaxInt256 = BigNumber.from('0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
const MinInt256 = BigNumber.from('-0x8000000000000000000000000000000000000000000000000000000000000000');

// Address
const EthAddress = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
const ZeroAddress = '0x0000000000000000000000000000000000000000';

// Byte
const EmptyByte = '0x';

// Bytes4
const ZeroBytes4 = '0x00000000';

// Bytes32
const ZeroBytes32 = '0x0000000000000000000000000000000000000000000000000000000000000000';

module.exports = {
  // BigNumber
  Zero,
  One,
  Two,
  Three,
  Four,
  Five,
  MaxUInt256,
  MaxInt256,
  MinInt256,

  // Address
  ZeroAddress,
  EthAddress,

  // Byte
  EmptyByte,

  // Bytes4
  ZeroBytes4,

  // Bytes32
  ZeroBytes32,
};
