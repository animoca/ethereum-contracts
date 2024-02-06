const {behavesLikeERC721Standard} = require('./ERC721.standard.behavior');
const {behavesLikeERC721BatchTransfer} = require('./ERC721.batchtransfer.behavior');
const {behavesLikeERC721Mintable} = require('./ERC721.mintable.behavior');
const {behavesLikeERC721Deliverable} = require('./ERC721.deliverable.behavior');
const {behavesLikeERC721Burnable} = require('./ERC721.burnable.behavior');
const {behavesLikeERC721Metadata} = require('./ERC721.metadata.behavior');
const {behavesLikeERC2981} = require('./../../royalty/behaviors/ERC2981.behavior');

function behavesLikeERC721(implementation) {
  const interfaces = implementation.interfaces;

  behavesLikeERC721Standard(implementation);
  behavesLikeERC721BatchTransfer(implementation);
  behavesLikeERC721Mintable(implementation);
  behavesLikeERC721Burnable(implementation);

  if (interfaces && interfaces.ERC721Deliverable) {
    behavesLikeERC721Deliverable(implementation);
  }

  if (interfaces && interfaces.ERC721Metadata) {
    behavesLikeERC721Metadata(implementation);
  }

  if (interfaces && interfaces.ERC2981) {
    behavesLikeERC2981(implementation);
  }
}

module.exports = {
  behavesLikeERC721,
};
