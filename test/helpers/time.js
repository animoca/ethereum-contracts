// This file was ported to hardhat/ethers from @openzeppelin/test-helpers
// see https://github.com/OpenZeppelin/openzeppelin-test-helpers/blob/421241828c1ab456878566f8a743d8486f17c6a5/src/time.js

// Advances the block to the target block number
async function advanceBlockTo(target) {
  if (!ethers.BigNumber.isBigNumber(target)) {
    target = ethers.BigNumber.from(target);
  }

  const currentBlock = await latestBlock();
  if (target.lt(currentBlock)) throw Error(`Target block #(${target}) is lower than current block #(${currentBlock})`);

  while ((await latestBlock()).lt(target)) {
    await network.provider.send('evm_mine', []);
  }
}

// Returns the time of the last mined block timestamp
async function latest() {
  const block = await ethers.provider.getBlock('latest');
  return ethers.BigNumber.from(block.timestamp);
}

async function latestBlock() {
  const block = await ethers.provider.getBlock('latest');
  return ethers.BigNumber.from(block.number);
}

// Increases the timestamp by a duration in seconds
async function increase(duration) {
  if (!ethers.BigNumber.isBigNumber(duration)) {
    duration = ethers.BigNumber.from(duration);
  }

  if (duration.isNegative()) throw Error(`Cannot increase time by a negative amount (${duration})`);

  await network.provider.send('evm_increaseTime', [duration.toNumber()]);
  await network.provider.send('evm_mine', []);
}

// Increases the timestamp to a target. Might not be accurate
async function increaseTo(target) {
  if (!ethers.BigNumber.isBigNumber(target)) {
    target = ethers.BigNumber.from(target);
  }

  const now = await latest();

  if (target.lt(now)) throw Error(`Cannot increase current time (${now}) to a moment in the past (${target})`);
  const diff = target.sub(now);
  return increase(diff);
}

const duration = {
  seconds: function (val) {
    return ethers.BigNumber.from(val);
  },
  minutes: function (val) {
    return ethers.BigNumber.from(val).mul(this.seconds('60'));
  },
  hours: function (val) {
    return ethers.BigNumber.from(val).mul(this.minutes('60'));
  },
  days: function (val) {
    return ethers.BigNumber.from(val).mul(this.hours('24'));
  },
  weeks: function (val) {
    return ethers.BigNumber.from(val).mul(this.days('7'));
  },
  years: function (val) {
    return ethers.BigNumber.from(val).mul(this.days('365'));
  },
};

module.exports = {
  advanceBlockTo,
  latest,
  latestBlock,
  increase,
  increaseTo,
  duration,
};
