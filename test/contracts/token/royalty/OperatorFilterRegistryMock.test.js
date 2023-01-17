const {ethers} = require('hardhat');
const {constants} = ethers;
const {deployContract} = require('@animoca/ethereum-contract-helpers/src/test/deploy');
const {loadFixture} = require('@animoca/ethereum-contract-helpers/src/test/fixtures');

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
    await this.contract.isOperatorAllowed(constants.AddressZero, constants.AddressZero);
  });
  it('test register', async function () {
    await this.contract.register(constants.AddressZero);
  });
  it('test registerAndSubscribe', async function () {
    await this.contract.registerAndSubscribe(constants.AddressZero, constants.AddressZero);
  });
  it('test registerAndCopyEntries', async function () {
    await this.contract.registerAndCopyEntries(constants.AddressZero, constants.AddressZero);
  });
  it('test unregister', async function () {
    await this.contract.unregister(constants.AddressZero);
  });
  it('test updateOperator', async function () {
    await this.contract.updateOperator(constants.AddressZero, constants.AddressZero, true);
  });
  it('test updateOperators', async function () {
    await this.contract.updateOperators(constants.AddressZero, [constants.AddressZero], true);
  });
  it('test updateCodeHash', async function () {
    await this.contract.updateCodeHash(constants.AddressZero, constants.HashZero, true);
  });
  it('test updateCodeHashes', async function () {
    await this.contract.updateCodeHashes(constants.AddressZero, [constants.HashZero], true);
  });
  it('test subscribe', async function () {
    await this.contract.subscribe(constants.AddressZero, constants.AddressZero);
  });
  it('test unsubscribe', async function () {
    await this.contract.unsubscribe(constants.AddressZero, constants.AddressZero);
  });
  it('test subscriptionOf', async function () {
    await this.contract.subscriptionOf(constants.AddressZero);
  });
  it('test subscribers', async function () {
    await this.contract.subscribers(constants.AddressZero);
  });
  it('test subscriberAt', async function () {
    await this.contract.subscriberAt(constants.AddressZero, 0);
  });
  it('test copyEntriesOf', async function () {
    await this.contract.copyEntriesOf(constants.AddressZero, constants.AddressZero);
  });
  it('test isOperatorFiltered', async function () {
    await this.contract.isOperatorFiltered(constants.AddressZero, constants.AddressZero);
  });
  it('test isCodeHashOfFiltered', async function () {
    await this.contract.isCodeHashOfFiltered(constants.AddressZero, constants.AddressZero);
  });
  it('test isCodeHashFiltered', async function () {
    await this.contract.isCodeHashFiltered(constants.AddressZero, constants.HashZero);
  });
  it('test filteredOperators', async function () {
    await this.contract.filteredOperators(constants.AddressZero);
  });
  it('test filteredCodeHashes', async function () {
    await this.contract.filteredCodeHashes(constants.AddressZero);
  });
  it('test filteredOperatorAt', async function () {
    await this.contract.filteredOperatorAt(constants.AddressZero, 0);
  });
  it('test filteredCodeHashAt', async function () {
    await this.contract.filteredCodeHashAt(constants.AddressZero, 0);
  });
  it('test isRegistered', async function () {
    await this.contract.isRegistered(constants.AddressZero);
  });
  it('test codeHashOf', async function () {
    await this.contract.codeHashOf(constants.AddressZero);
  });
});
