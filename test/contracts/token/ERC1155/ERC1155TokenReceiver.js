const {ZeroAddress} = require('../../../../src/constants');
const {deployContract} = require('../../../helpers/contract');
const {supportsInterfaces} = require('../../introspection/behaviors/SupportsInterface.behavior');

describe('ERC1155TokenReceiverMock', function () {
  beforeEach(async function () {
    this.contract = await deployContract('ERC1155TokenReceiverMock', true, ZeroAddress);
  });

  supportsInterfaces(['IERC165', 'IERC1155TokenReceiver']);
});
