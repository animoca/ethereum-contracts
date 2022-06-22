const {supportsInterfaces} = require('./contracts/introspection/behaviors/SupportsInterface.behavior');
const {behavesLikeERC20} = require('./contracts/token/ERC20/behaviors/ERC20.behavior');
const {behavesLikeERC721} = require('./contracts/token/ERC721/behaviors/ERC721.behavior');
const {behavesLikeERC1155} = require('./contracts/token/ERC1155/behaviors/ERC1155.behavior');

module.exports = {
  supportsInterfaces,
  behavesLikeERC20,
  behavesLikeERC721,
  behavesLikeERC1155,
};
