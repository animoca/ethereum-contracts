const {shouldSupportInterfaces} = require('./contracts/introspection/behaviors/SupportsInterface.behavior');
const {behavesLikeERC20} = require('./contracts/token/ERC20/behaviors/ERC20.behavior');
const {behavesLikeERC721} = require('./contracts/token/ERC721/behaviors/ERC721.behavior');

module.exports = {
  behavesLikeERC20,
  behavesLikeERC721,
  shouldSupportInterfaces,
};
