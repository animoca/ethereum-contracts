const {ethers} = require('hardhat');
const {deployContract} = require('@animoca/ethereum-contract-helpers/src/test/deploy');
const {supportsInterfaces} = require('../../introspection/behaviors/SupportsInterface.behavior');

describe('ERC1155TokenReceiverMock', function () {
  beforeEach(async function () {
    this.contract = await deployContract('ERC1155TokenReceiverMock', true, ethers.ZeroAddress);
  });

  supportsInterfaces(['IERC165', 'IERC1155TokenReceiver']);
});
