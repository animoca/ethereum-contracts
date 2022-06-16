const {ZeroAddress} = require('../../../../src/constants');
const {deployContract} = require('../../../helpers/contract');
const {supportsInterfaces} = require('../../introspection/behaviors/SupportsInterface.behavior');

describe('ERC20ReceiverMock', function () {
  beforeEach(async function () {
    this.contract = await deployContract('ERC20ReceiverMock', true, ZeroAddress);
  });

  supportsInterfaces(['IERC20Receiver']);
});
