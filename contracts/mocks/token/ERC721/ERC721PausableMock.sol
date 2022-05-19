// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {IERC721Burnable} from "./../../../token/ERC721/interfaces/IERC721Burnable.sol";
import {IERC721Mintable} from "./../../../token/ERC721/interfaces/IERC721Mintable.sol";

import {ERC721} from "./../../../token/ERC721/ERC721.sol";
import {ERC721Mintable} from "./../../../token/ERC721/ERC721Mintable.sol";
import {ERC721Burnable} from "./../../../token/ERC721/ERC721Burnable.sol";
import {ERC721BatchTransfer} from "./../../../token/ERC721/ERC721BatchTransfer.sol";
import {Pausable} from "./../../../lifecycle/Pausable.sol";
import {PauseStorage} from "./../../../lifecycle/libraries/PauseStorage.sol";
import {ERC721BurnableMock} from "./ERC721BurnableMock.sol";

contract ERC721PausableMock is ERC721BurnableMock, Pausable  {
    using PauseStorage for PauseStorage.Layout;

    constructor(string memory name_, string memory symbol_, string memory tokenURI_, bool isPaused)
        ERC721BurnableMock(name_, symbol_ , tokenURI_)
        Pausable(isPaused)
    {}

    //=================================================== ERC721Burnable ====================================================//

    /// @inheritdoc IERC721Burnable
    /// @dev Reverts if the contract is paused.
    function burnFrom(address from, uint256 tokenId) public virtual override {
        PauseStorage.layout().enforceIsNotPaused();
        super.burnFrom(from, tokenId);
    }

    /// @inheritdoc IERC721Burnable
    /// @dev Reverts if the contract is paused.
    function batchBurnFrom(address from, uint256[] memory tokenIds) public virtual override {
        PauseStorage.layout().enforceIsNotPaused();
        super.batchBurnFrom(from, tokenIds);
    }

}