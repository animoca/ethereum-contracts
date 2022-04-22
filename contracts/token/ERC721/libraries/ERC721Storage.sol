// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {IERC721} from "./../interfaces/IERC721.sol";
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
    uint256 internal constant _APPROVAL_BIT_TOKEN_OWNER_ = 1 << 160;

    event Approval(address indexed _owner, address indexed _approved, uint256 indexed _tokenId);

    /// @notice Initialises the storage.
    /// @notice Sets the ERC721 storage version to `1`.
    /// @notice Marks the following ERC165 interface(s) as supported: ERC721.
    /// @dev Reverts if the ERC721 storage is already initialized to version `1` or above.
    function init() internal {
        StorageVersion.setVersion(ERC721_VERSION_SLOT, 1);
        InterfaceDetectionStorage.layout().setSupportedInterface(type(IERC721).interfaceId, true);
    }

    function approve(
        Layout storage s, 
        address sender, 
        address to, 
        uint256 tokenId
    ) internal {
        uint256 owner = s.owners[tokenId];
        require(owner != 0, "ERC721: non-existing NFT");
        address ownerAddress = address(uint160(owner));
        require(to != ownerAddress, "ERC721: self-approval");
        require(_isOperatable(s, ownerAddress, sender), "ERC721: non-approved sender");
        if (to == address(0)) {
            if (owner & _APPROVAL_BIT_TOKEN_OWNER_ != 0) {
                // remove the approval bit if it is present
                s.owners[tokenId] = uint256(uint160(ownerAddress));
            }
        } else {
            uint256 ownerWithApprovalBit = owner | _APPROVAL_BIT_TOKEN_OWNER_;
            if (owner != ownerWithApprovalBit) {
                // add the approval bit if it is not present
                s.owners[tokenId] = ownerWithApprovalBit;
            }
            s.nftApprovals[tokenId] = to;
        }
        emit Approval(ownerAddress, to, tokenId);
    }

        /**
     * Returns whether `sender` is authorised to make a transfer on behalf of `from`.
     * @param from The address to check operatibility upon.
     * @param sender The sender address.
     * @return True if sender is `from` or an operator for `from`, false otherwise.
     */
    function _isOperatable(Layout storage s, address from, address sender) internal view returns (bool) {
        return (from == sender) || s.operators[from][sender];
    }

    function layout() internal pure returns (Layout storage s) {
        bytes32 position = ERC721_STORAGE_POSITION;
        assembly {
            s.slot := position
        }
    }


}