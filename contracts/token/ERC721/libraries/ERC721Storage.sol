// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {IERC721} from "./../interfaces/IERC721.sol";
import {IERC721Events} from "./../interfaces/IERC721Events.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {StorageVersion} from "./../../../proxy/libraries/StorageVersion.sol";
import {InterfaceDetectionStorage} from "./../../../introspection/libraries/InterfaceDetectionStorage.sol";

library ERC721Storage {
    using Address for address;
    using ERC721Storage for ERC721Storage.Layout;
    using InterfaceDetectionStorage for InterfaceDetectionStorage.Layout;

    struct Layout {
        mapping(address => mapping(address => bool)) operators;
        mapping(uint256 => uint256) owners;
        mapping(address => uint256) nftBalances;
        mapping(uint256 => address) nftApprovals;
    }

    bytes32 public constant ERC721_STORAGE_POSITION = bytes32(uint256(keccak256("animoca.token.ERC721.ERC721.storage")) - 1);
    bytes32 public constant ERC721_VERSION_SLOT = bytes32(uint256(keccak256("animoca.token.ERC721.ERC721.version")) - 1);

    /// @notice Initialises the storage.
    /// @notice Sets the ERC721 storage version to `1`.
    /// @notice Marks the following ERC165 interface(s) as supported: ERC721.
    /// @dev Reverts if the ERC721 storage is already initialized to version `1` or above.
    function init() internal {
        StorageVersion.setVersion(ERC721_VERSION_SLOT, 1);
        InterfaceDetectionStorage.layout().setSupportedInterface(type(IERC721).interfaceId, true);
    }

    function layout() internal pure returns (Layout storage s) {
        bytes32 position = ERC721_STORAGE_POSITION;
        assembly {
            s.slot := position
        }
    }


}