const {behavesLikeERC721Standard} = require('./ERC721.standard.behavior');
const {behavesLikeERC721Mintable} = require('./ERC721.mintable.behavior');
const {behavesLikeERC721Burnable} = require('./ERC721.burnable.behavior');
const {behavesLikeERC721Metadata} = require('./ERC721.metadata.behavior');

function behavesLikeERC721(implementation) {
  behavesLikeERC721Standard(implementation);
  behavesLikeERC721Mintable(implementation);
  behavesLikeERC721Burnable(implementation);

  if (implementation.interfaces.ERC721Metadata) {
    behavesLikeERC721Metadata(implementation);
  }
}

module.exports = {
  behavesLikeERC721,
};
