const { shouldBehaveLikeERC721Standard } = require('./ERC721.standard.behavior');
const { shouldBehaveLikeERC721MintableOnce } = require('./ERC721.mintableonce.behavior');

function behavesLikeERC721(implementation) {
    describe.only('like an ERC721', function() { // TODO: REMOVE .ONLY
        if (implementation.interfaces.ERC721) {
            shouldBehaveLikeERC721Standard(implementation);
        }
        if (implementation.interfaces.ERC721MintableOnce) {
            console.log("implementation.interfaces.ERC721MintableOnce")
            shouldBehaveLikeERC721MintableOnce(implementation);
        }
    });
}

module.exports = {
    behavesLikeERC721,
};