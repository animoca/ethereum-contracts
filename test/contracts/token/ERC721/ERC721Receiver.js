const {ethers} = require('hardhat');
const {constants} = ethers;
const {deployContract} = require('@animoca/ethereum-contract-helpers/src/test/deploy');
const {supportsInterfaces} = require('../../introspection/behaviors/SupportsInterface.behavior');

describe('ERC721ReceiverMock', function () {
  beforeEach(async function () {
    this.contract = await deployContract('ERC721ReceiverMock', true, constants.AddressZero);
  });

  supportsInterfaces(['IERC165', 'IERC721Receiver']);
});
