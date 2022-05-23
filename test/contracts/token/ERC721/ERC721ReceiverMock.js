const {ZeroAddress} = require('../../../../src/constants');
const {shouldSupportInterfaces} = require('../../introspection/behaviors/SupportsInterface.behavior');

describe('ERC721ReceiverMock', function () {
  beforeEach(async function () {
    const ERC20Receiver = await ethers.getContractFactory('ERC721ReceiverMock');
    this.contract = await ERC20Receiver.deploy(true, ZeroAddress);
    await this.contract.deployed();
  });

  shouldSupportInterfaces(['contracts/token/ERC721/interfaces/IERC721Receiver.sol:IERC721Receiver']);
});
