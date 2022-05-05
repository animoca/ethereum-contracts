const { shouldBehaveLikeERC721Standard } = require('./ERC721.standard.behavior');

function behavesLikeERC721(implementation) {
    describe.only('like an ERC721', function() { // TODO: REMOVE .ONLY
        if (implementation.interfaces.ERC721) {
            shouldBehaveLikeERC721Standard(implementation);
        }
    });
}

module.exports = {
    behavesLikeERC721,
};