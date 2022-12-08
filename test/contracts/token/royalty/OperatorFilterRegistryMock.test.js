const {ethers} = require('hardhat');
const {ZeroAddress, ZeroBytes32} = require('../../../../src/constants');
const {loadFixture} = require('../../../helpers/fixtures');
const {deployContract} = require('../../../helpers/contract');

describe('OperatorFilterRegistryMock', function () {
  let deployer, other;

  before(async function () {
    [deployer, other] = await ethers.getSigners();
  });

  const fixture = async function () {
    this.contract = await deployContract('OperatorFilterRegistryMock', true);
  };

  beforeEach(async function () {
    await loadFixture(fixture, this);
  });

  it('test isOperatorAllowed', async function () {
    await this.contract.isOperatorAllowed(ZeroAddress, ZeroAddress);
  });
  it('test register', async function () {
    await this.contract.register(ZeroAddress);
  });
  it('test registerAndSubscribe', async function () {
    await this.contract.registerAndSubscribe(ZeroAddress, ZeroAddress);
  });
  it('test registerAndCopyEntries', async function () {
    await this.contract.registerAndCopyEntries(ZeroAddress, ZeroAddress);
  });
  it('test unregister', async function () {
    await this.contract.unregister(ZeroAddress);
  });
  it('test updateOperator', async function () {
    await this.contract.updateOperator(ZeroAddress, ZeroAddress, true);
  });
  it('test updateOperators', async function () {
    await this.contract.updateOperators(ZeroAddress, [ZeroAddress], true);
  });
  it('test updateCodeHash', async function () {
    await this.contract.updateCodeHash(ZeroAddress, ZeroBytes32, true);
  });
  it('test updateCodeHashes', async function () {
    await this.contract.updateCodeHashes(ZeroAddress, [ZeroBytes32], true);
  });
  it('test subscribe', async function () {
    await this.contract.subscribe(ZeroAddress, ZeroAddress);
  });
  it('test unsubscribe', async function () {
    await this.contract.unsubscribe(ZeroAddress, ZeroAddress);
  });
  it('test subscriptionOf', async function () {
    await this.contract.subscriptionOf(ZeroAddress);
  });
  it('test subscribers', async function () {
    await this.contract.subscribers(ZeroAddress);
  });
  it('test subscriberAt', async function () {
    await this.contract.subscriberAt(ZeroAddress, 0);
  });
  it('test copyEntriesOf', async function () {
    await this.contract.copyEntriesOf(ZeroAddress, ZeroAddress);
  });
  it('test isOperatorFiltered', async function () {
    await this.contract.isOperatorFiltered(ZeroAddress, ZeroAddress);
  });
  it('test isCodeHashOfFiltered', async function () {
    await this.contract.isCodeHashOfFiltered(ZeroAddress, ZeroAddress);
  });
  it('test isCodeHashFiltered', async function () {
    await this.contract.isCodeHashFiltered(ZeroAddress, ZeroBytes32);
  });
  it('test filteredOperators', async function () {
    await this.contract.filteredOperators(ZeroAddress);
  });
  it('test filteredCodeHashes', async function () {
    await this.contract.filteredCodeHashes(ZeroAddress);
  });
  it('test filteredOperatorAt', async function () {
    await this.contract.filteredOperatorAt(ZeroAddress, 0);
  });
  it('test filteredCodeHashAt', async function () {
    await this.contract.filteredCodeHashAt(ZeroAddress, 0);
  });
  it('test isRegistered', async function () {
    await this.contract.isRegistered(ZeroAddress);
  });
  it('test codeHashOf', async function () {
    await this.contract.codeHashOf(ZeroAddress);
  });
});
