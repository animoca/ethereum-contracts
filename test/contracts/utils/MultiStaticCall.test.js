const {ethers} = require('hardhat');
const {expect, assert} = require('chai');
const {provider} = ethers;
const {loadFixture} = require('../../helpers/fixtures');
const {deployContract} = require('../../helpers/contract');
const {tryAggregate, tryBlockAndAggregate} = require('../../helpers/multicall');

describe('MultiStaticCall', function () {
  let other;

  before(async function () {
    [_, other] = await ethers.getSigners();
  });

  const fixture = async function () {
    this.contract = await deployContract('MultiStaticCallMock');
    this.block = await provider.getBlock('latest');

    this.getEthBalance = [this.contract.address, this.contract.interface.encodeFunctionData('getEthBalance', [other.address])];
    this.getBlockNumber = [this.contract.address, this.contract.interface.encodeFunctionData('getBlockNumber', [])];
    this.getCurrentBlockCoinbase = [this.contract.address, this.contract.interface.encodeFunctionData('getCurrentBlockCoinbase', [])];
    this.getCurrentBlockDifficulty = [this.contract.address, this.contract.interface.encodeFunctionData('getCurrentBlockDifficulty', [])];
    this.getCurrentBlockGasLimit = [this.contract.address, this.contract.interface.encodeFunctionData('getCurrentBlockGasLimit', [])];
    this.getCurrentBlockTimestamp = [this.contract.address, this.contract.interface.encodeFunctionData('getCurrentBlockTimestamp', [])];
    this.revertingCall = [this.contract.address, this.contract.interface.encodeFunctionData('revertingCall', [])];
  };

  beforeEach(async function () {
    await loadFixture(fixture, this);
  });

  context('tryAggregate(bool,Call[])', function () {
    context('requireSuccess = true', function () {
      it('reverts if one of the calls fail', async function () {
        await expect(this.contract.tryAggregate(true, [this.getBlockNumber, this.revertingCall])).to.be.revertedWith('MultiStaticCall: call failed');
      });

      it('returns the data from the calls', async function () {
        const result = await tryAggregate(
          this.contract,
          true,
          [
            this.getBlockNumber,
            this.getCurrentBlockCoinbase,
            this.getCurrentBlockDifficulty,
            this.getCurrentBlockGasLimit,
            this.getCurrentBlockTimestamp,
            this.getEthBalance,
          ],
          ['uint256', 'address', 'uint256', 'uint256', 'uint256', 'uint256']
        );

        expect(result[0].success).to.be.true;
        expect(result[1].success).to.be.true;
        expect(result[2].success).to.be.true;
        expect(result[3].success).to.be.true;
        expect(result[4].success).to.be.true;
        expect(result[5].success).to.be.true;

        expect(result[0].returnData).to.equal(this.block.number); // blocknumber
        expect(result[1].returnData).to.equal(this.block.miner); // coinbase
        expect(result[2].returnData).to.equal(this.block.difficulty); // difficulty
        expect(result[3].returnData).to.equal(this.block.gasLimit); // gaslimit
        expect(result[4].returnData).to.equal(this.block.timestamp); // timestamp
        expect(result[5].returnData).to.equal(await provider.getBalance(other.address)); // balance
      });
    });

    context('requireSuccess = false', function () {
      it('returns the data from the calls, including failures', async function () {
        const result = await tryAggregate(
          this.contract,
          false,
          [
            this.getBlockNumber,
            this.getCurrentBlockCoinbase,
            this.getCurrentBlockDifficulty,
            this.getCurrentBlockGasLimit,
            this.getCurrentBlockTimestamp,
            this.getEthBalance,
            this.revertingCall,
          ],
          ['uint256', 'address', 'uint256', 'uint256', 'uint256', 'uint256', '']
        );

        expect(result[0].success).to.be.true;
        expect(result[1].success).to.be.true;
        expect(result[2].success).to.be.true;
        expect(result[3].success).to.be.true;
        expect(result[4].success).to.be.true;
        expect(result[5].success).to.be.true;
        expect(result[6].success).to.be.false;
        expect(result[0].returnData).to.equal(this.block.number); // blocknumber
        expect(result[1].returnData).to.equal(this.block.miner); // coinbase
        expect(result[2].returnData).to.equal(this.block.difficulty); // difficulty
        expect(result[3].returnData).to.equal(this.block.gasLimit); // gaslimit
        expect(result[4].returnData).to.equal(this.block.timestamp); // timestamp
        expect(result[5].returnData).to.equal(await provider.getBalance(other.address)); // balance
      });
    });
  });

  context('tryBlockAndAggregate(bool,Call[])', function () {
    context('requireSuccess = true', function () {
      it('reverts if one of the calls fail', async function () {
        await expect(this.contract.tryBlockAndAggregate(true, [this.getBlockNumber, this.revertingCall])).to.be.revertedWith(
          'MultiStaticCall: call failed'
        );
      });

      it('returns the data from the calls', async function () {
        const result = await tryBlockAndAggregate(
          this.contract,
          true,
          [
            this.getBlockNumber,
            this.getCurrentBlockCoinbase,
            this.getCurrentBlockDifficulty,
            this.getCurrentBlockGasLimit,
            this.getCurrentBlockTimestamp,
            this.getEthBalance,
          ],
          ['uint256', 'address', 'uint256', 'uint256', 'uint256', 'uint256']
        );

        expect(result.blockNumber).to.equal(this.block.number);
        expect(result.returnData[0].success).to.be.true;
        expect(result.returnData[1].success).to.be.true;
        expect(result.returnData[2].success).to.be.true;
        expect(result.returnData[3].success).to.be.true;
        expect(result.returnData[4].success).to.be.true;
        expect(result.returnData[5].success).to.be.true;
        expect(result.returnData[0].returnData).to.equal(this.block.number); // blocknumber
        expect(result.returnData[1].returnData).to.equal(this.block.miner); // coinbase
        expect(result.returnData[2].returnData).to.equal(this.block.difficulty); // difficulty
        expect(result.returnData[3].returnData).to.equal(this.block.gasLimit); // gaslimit
        expect(result.returnData[4].returnData).to.equal(this.block.timestamp); // timestamp
        expect(result.returnData[5].returnData).to.equal(await provider.getBalance(other.address)); // balance
      });
    });

    context('requireSuccess = false', function () {
      it('returns the data from the calls, including failures', async function () {
        const result = await tryBlockAndAggregate(
          this.contract,
          false,
          [
            this.getBlockNumber,
            this.getCurrentBlockCoinbase,
            this.getCurrentBlockDifficulty,
            this.getCurrentBlockGasLimit,
            this.getCurrentBlockTimestamp,
            this.getEthBalance,
            this.revertingCall,
          ],
          ['uint256', 'address', 'uint256', 'uint256', 'uint256', 'uint256', '']
        );

        expect(result.blockNumber).to.equal(this.block.number);
        expect(result.returnData[0].success).to.be.true;
        expect(result.returnData[1].success).to.be.true;
        expect(result.returnData[2].success).to.be.true;
        expect(result.returnData[3].success).to.be.true;
        expect(result.returnData[4].success).to.be.true;
        expect(result.returnData[5].success).to.be.true;
        expect(result.returnData[6].success).to.be.false;
        expect(result.returnData[0].returnData).to.equal(this.block.number); // blocknumber
        expect(result.returnData[1].returnData).to.equal(this.block.miner); // coinbase
        expect(result.returnData[2].returnData).to.equal(this.block.difficulty); // difficulty
        expect(result.returnData[3].returnData).to.equal(this.block.gasLimit); // gaslimit
        expect(result.returnData[4].returnData).to.equal(this.block.timestamp); // timestamp
        expect(result.returnData[5].returnData).to.equal(await provider.getBalance(other.address)); // balance
      });
    });
  });
});
