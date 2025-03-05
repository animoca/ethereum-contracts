const {ethers} = require('hardhat');
const {expect} = require('chai');
const {deployContract} = require('@animoca/ethereum-contract-helpers/src/test/deploy');
const {loadFixture} = require('@animoca/ethereum-contract-helpers/src/test/fixtures');

function decodeAggregateReturnData(returnData, returnTypes) {
  return returnData.map((res, i) => {
    return {
      success: res[0],
      returnData: res[0] ? ethers.AbiCoder.defaultAbiCoder().decode([returnTypes[i]], res[1])[0] : null,
    };
  });
}

describe('MultiStaticCall', function () {
  let other;

  before(async function () {
    [_, other] = await ethers.getSigners();
  });

  const fixture = async function () {
    this.contract = await deployContract('MultiStaticCallMock');
    this.block = await ethers.provider.getBlock('latest');

    const contractAddress = await this.contract.getAddress();

    this.getEthBalance = [contractAddress, this.contract.interface.encodeFunctionData('getEthBalance', [other.address])];
    this.getBlockNumber = [contractAddress, this.contract.interface.encodeFunctionData('getBlockNumber')];
    this.getCurrentBlockCoinbase = [contractAddress, this.contract.interface.encodeFunctionData('getCurrentBlockCoinbase')];
    this.getCurrentBlockGasLimit = [contractAddress, this.contract.interface.encodeFunctionData('getCurrentBlockGasLimit')];
    this.getCurrentBlockTimestamp = [contractAddress, this.contract.interface.encodeFunctionData('getCurrentBlockTimestamp')];
    this.revertingCall = [contractAddress, this.contract.interface.encodeFunctionData('revertingCall')];
    this.revertingCallWithoutMessage = [contractAddress, this.contract.interface.encodeFunctionData('revertingCallWithoutMessage')];
  };

  beforeEach(async function () {
    await loadFixture(fixture, this);
  });

  context('tryAggregate(bool,Call[])', function () {
    context('requireSuccess = true', function () {
      it('reverts if one of the calls reverts with a message', async function () {
        await expect(this.contract.tryAggregate(true, [this.getBlockNumber, this.revertingCall])).to.be.revertedWithCustomError(
          this.contract,
          'Reverted',
        );
      });

      it('reverts if one of the calls reverts without a message', async function () {
        await expect(this.contract.tryAggregate(true, [this.getBlockNumber, this.revertingCallWithoutMessage]))
          .to.be.revertedWithCustomError(this.contract, 'StaticCallReverted')
          .withArgs(this.revertingCallWithoutMessage[0], this.revertingCallWithoutMessage[1]);
      });

      it('returns the data from the calls', async function () {
        const result = decodeAggregateReturnData(
          (
            await this.contract.tryAggregate.staticCallResult(true, [
              this.getBlockNumber,
              this.getCurrentBlockCoinbase,
              this.getCurrentBlockGasLimit,
              this.getCurrentBlockTimestamp,
              this.getEthBalance,
            ])
          ).returnData,
          ['uint256', 'address', 'uint256', 'uint256', 'uint256', 'uint256'],
        );

        expect(result[0].success).to.be.true;
        expect(result[1].success).to.be.true;
        expect(result[2].success).to.be.true;
        expect(result[3].success).to.be.true;
        expect(result[4].success).to.be.true;

        expect(result[0].returnData).to.equal(this.block.number); // blocknumber
        expect(result[1].returnData).to.equal(this.block.miner); // coinbase
        expect(result[2].returnData).to.equal(this.block.gasLimit); // gaslimit
        expect(result[3].returnData).to.equal(this.block.timestamp); // timestamp
        expect(result[4].returnData).to.equal(await ethers.provider.getBalance(other.address)); // balance
      });
    });

    context('requireSuccess = false', function () {
      it('returns the data from the calls, including failures', async function () {
        const result = decodeAggregateReturnData(
          (
            await this.contract.tryAggregate.staticCallResult(false, [
              this.getBlockNumber,
              this.getCurrentBlockCoinbase,
              this.getCurrentBlockGasLimit,
              this.getCurrentBlockTimestamp,
              this.getEthBalance,
              this.revertingCall,
              this.revertingCallWithoutMessage,
            ])
          ).returnData,
          ['uint256', 'address', 'uint256', 'uint256', 'uint256', '', ''],
        );

        expect(result[0].success).to.be.true;
        expect(result[1].success).to.be.true;
        expect(result[2].success).to.be.true;
        expect(result[3].success).to.be.true;
        expect(result[4].success).to.be.true;
        expect(result[5].success).to.be.false;
        expect(result[6].success).to.be.false;
        expect(result[0].returnData).to.equal(this.block.number); // blocknumber
        expect(result[1].returnData).to.equal(this.block.miner); // coinbase
        expect(result[2].returnData).to.equal(this.block.gasLimit); // gaslimit
        expect(result[3].returnData).to.equal(this.block.timestamp); // timestamp
        expect(result[4].returnData).to.equal(await ethers.provider.getBalance(other.address)); // balance
      });
    });
  });

  context('tryBlockAndAggregate(bool,Call[])', function () {
    context('requireSuccess = true', function () {
      it('reverts if one of the calls reverts with a message', async function () {
        await expect(this.contract.tryBlockAndAggregate(true, [this.getBlockNumber, this.revertingCall])).to.be.revertedWithCustomError(
          this.contract,
          'Reverted',
        );
      });

      it('reverts if one of the calls reverts without a message', async function () {
        await expect(this.contract.tryBlockAndAggregate(true, [this.getBlockNumber, this.revertingCallWithoutMessage]))
          .to.be.revertedWithCustomError(this.contract, 'StaticCallReverted')
          .withArgs(this.revertingCallWithoutMessage[0], this.revertingCallWithoutMessage[1]);
      });

      it('returns the data from the calls', async function () {
        const aggregated = await this.contract.tryBlockAndAggregate.staticCallResult(true, [
          this.getBlockNumber,
          this.getCurrentBlockCoinbase,
          this.getCurrentBlockGasLimit,
          this.getCurrentBlockTimestamp,
          this.getEthBalance,
        ]);
        const result = {
          blockNumber: aggregated.blockNumber,
          returnData: decodeAggregateReturnData(aggregated.returnData, ['uint256', 'address', 'uint256', 'uint256', 'uint256', 'uint256']),
        };

        expect(result.blockNumber).to.equal(this.block.number);
        expect(result.returnData[0].success).to.be.true;
        expect(result.returnData[1].success).to.be.true;
        expect(result.returnData[2].success).to.be.true;
        expect(result.returnData[3].success).to.be.true;
        expect(result.returnData[4].success).to.be.true;
        expect(result.returnData[0].returnData).to.equal(this.block.number); // blocknumber
        expect(result.returnData[1].returnData).to.equal(this.block.miner); // coinbase
        expect(result.returnData[2].returnData).to.equal(this.block.gasLimit); // gaslimit
        expect(result.returnData[3].returnData).to.equal(this.block.timestamp); // timestamp
        expect(result.returnData[4].returnData).to.equal(await ethers.provider.getBalance(other.address)); // balance
      });
    });

    context('requireSuccess = false', function () {
      it('returns the data from the calls, including failures', async function () {
        const aggregated = await this.contract.tryBlockAndAggregate.staticCallResult(false, [
          this.getBlockNumber,
          this.getCurrentBlockCoinbase,
          this.getCurrentBlockGasLimit,
          this.getCurrentBlockTimestamp,
          this.getEthBalance,
          this.revertingCall,
          this.revertingCallWithoutMessage,
        ]);
        const result = {
          blockNumber: aggregated.blockNumber,
          returnData: decodeAggregateReturnData(aggregated.returnData, ['uint256', 'address', 'uint256', 'uint256', 'uint256', '', '']),
        };

        expect(result.blockNumber).to.equal(this.block.number);
        expect(result.returnData[0].success).to.be.true;
        expect(result.returnData[1].success).to.be.true;
        expect(result.returnData[2].success).to.be.true;
        expect(result.returnData[3].success).to.be.true;
        expect(result.returnData[4].success).to.be.true;
        expect(result.returnData[5].success).to.be.false;
        expect(result.returnData[6].success).to.be.false;
        expect(result.returnData[0].returnData).to.equal(this.block.number); // blocknumber
        expect(result.returnData[1].returnData).to.equal(this.block.miner); // coinbase
        expect(result.returnData[2].returnData).to.equal(this.block.gasLimit); // gaslimit
        expect(result.returnData[3].returnData).to.equal(this.block.timestamp); // timestamp
        expect(result.returnData[4].returnData).to.equal(await ethers.provider.getBalance(other.address)); // balance
      });
    });
  });
});
