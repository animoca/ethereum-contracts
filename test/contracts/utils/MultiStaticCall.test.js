const {ethers} = require('hardhat');
const {expect} = require('chai');
const {BigNumber, provider} = ethers;
const {loadFixture} = require('../../helpers/fixtures');
const {latestBlock} = require('../../helpers/time');
const {deployContract} = require('../../helpers/contract');

describe('MultiStaticCall', function () {
  let other;

  before(async function () {
    [_, other] = await ethers.getSigners();
  });

  const fixture = async function () {
    this.contract = await deployContract('MultiStaticCallMock');
    this.revertingCall = [this.contract.address, this.contract.interface.encodeFunctionData('revertingCall', [])];
    this.getBlockHash = [this.contract.address, this.contract.interface.encodeFunctionData('getBlockHash', [await latestBlock()])];
    this.getBlockNumber = [this.contract.address, this.contract.interface.encodeFunctionData('getBlockNumber', [])];
    this.getCurrentBlockCoinbase = [this.contract.address, this.contract.interface.encodeFunctionData('getCurrentBlockCoinbase', [])];
    this.getCurrentBlockDifficulty = [this.contract.address, this.contract.interface.encodeFunctionData('getCurrentBlockDifficulty', [])];
    this.getCurrentBlockGasLimit = [this.contract.address, this.contract.interface.encodeFunctionData('getCurrentBlockGasLimit', [])];
    this.getCurrentBlockTimestamp = [this.contract.address, this.contract.interface.encodeFunctionData('getCurrentBlockTimestamp', [])];
    this.getEthBalance = [this.contract.address, this.contract.interface.encodeFunctionData('getEthBalance', [other.address])];
    this.getLastBlockHash = [this.contract.address, this.contract.interface.encodeFunctionData('getLastBlockHash', [])];
  };
  beforeEach(async function () {
    await loadFixture(fixture, this);
  });

  context('tryAggregate(bool,Call[])', function () {
    context('requireSuccess = true', function () {
      it('reverts if one of the calls fail', async function () {
        await expect(this.contract.tryAggregate(true, [this.getBlockHash, this.revertingCall])).to.be.revertedWith('MultiStaticCall: call failed');
      });

      it('returns the data from the calls', async function () {
        const result = await this.contract.callStatic.tryAggregate(true, [
          this.getBlockHash,
          this.getBlockNumber,
          this.getCurrentBlockCoinbase,
          this.getCurrentBlockDifficulty,
          this.getCurrentBlockGasLimit,
          this.getCurrentBlockTimestamp,
          this.getEthBalance,
          this.getLastBlockHash,
        ]);
        const block = await provider.getBlock('latest');
        expect(result[0].success).to.be.true;
        expect(result[0].returnData).to.equal('0x0000000000000000000000000000000000000000000000000000000000000000'); // blockhash
        expect(result[1].success).to.be.true;
        expect(BigNumber.from(result[1].returnData)).to.equal(block.number); // blocknumber
        expect(result[2].success).to.be.true;
        expect(BigNumber.from(result[2].returnData)).to.equal(BigNumber.from(block.miner)); // coinbase
        expect(result[3].success).to.be.true;
        expect(BigNumber.from(result[3].returnData)).to.equal(block.difficulty); // difficulty
        expect(result[4].success).to.be.true;
        expect(BigNumber.from(result[4].returnData)).to.equal(block.gasLimit); // gaslimit
        expect(result[5].success).to.be.true;
        expect(BigNumber.from(result[5].returnData)).to.equal(block.timestamp); // timestamp
        expect(result[6].success).to.be.true;
        expect(BigNumber.from(result[6].returnData)).to.equal(await provider.getBalance(other.address)); // balance
        expect(result[7].success).to.be.true;
        expect(result[7].returnData).to.equal((await provider.getBlock(block.number - 1)).hash); // lastblockhash
      });
    });

    context('requireSuccess = false', function () {
      it('returns the data from the calls, including failures', async function () {
        const result = await this.contract.callStatic.tryAggregate(false, [
          this.getBlockHash,
          this.getBlockNumber,
          this.getCurrentBlockCoinbase,
          this.getCurrentBlockDifficulty,
          this.getCurrentBlockGasLimit,
          this.getCurrentBlockTimestamp,
          this.getEthBalance,
          this.getLastBlockHash,
          this.revertingCall,
        ]);
        const block = await provider.getBlock('latest');
        expect(result[0].success).to.be.true;
        expect(result[0].returnData).to.equal('0x0000000000000000000000000000000000000000000000000000000000000000'); // blockhash
        expect(result[1].success).to.be.true;
        expect(BigNumber.from(result[1].returnData)).to.equal(block.number); // blocknumber
        expect(result[2].success).to.be.true;
        expect(BigNumber.from(result[2].returnData)).to.equal(BigNumber.from(block.miner)); // coinbase
        expect(result[3].success).to.be.true;
        expect(BigNumber.from(result[3].returnData)).to.equal(block.difficulty); // difficulty
        expect(result[4].success).to.be.true;
        expect(BigNumber.from(result[4].returnData)).to.equal(block.gasLimit); // gaslimit
        expect(result[5].success).to.be.true;
        expect(BigNumber.from(result[5].returnData)).to.equal(block.timestamp); // timestamp
        expect(result[6].success).to.be.true;
        expect(BigNumber.from(result[6].returnData)).to.equal(await provider.getBalance(other.address)); // balance
        expect(result[7].success).to.be.true;
        expect(result[7].returnData).to.equal((await provider.getBlock(block.number - 1)).hash); // lastblockhash
        expect(result[8].success).to.be.false;
      });
    });
  });

  context('tryBlockAndAggregate(bool,Call[])', function () {
    context('requireSuccess = true', function () {
      it('reverts if one of the calls fail', async function () {
        await expect(this.contract.tryBlockAndAggregate(true, [this.getBlockHash, this.revertingCall])).to.be.revertedWith(
          'MultiStaticCall: call failed'
        );
      });

      it('returns the data from the calls', async function () {
        const result = await this.contract.callStatic.tryBlockAndAggregate(true, [
          this.getBlockHash,
          this.getBlockNumber,
          this.getCurrentBlockCoinbase,
          this.getCurrentBlockDifficulty,
          this.getCurrentBlockGasLimit,
          this.getCurrentBlockTimestamp,
          this.getEthBalance,
          this.getLastBlockHash,
        ]);
        const block = await provider.getBlock('latest');
        expect(result.blockNumber).to.equal(block.number);
        expect(result.blockHash).to.equal('0x0000000000000000000000000000000000000000000000000000000000000000');
        expect(result.returnData[0].success).to.be.true;
        expect(result.returnData[0].returnData).to.equal('0x0000000000000000000000000000000000000000000000000000000000000000'); // blockhash
        expect(result.returnData[1].success).to.be.true;
        expect(BigNumber.from(result.returnData[1].returnData)).to.equal(block.number); // blocknumber
        expect(result.returnData[2].success).to.be.true;
        expect(BigNumber.from(result.returnData[2].returnData)).to.equal(BigNumber.from(block.miner)); // coinbase
        expect(result.returnData[3].success).to.be.true;
        expect(BigNumber.from(result.returnData[3].returnData)).to.equal(block.difficulty); // difficulty
        expect(result.returnData[4].success).to.be.true;
        expect(BigNumber.from(result.returnData[4].returnData)).to.equal(block.gasLimit); // gaslimit
        expect(result.returnData[5].success).to.be.true;
        expect(BigNumber.from(result.returnData[5].returnData)).to.equal(block.timestamp); // timestamp
        expect(result.returnData[6].success).to.be.true;
        expect(BigNumber.from(result.returnData[6].returnData)).to.equal(await provider.getBalance(other.address)); // balance
        expect(result.returnData[7].success).to.be.true;
        expect(result.returnData[7].returnData).to.equal((await provider.getBlock(block.number - 1)).hash); // lastblockhash
      });
    });

    context('requireSuccess = false', function () {
      it('returns the data from the calls, including failures', async function () {
        const result = await this.contract.callStatic.tryBlockAndAggregate(false, [
          this.getBlockHash,
          this.getBlockNumber,
          this.getCurrentBlockCoinbase,
          this.getCurrentBlockDifficulty,
          this.getCurrentBlockGasLimit,
          this.getCurrentBlockTimestamp,
          this.getEthBalance,
          this.getLastBlockHash,
          this.revertingCall,
        ]);
        const block = await provider.getBlock('latest');
        expect(result.blockNumber).to.equal(block.number);
        expect(result.blockHash).to.equal('0x0000000000000000000000000000000000000000000000000000000000000000');
        expect(result.returnData[0].success).to.be.true;
        expect(result.returnData[0].returnData).to.equal('0x0000000000000000000000000000000000000000000000000000000000000000'); // blockhash
        expect(result.returnData[1].success).to.be.true;
        expect(BigNumber.from(result.returnData[1].returnData)).to.equal(block.number); // blocknumber
        expect(result.returnData[2].success).to.be.true;
        expect(BigNumber.from(result.returnData[2].returnData)).to.equal(BigNumber.from(block.miner)); // coinbase
        expect(result.returnData[3].success).to.be.true;
        expect(BigNumber.from(result.returnData[3].returnData)).to.equal(block.difficulty); // difficulty
        expect(result.returnData[4].success).to.be.true;
        expect(BigNumber.from(result.returnData[4].returnData)).to.equal(block.gasLimit); // gaslimit
        expect(result.returnData[5].success).to.be.true;
        expect(BigNumber.from(result.returnData[5].returnData)).to.equal(block.timestamp); // timestamp
        expect(result.returnData[6].success).to.be.true;
        expect(BigNumber.from(result.returnData[6].returnData)).to.equal(await provider.getBalance(other.address)); // balance
        expect(result.returnData[7].success).to.be.true;
        expect(result.returnData[7].returnData).to.equal((await provider.getBlock(block.number - 1)).hash); // lastblockhash
        expect(result.returnData[8].success).to.be.false;
      });
    });
  });
});
