const { ZeroAddress } = require('../../../../src/constants');
const { shouldSupportInterfaces } = require('../../introspection/behaviors/SupportsInterface.behavior');

describe.only('ERC721ReceiverMock', function() { // TODO: Remove .only
    beforeEach(async function() {
        const ERC20Receiver = await ethers.getContractFactory('ERC721ReceiverMock');
        this.contract = await ERC20Receiver.deploy(true, ZeroAddress);
        await this.contract.deployed();
    });

    shouldSupportInterfaces(['contracts/token/ERC721/interfaces/IERC721Receiver.sol:IERC721Receiver']);
});