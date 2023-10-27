const {behavesLikeERC20Standard} = require('./ERC20.standard.behavior');
const {behavesLikeERC20Allowance} = require('./ERC20.allowance.behavior');
const {behavesLikeERC20Detailed} = require('./ERC20.detailed.behavior');
const {behavesLikeERC20Metadata} = require('./ERC20.metadata.behavior');
const {behavesLikeERC20Permit} = require('./ERC20.permit.behavior');
const {behavesLikeERC20Batch} = require('./ERC20.batch.behavior');
const {behavesLikeERC20Safe} = require('./ERC20.safe.behavior');
const {behavesLikeERC20Burnable} = require('./ERC20.burnable.behavior');
const {behavesLikeERC20Mintable} = require('./ERC20.mintable.behavior');

function behavesLikeERC20(implementation) {
  const interfaces = implementation.interfaces;

  if (interfaces && interfaces.ERC20) {
    behavesLikeERC20Standard(implementation);
  }

  if (interfaces && interfaces.ERC20Allowance) {
    behavesLikeERC20Allowance(implementation);
  }

  if (interfaces && interfaces.ERC20Detailed) {
    behavesLikeERC20Detailed(implementation);
  }

  if (interfaces && interfaces.ERC20Metadata) {
    behavesLikeERC20Metadata(implementation);
  }

  if (interfaces && interfaces.ERC20Permit) {
    behavesLikeERC20Permit(implementation);
  }

  if (interfaces && interfaces.ERC20BatchTransfer) {
    behavesLikeERC20Batch(implementation);
  }

  if (interfaces && interfaces.ERC20Safe) {
    behavesLikeERC20Safe(implementation);
  }

  behavesLikeERC20Burnable(implementation);
  behavesLikeERC20Mintable(implementation);
}

module.exports = {
  behavesLikeERC20,
};
