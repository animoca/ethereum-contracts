const {ethers} = require('hardhat');

function decodeAggregateReturnData(returnData, returnTypes) {
  return returnData.map((res, i) => {
    return {
      success: res.success,
      returnData: ethers.utils.defaultAbiCoder.decode([returnTypes[i]], res.returnData)[0],
    };
  });
}

async function tryAggregate(contract, requireSuccess, calls, returnTypes) {
  assert(calls.length == returnTypes.length);
  const returnData = await contract.callStatic.tryAggregate(requireSuccess, calls);

  return decodeAggregateReturnData(returnData, returnTypes);
}

async function tryBlockAndAggregate(contract, requireSuccess, calls, returnTypes) {
  assert(calls.length == returnTypes.length);
  const result = await contract.callStatic.tryBlockAndAggregate(requireSuccess, calls);
  return {
    blockNumber: result.blockNumber,
    returnData: decodeAggregateReturnData(result.returnData, returnTypes),
  };
}

module.exports = {
  decodeAggregateReturnData,
  tryAggregate,
  tryBlockAndAggregate,
};
