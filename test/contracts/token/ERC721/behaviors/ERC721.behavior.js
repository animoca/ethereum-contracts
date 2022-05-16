const { shouldBehaveLikeERC721Standard } = require('./ERC721.standard.behavior');
const { shouldBehaveLikeERC721MintableOnce } = require('./ERC721.mintableonce.behavior');
const { shouldBehaveLikeERC721Mintable } = require('./ERC721.mintable.behavior');
const { shouldBehaveLikeERC721Burnable } = require('./ERC721.burnable.behavior');
const { shouldBehaveLikeERC721Metadata } = require('./ERC721.metadata.behavior');



function behavesLikeERC721(implementation) {
    describe.only('like an ERC721', function() { // TODO: REMOVE .ONLY
        if (implementation.interfaces.ERC721) {
            shouldBehaveLikeERC721Standard(implementation);
        }
        if (implementation.interfaces.ERC721MintableOnce) {
            console.log("implementation.interfaces.ERC721MintableOnce");
            shouldBehaveLikeERC721MintableOnce(implementation);
        }
        if (implementation.interfaces.ERC721Mintable) {
            console.log("implementation.interfaces.ERC721Mintable");
            shouldBehaveLikeERC721Mintable(implementation);
        }
        if (implementation.interfaces.ERC721Burnable) {
            console.log("implementation.interfaces.ERC721Burnable");
            shouldBehaveLikeERC721Burnable(implementation);
        }
        if (implementation.interfaces.ERC721Metadata) {
            console.log("implementation.interfaces.ERC721Metadata");
            shouldBehaveLikeERC721Metadata(implementation);
        }
    });
}

module.exports = {
    behavesLikeERC721,
};