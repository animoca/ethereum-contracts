const {BigNumber, constants} = require('ethers');

// BigNumber
const NegativeOne = constants.NegativeOne;
const Zero = constants.Zero;
const One = constants.One;
const Two = constants.Two;
const Three = BigNumber.from('3');
const Four = BigNumber.from('4');
const Five = BigNumber.from('5');

const MaxUInt256 = constants.MaxUint256;
const MaxInt256 = constants.MaxInt256;
const MinInt256 = constants.MinInt256;

// Address
const EthAddress = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
const ZeroAddress = constants.AddressZero;

// Byte
const EmptyByte = '0x';

// Bytes4
const ZeroBytes4 = '0x00000000';

// Bytes32
const ZeroBytes32 = constants.HashZero;

module.exports = {
  // BigNumber
  NegativeOne,
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
