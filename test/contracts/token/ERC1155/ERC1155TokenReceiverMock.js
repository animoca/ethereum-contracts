const {ZeroAddress} = require('../../../../src/constants');
const {deployContract} = require('../../../helpers/contract');
const {supportsInterfaces} = require('../../introspection/behaviors/SupportsInterface.behavior');

describe('ERC1155TokenReceiverMock', function () {
  beforeEach(async function () {
    this.contract = await deployContract('ERC1155TokenReceiverMock', true, ZeroAddress);
  });

  supportsInterfaces([
    'contracts/introspection/interfaces/IERC165.sol:IERC165',
    'contracts/token/ERC1155/interfaces/IERC1155TokenReceiver.sol:IERC1155TokenReceiver',
  ]);
});
