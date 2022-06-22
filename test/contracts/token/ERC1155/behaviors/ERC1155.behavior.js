const {behavesLikeERC1155Standard} = require('./ERC1155.standard.behavior');
const {behavesLikeERC1155Mintable} = require('./ERC1155.mintable.behavior');
const {behavesLikeERC1155Deliverable} = require('./ERC1155.deliverable.behavior');
const {behavesLikeERC1155Burnable} = require('./ERC1155.burnable.behavior');
const {behavesLikeERC1155MetadataURI} = require('./ERC1155.metadatauri.behavior');

function behavesLikeERC1155(implementation) {
  behavesLikeERC1155Standard(implementation);
  behavesLikeERC1155Mintable(implementation);
  behavesLikeERC1155Burnable(implementation);

  if (implementation.interfaces.ERC1155Deliverable) {
    behavesLikeERC1155Deliverable(implementation);
  }

  if (implementation.interfaces.ERC1155MetadataURI) {
    behavesLikeERC1155MetadataURI(implementation);
  }
}

module.exports = {
  behavesLikeERC1155,
};
