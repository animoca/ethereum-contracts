// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {ERC721} from "./../../../token/ERC721/ERC721.sol";
import {ERC721Mintable} from "./../../../token/ERC721/ERC721Mintable.sol";
import {ERC721Burnable} from "./../../../token/ERC721/ERC721Burnable.sol";
import {ERC721BatchTransfer} from "./../../../token/ERC721/ERC721BatchTransfer.sol";
import {ERC721TokenMetadataWithBaseURI} from "./../../../token/ERC721/ERC721TokenMetadataWithBaseURI.sol";
import {Ownable} from "./../../../access/Ownable.sol";
import {Pausable} from "./../../../lifecycle/Pausable.sol";
import {PauseStorage} from "./../../../lifecycle/libraries/PauseStorage.sol";

contract ERC721PausableMock is ERC721, ERC721Mintable, ERC721Burnable, ERC721BatchTransfer, ERC721TokenMetadataWithBaseURI, Pausable {
    using PauseStorage for PauseStorage.Layout;
    
    constructor(string memory name_, string memory symbol_, string memory tokenURI_) 
        ERC721TokenMetadataWithBaseURI(name_, symbol_, tokenURI_)
        Pausable(true)
        {}

    function enforceIsPaused() external view {
        PauseStorage.layout().enforceIsPaused();
    }

    function enforceIsNotPaused() external view {
        PauseStorage.layout().enforceIsNotPaused();
    }
}