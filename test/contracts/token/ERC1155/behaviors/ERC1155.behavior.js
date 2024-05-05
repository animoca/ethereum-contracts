const {ethers} = require('hardhat');
const {behavesLikeERC1155Standard} = require('./ERC1155.standard.behavior');
const {behavesLikeERC1155WithOperatorFilterer} = require('./ERC1155.operatorfilterer.behavior');
const {behavesLikeERC1155Mintable} = require('./ERC1155.mintable.behavior');
const {behavesLikeERC1155Deliverable} = require('./ERC1155.deliverable.behavior');
const {behavesLikeERC1155Burnable} = require('./ERC1155.burnable.behavior');
const {behavesLikeERC1155MetadataURI} = require('./ERC1155.metadatauri.behavior');
const {behavesLikeERC2981} = require('./../../royalty/behaviors/ERC2981.behavior');

function behavesLikeERC1155(implementation) {
  const features = implementation.features;
  const interfaces = implementation.interfaces;

  if (features && features.WithOperatorFilterer) {
    console.log('WithOperatorFilterer');
    process.exit(1);
    context('with an allowing Operator Filter Registry', function () {
      behavesLikeERC1155Standard(implementation);
    });
    context('with a zero-address Operator Filter Registry', function () {
      behavesLikeERC1155Standard(implementation, ethers.ZeroAddress);
    });
    context('with a non-contract Operator Filter Registry', function () {
      behavesLikeERC1155Standard(implementation, '0x0000000000000000000000000000000000000001');
    });
    behavesLikeERC1155WithOperatorFilterer(implementation);
  } else {
    behavesLikeERC1155Standard(implementation);
  }

  behavesLikeERC1155Mintable(implementation);
  behavesLikeERC1155Burnable(implementation);

  if (interfaces && interfaces.ERC1155Deliverable) {
    behavesLikeERC1155Deliverable(implementation);
  }

  if (interfaces && interfaces.ERC1155MetadataURI) {
    behavesLikeERC1155MetadataURI(implementation);
  }

  if (interfaces && interfaces.ERC2981) {
    behavesLikeERC2981(implementation);
  }
}

module.exports = {
  behavesLikeERC1155,
};
