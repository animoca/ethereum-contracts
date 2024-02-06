const {behavesLikeERC1155Standard} = require('./ERC1155.standard.behavior');
const {behavesLikeERC1155Mintable} = require('./ERC1155.mintable.behavior');
const {behavesLikeERC1155Deliverable} = require('./ERC1155.deliverable.behavior');
const {behavesLikeERC1155Burnable} = require('./ERC1155.burnable.behavior');
const {behavesLikeERC1155MetadataURI} = require('./ERC1155.metadatauri.behavior');
const {behavesLikeERC2981} = require('./../../royalty/behaviors/ERC2981.behavior');

function behavesLikeERC1155(implementation) {
  const interfaces = implementation.interfaces;

  behavesLikeERC1155Standard(implementation);
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
