const {ZeroAddress} = require('../../../../src/constants');
const {deployContract} = require('../../../helpers/contract');
const {shouldSupportInterfaces} = require('../../introspection/behaviors/SupportsInterface.behavior');

describe('ERC20ReceiverMock', function () {
  beforeEach(async function () {
    this.contract = await deployContract('ERC20ReceiverMock', true, ZeroAddress);
  });

  shouldSupportInterfaces(['IERC20Receiver']);
});
