const { shouldBehaveLikeERC721Standard } = require('./ERC721.standard.behavior');
const { shouldBehaveLikeERC721Mintable } = require('./ERC721.mintable.behavior');
const { shouldBehaveLikeERC721Burnable } = require('./ERC721.burnable.behavior');
const { shouldBehaveLikeERC721Metadata } = require('./ERC721.metadata.behavior');
const { shouldBehaveLikePausableContract } = require('../../../utils/Pausable.behavior');


function behavesLikeERC721(implementation) {
    describe.only('like an ERC721', function() { // TODO: remove .only
        if (implementation.interfaces.ERC721) {
            shouldBehaveLikeERC721Standard(implementation);
        }
        if (implementation.interfaces.ERC721Mintable) {
            shouldBehaveLikeERC721Mintable(implementation);
        }
        if (implementation.interfaces.ERC721Burnable) {
            shouldBehaveLikeERC721Burnable(implementation);
        }
        if (implementation.interfaces.ERC721Metadata) {
            shouldBehaveLikeERC721Metadata(implementation);
        }
        if (implementation.interfaces.Pausable) {
            shouldBehaveLikePausableContract(implementation);
        }
    });
}

module.exports = {
    behavesLikeERC721,
};