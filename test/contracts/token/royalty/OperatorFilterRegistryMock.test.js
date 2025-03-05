const {ethers} = require('hardhat');
const {deployContract} = require('@animoca/ethereum-contract-helpers/src/test/deploy');
const {loadFixture} = require('@animoca/ethereum-contract-helpers/src/test/fixtures');

describe('OperatorFilterRegistryMock', function () {
  const fixture = async function () {
    this.contract = await deployContract('OperatorFilterRegistryMock', true);
  };

  beforeEach(async function () {
    await loadFixture(fixture, this);
  });

  it('test isOperatorAllowed', async function () {
    await this.contract.isOperatorAllowed(ethers.ZeroAddress, ethers.ZeroAddress);
  });

  it('test register', async function () {
    await this.contract.register(ethers.ZeroAddress);
  });

  it('test registerAndSubscribe', async function () {
    await this.contract.registerAndSubscribe(ethers.ZeroAddress, ethers.ZeroAddress);
  });

  it('test registerAndCopyEntries', async function () {
    await this.contract.registerAndCopyEntries(ethers.ZeroAddress, ethers.ZeroAddress);
  });

  it('test unregister', async function () {
    await this.contract.unregister(ethers.ZeroAddress);
  });

  it('test updateOperator', async function () {
    await this.contract.updateOperator(ethers.ZeroAddress, ethers.ZeroAddress, true);
  });

  it('test updateOperators', async function () {
    await this.contract.updateOperators(ethers.ZeroAddress, [ethers.ZeroAddress], true);
  });

  it('test updateCodeHash', async function () {
    await this.contract.updateCodeHash(ethers.ZeroAddress, ethers.ZeroHash, true);
  });

  it('test updateCodeHashes', async function () {
    await this.contract.updateCodeHashes(ethers.ZeroAddress, [ethers.ZeroHash], true);
  });

  it('test subscribe', async function () {
    await this.contract.subscribe(ethers.ZeroAddress, ethers.ZeroAddress);
  });

  it('test unsubscribe', async function () {
    await this.contract.unsubscribe(ethers.ZeroAddress, ethers.ZeroAddress);
  });

  it('test subscriptionOf', async function () {
    await this.contract.subscriptionOf(ethers.ZeroAddress);
  });

  it('test subscribers', async function () {
    await this.contract.subscribers(ethers.ZeroAddress);
  });

  it('test subscriberAt', async function () {
    await this.contract.subscriberAt(ethers.ZeroAddress, 0);
  });

  it('test copyEntriesOf', async function () {
    await this.contract.copyEntriesOf(ethers.ZeroAddress, ethers.ZeroAddress);
  });

  it('test isOperatorFiltered', async function () {
    await this.contract.isOperatorFiltered(ethers.ZeroAddress, ethers.ZeroAddress);
  });

  it('test isCodeHashOfFiltered', async function () {
    await this.contract.isCodeHashOfFiltered(ethers.ZeroAddress, ethers.ZeroAddress);
  });

  it('test isCodeHashFiltered', async function () {
    await this.contract.isCodeHashFiltered(ethers.ZeroAddress, ethers.ZeroHash);
  });

  it('test filteredOperators', async function () {
    await this.contract.filteredOperators(ethers.ZeroAddress);
  });

  it('test filteredCodeHashes', async function () {
    await this.contract.filteredCodeHashes(ethers.ZeroAddress);
  });

  it('test filteredOperatorAt', async function () {
    await this.contract.filteredOperatorAt(ethers.ZeroAddress, 0);
  });

  it('test filteredCodeHashAt', async function () {
    await this.contract.filteredCodeHashAt(ethers.ZeroAddress, 0);
  });

  it('test isRegistered', async function () {
    await this.contract.isRegistered(ethers.ZeroAddress);
  });

  it('test codeHashOf', async function () {
    await this.contract.codeHashOf(ethers.ZeroAddress);
  });
});
