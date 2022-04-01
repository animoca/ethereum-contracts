const {ZeroAddress} = require('../../../../src/constants');
const {shouldSupportInterfaces} = require('../../introspection/behaviors/SupportsInterface.behavior');

describe('ERC20ReceiverMock', function () {
  beforeEach(async function () {
    const ERC20Receiver = await ethers.getContractFactory('ERC20ReceiverMock');
    this.contract = await ERC20Receiver.deploy(true, ZeroAddress);
    await this.contract.deployed();
  });

  shouldSupportInterfaces(['IERC20Receiver']);
});
