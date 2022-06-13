const {ZeroAddress} = require('../../../../src/constants');
const {deployContract} = require('../../../helpers/contract');
const {supporstInterfaces} = require('../../introspection/behaviors/SupportsInterface.behavior');

describe('ERC20ReceiverMock', function () {
  beforeEach(async function () {
    this.contract = await deployContract('ERC20ReceiverMock', true, ZeroAddress);
  });

  supporstInterfaces(['IERC20Receiver']);
});
