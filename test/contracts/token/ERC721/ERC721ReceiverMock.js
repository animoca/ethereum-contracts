const {ZeroAddress} = require('../../../../src/constants');
const {deployContract} = require('../../../helpers/contract');
const {shouldSupportInterfaces} = require('../../introspection/behaviors/SupportsInterface.behavior');

describe('ERC721ReceiverMock', function () {
  beforeEach(async function () {
    this.contract = await deployContract('ERC721ReceiverMock', true, ZeroAddress);
  });

  shouldSupportInterfaces(['contracts/token/ERC721/interfaces/IERC721Receiver.sol:IERC721Receiver']);
});
