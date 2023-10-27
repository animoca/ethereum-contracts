const {ethers} = require('hardhat');
const {deployContract} = require('@animoca/ethereum-contract-helpers/src/test/deploy');
const {supportsInterfaces} = require('../../introspection/behaviors/SupportsInterface.behavior');

describe('ERC20ReceiverMock', function () {
  beforeEach(async function () {
    this.contract = await deployContract('ERC20ReceiverMock', true, ethers.ZeroAddress);
  });

  supportsInterfaces(['IERC165', 'IERC20Receiver']);
});
