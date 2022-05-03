const { expect } = require('chai');
const { ethers } = require('hardhat');
const {loadFixture} = require('../../../helpers/fixtures');

describe.only('ERC721ReceiverMock', function () {
    let deployer;
  
    before(async function () {
      [deployer] = await ethers.getSigners();
    });

    const fixture = async function () {
      const ERC721Mock = await ethers.getContractFactory("ERC721Mock");
      this.senderContract = await ERC721Mock.deploy("SENDER-MOCK","SENDER-MOCK","https://placeholder.com");
      await this.senderContract.deployed();

      const ERC721ReceiverMock = await ethers.getContractFactory('ERC721ReceiverMock');
      const acceptIncomingToken = true;
      const receivedTokenAddress = this.senderContract.address;
      this.recipientContract = await ERC721ReceiverMock.deploy(acceptIncomingToken, receivedTokenAddress);
      await this.recipientContract.deployed();
    };

    beforeEach(async function () {
      await loadFixture(fixture, this);
    });

    context('with a standard ERC721 as sender and IERC721Receivable implementer as receiver', function () {  
        it("Should not revert when doing transfer to contract", async function() {
            let supportsInterface = await this.recipientContract.supportsInterface('0x01ffc9a7');
            expect(supportsInterface).to.equal(true);
            // mint
            await this.senderContract.mint(deployer.address, 1);
            // transfer
            await this.senderContract.transferFrom(deployer.address, this.recipientContract.address, 1);
        });
    });

    

});