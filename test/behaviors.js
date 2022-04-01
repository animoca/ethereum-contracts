const {shouldSupportInterfaces} = require('./contracts/introspection/behaviors/SupportsInterface.behavior');
const {behavesLikeERC20} = require('./contracts/token/ERC20/behaviors/ERC20.behavior');

module.exports = {
  behavesLikeERC20,
  shouldSupportInterfaces,
};
