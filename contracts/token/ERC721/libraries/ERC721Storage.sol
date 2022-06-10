// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {IERC721} from "./../interfaces/IERC721.sol";
import {IERC721BatchTransfer} from "./../interfaces/IERC721BatchTransfer.sol";
import {IERC721Mintable} from "./../interfaces/IERC721Mintable.sol";
import {IERC721Burnable} from "./../interfaces/IERC721Burnable.sol";
import {IERC721Receiver} from "./../interfaces/IERC721Receiver.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {ProxyInitialization} from "./../../../proxy/libraries/ProxyInitialization.sol";
import {InterfaceDetectionStorage} from "./../../../introspection/libraries/InterfaceDetectionStorage.sol";

library ERC721Storage {
    using Address for address;
    using ERC721Storage for ERC721Storage.Layout;
    using InterfaceDetectionStorage for InterfaceDetectionStorage.Layout;

    struct Layout {
        mapping(uint256 => uint256) owners;
        mapping(address => uint256) balances;
        mapping(uint256 => address) approvals;
        mapping(address => mapping(address => bool)) operators;
    }

    bytes32 internal constant LAYOUT_STORAGE_SLOT = bytes32(uint256(keccak256("animoca.token.ERC721.ERC721.storage")) - 1);

    bytes4 internal constant ERC721_RECEIVED = IERC721Receiver.onERC721Received.selector;
    // Single token approval set owner's magic value
    uint256 internal constant APPROVAL_BIT_TOKEN_OWNER_ = 1 << 160;
    // Burnt token owner's magic value
    uint256 internal constant BURNT_NFT_OWNER = 0xdead000000000000000000000000000000000000000000000000000000000000;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    /// @notice Marks the following ERC165 interface(s) as supported: ERC721.
    function init() internal {
        InterfaceDetectionStorage.layout().setSupportedInterface(type(IERC721).interfaceId, true);
    }

    /// @notice Marks the following ERC165 interface(s) as supported: ERC721BatchTransfer.
    function initERC721BatchTransfer() internal {
        InterfaceDetectionStorage.layout().setSupportedInterface(type(IERC721BatchTransfer).interfaceId, true);
    }

    /// @notice Marks the following ERC165 interface(s) as supported: ERC721Mintable.
    function initERC721Mintable() internal {
        InterfaceDetectionStorage.layout().setSupportedInterface(type(IERC721Mintable).interfaceId, true);
    }

    /// @notice Marks the following ERC165 interface(s) as supported: ERC721Burnable.
    function initERC721Burnable() internal {
        InterfaceDetectionStorage.layout().setSupportedInterface(type(IERC721Burnable).interfaceId, true);
    }

    function approve(
        Layout storage s,
        address sender,
        address to,
        uint256 tokenId
    ) internal {
        uint256 owner = s.owners[tokenId];
        require(owner != 0, "ERC721: non-existing token");
        address ownerAddress = address(uint160(owner));
        require(to != ownerAddress, "ERC721: self-approval");
        require(_isOperatable(s, ownerAddress, sender), "ERC721: non-approved sender");
        if (to == address(0)) {
            if (owner & APPROVAL_BIT_TOKEN_OWNER_ != 0) {
                // remove the approval bit if it is present
                s.owners[tokenId] = uint256(uint160(ownerAddress));
            }
        } else {
            uint256 ownerWithApprovalBit = owner | APPROVAL_BIT_TOKEN_OWNER_;
            if (owner != ownerWithApprovalBit) {
                // add the approval bit if it is not present
                s.owners[tokenId] = ownerWithApprovalBit;
            }
            s.approvals[tokenId] = to;
        }
        emit Approval(ownerAddress, to, tokenId);
    }

    function setApprovalForAll(
        Layout storage s,
        address sender,
        address operator,
        bool approved
    ) internal {
        require(operator != sender, "ERC721: self-approval for all");
        s.operators[sender][operator] = approved;
        emit ApprovalForAll(sender, operator, approved);
    }

    function transferFrom(
        Layout storage s,
        address sender,
        address from,
        address to,
        uint256 tokenId
    ) internal {
        require(to != address(0), "ERC721: transfer to address(0)");

        uint256 owner = s.owners[tokenId];
        require(from == address(uint160(owner)), "ERC721: non-owned token");

        if (!_isOperatable(s, from, sender)) {
            require((owner & APPROVAL_BIT_TOKEN_OWNER_ != 0) && sender == s.approvals[tokenId], "ERC721: non-approved sender");
        }

        s.owners[tokenId] = uint256(uint160(to));
        if (from != to) {
            unchecked {
                // cannot underflow as balance is verified through ownership
                --s.balances[from];
                //  cannot overflow as supply cannot overflow
                ++s.balances[to];
            }
        }

        emit Transfer(from, to, tokenId);
    }

    function safeTransferFrom(
        Layout storage s,
        address sender,
        address from,
        address to,
        uint256 tokenId
    ) internal {
        s.transferFrom(sender, from, to, tokenId);
        if (to.isContract()) {
            _callOnERC721Received(sender, from, to, tokenId, "");
        }
    }

    function safeTransferFrom(
        Layout storage s,
        address sender,
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) internal {
        s.transferFrom(sender, from, to, tokenId);
        if (to.isContract()) {
            _callOnERC721Received(sender, from, to, tokenId, data);
        }
    }

    function batchTransferFrom(
        Layout storage s,
        address sender,
        address from,
        address to,
        uint256[] memory tokenIds
    ) internal {
        require(to != address(0), "ERC721: transfer to address(0)");
        bool operatable = _isOperatable(s, from, sender);

        uint256 length = tokenIds.length;
        unchecked {
            for (uint256 i; i != length; ++i) {
                uint256 tokenId = tokenIds[i];
                uint256 owner = s.owners[tokenId];
                require(from == address(uint160(owner)), "ERC721: non-owned token");
                if (!operatable) {
                    require((owner & APPROVAL_BIT_TOKEN_OWNER_ != 0) && sender == s.approvals[tokenId], "ERC721: non-approved sender");
                }
                s.owners[tokenId] = uint256(uint160(to));
                emit Transfer(from, to, tokenId);
            }

            if (from != to && length != 0) {
                // cannot underflow as balance is verified through ownership
                s.balances[from] -= length;
                // cannot overflow as supply cannot overflow
                s.balances[to] += length;
            }
        }
    }

    function mint(
        Layout storage s,
        address to,
        uint256 tokenId
    ) internal {
        require(to != address(0), "ERC721: mint to address(0)");
        require(uint160(s.owners[tokenId]) == 0, "ERC721: existing token");

        s.owners[tokenId] = uint256(uint160(to));

        unchecked {
            // cannot overflow due to the cost of minting individual tokens
            ++s.balances[to];
        }

        emit Transfer(address(0), to, tokenId);
    }

    function safeMint(
        Layout storage s,
        address sender,
        address to,
        uint256 tokenId,
        bytes memory data
    ) internal {
        s.mint(to, tokenId);
        if (to.isContract()) {
            _callOnERC721Received(sender, address(0), to, tokenId, data);
        }
    }

    function batchMint(
        Layout storage s,
        address to,
        uint256[] memory tokenIds
    ) internal {
        require(to != address(0), "ERC721: mint to address(0)");

        unchecked {
            uint256 length = tokenIds.length;
            for (uint256 i; i != length; ++i) {
                uint256 tokenId = tokenIds[i];
                require(uint160(s.owners[tokenId]) == 0, "ERC721: existing token");

                s.owners[tokenId] = uint256(uint160(to));
                emit Transfer(address(0), to, tokenId);
            }

            s.balances[to] += length;
        }
    }

    function mintOnce(
        Layout storage s,
        address to,
        uint256 tokenId
    ) internal {
        require(to != address(0), "ERC721: mint to address(0)");

        uint256 owner = s.owners[tokenId];
        require(uint160(owner) == 0, "ERC721: existing token");
        require(owner != BURNT_NFT_OWNER, "ERC721: burnt token");

        s.owners[tokenId] = uint256(uint160(to));

        unchecked {
            // cannot overflow due to the cost of minting individual tokens
            ++s.balances[to];
        }

        emit Transfer(address(0), to, tokenId);
    }

    function safeMintOnce(
        Layout storage s,
        address sender,
        address to,
        uint256 tokenId,
        bytes memory data
    ) internal {
        s.mintOnce(to, tokenId);
        if (to.isContract()) {
            _callOnERC721Received(sender, address(0), to, tokenId, data);
        }
    }

    function batchMintOnce(
        Layout storage s,
        address to,
        uint256[] memory tokenIds
    ) internal {
        require(to != address(0), "ERC721: mint to address(0)");

        unchecked {
            uint256 length = tokenIds.length;
            for (uint256 i; i != length; ++i) {
                uint256 tokenId = tokenIds[i];
                uint256 owner = s.owners[tokenId];
                require(uint160(owner) == 0, "ERC721: existing token");
                require(owner != BURNT_NFT_OWNER, "ERC721: burnt token");

                s.owners[tokenId] = uint256(uint160(to));

                emit Transfer(address(0), to, tokenId);
            }

            s.balances[to] += length;
        }
    }

    function burnFrom(
        Layout storage s,
        address sender,
        address from,
        uint256 tokenId
    ) internal {
        uint256 owner = s.owners[tokenId];
        require(from == address(uint160(owner)), "ERC721: non-owned token");

        if (!_isOperatable(s, from, sender)) {
            require((owner & APPROVAL_BIT_TOKEN_OWNER_ != 0) && sender == s.approvals[tokenId], "ERC721: non-approved sender");
        }

        s.owners[tokenId] = BURNT_NFT_OWNER;

        unchecked {
            // cannot underflow as balance is verified through NFT ownership
            --s.balances[from];
        }
        emit Transfer(from, address(0), tokenId);
    }

    function batchBurnFrom(
        Layout storage s,
        address sender,
        address from,
        uint256[] memory tokenIds
    ) internal {
        bool operatable = _isOperatable(s, from, sender);

        unchecked {
            uint256 length = tokenIds.length;

            for (uint256 i; i != length; ++i) {
                uint256 tokenId = tokenIds[i];
                uint256 owner = s.owners[tokenId];
                require(from == address(uint160(owner)), "ERC721: non-owned token");
                if (!operatable) {
                    require((owner & APPROVAL_BIT_TOKEN_OWNER_ != 0) && sender == s.approvals[tokenId], "ERC721: non-approved sender");
                }
                s.owners[tokenId] = BURNT_NFT_OWNER;
                emit Transfer(from, address(0), tokenId);
            }

            if (length != 0) {
                s.balances[from] -= length;
            }
        }
    }

    function balanceOf(Layout storage s, address owner) internal view returns (uint256) {
        require(owner != address(0), "ERC721: balance of address(0)");
        return s.balances[owner];
    }

    function ownerOf(Layout storage s, uint256 tokenId) internal view returns (address) {
        address owner = address(uint160(s.owners[tokenId]));
        require(owner != address(0), "ERC721: non-existing token");
        return owner;
    }

    function isApprovedForAll(
        Layout storage s,
        address owner,
        address operator
    ) internal view returns (bool) {
        return s.operators[owner][operator];
    }

    function getApproved(Layout storage s, uint256 tokenId) internal view returns (address) {
        uint256 owner = s.owners[tokenId];
        require(address(uint160(owner)) != address(0), "ERC721: non-existing token");
        if (owner & APPROVAL_BIT_TOKEN_OWNER_ != 0) {
            return s.approvals[tokenId];
        } else {
            return address(0);
        }
    }

    function layout() internal pure returns (Layout storage s) {
        bytes32 position = LAYOUT_STORAGE_SLOT;
        assembly {
            s.slot := position
        }
    }

    /// @notice Calls {IERC721Receiver-onERC721Received} on a target contract.
    /// @dev Reverts if the call to the target fails, reverts or is rejected.
    /// @param sender sender of the message.
    /// @param from Previous token owner.
    /// @param to New token owner.
    /// @param tokenId Identifier of the token transferred.
    /// @param data Optional data to send along with the receiver contract call.
    function _callOnERC721Received(
        address sender,
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) private {
        require(IERC721Receiver(to).onERC721Received(sender, from, tokenId, data) == ERC721_RECEIVED, "ERC721: safe transfer rejected");
    }

    /// @notice Returns whether `sender` is authorised to make a transfer on behalf of `from`.
    /// @param from The token owner.
    /// @param sender The sender to check the operatability of.
    /// @return operatable True if sender is `from` or an operator for `from`, false otherwise.
    function _isOperatable(
        Layout storage s,
        address from,
        address sender
    ) private view returns (bool operatable) {
        return (from == sender) || s.operators[from][sender];
    }
}
