const {ethers} = require('hardhat');
const {BigNumber} = ethers;

const NFT_FLAG = BigNumber.from('0x8000000000000000000000000000000000000000000000000000000000000000');

function nonFungibleTokenId(baseId) {
  return NFT_FLAG.or(BigNumber.from(baseId));
}

function isFungible(id) {
  return NFT_FLAG.and(id).eq(0);
}

module.exports = {
  nonFungibleTokenId,
  isFungible,
};
