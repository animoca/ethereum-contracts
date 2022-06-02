// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import {IERC721} from "./../interfaces/IERC721.sol";
import {IERC721Receiver} from "./../interfaces/IERC721Receiver.sol";
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

    bytes4 internal constant _ERC721_RECEIVED = type(IERC721Receiver).interfaceId;
    uint256 internal constant _APPROVAL_BIT_TOKEN_OWNER_ = 1 << 160;
    // Burnt Non-Fungible Token owner's magic value
    uint256 internal constant _BURNT_NFT_OWNER = 0xdead000000000000000000000000000000000000000000000000000000000000;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed _owner, address indexed _approved, uint256 indexed _tokenId);
    event ApprovalForAll(address indexed _owner, address indexed _operator, bool _approved);

    /// @notice Initialises the storage.
    /// @notice Marks the following ERC165 interface(s) as supported: ERC721.
    /// @dev Note: This function should be called ONLY in the constructor of an immutable (non-proxied) contract.
    function constructorInit(Layout storage) internal {
        InterfaceDetectionStorage.layout().setSupportedInterface(type(IERC721).interfaceId, true);
    }

    /// @notice Initialises the storage.
    /// @notice Sets the ERC721 storage version to `1`.
    /// @notice Marks the following ERC165 interface(s) as supported: ERC721.
    /// @dev Note: This function should be called ONLY in the init function of a proxied contract.
    /// @dev Reverts if the ERC721 storage is already initialized to version `1` or above.
    function proxyInit(Layout storage s) internal {
        StorageVersion.setVersion(ERC721_VERSION_SLOT, 1);
        s.constructorInit();    
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
        require(address(uint160(owner)) != address(0), "ERC721: non-existing NFT");
        if (owner & _APPROVAL_BIT_TOKEN_OWNER_ != 0) {
            return s.nftApprovals[tokenId];
        } else {
            return address(0);
        }
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

    function setApprovalForAll(
        Layout storage s,
        address sender,
        address operator,
        bool approved
    ) internal {
        require(operator != sender, "ERC721: self-approval");
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
        _transferFrom(
            s,
            sender,
            from,
            to,
            tokenId,
            "",
            /* safe */
            false
        );
    }

    function safeTransferFrom(
        Layout storage s,
        address sender,
        address from,
        address to,
        uint256 tokenId
    ) internal {
        _transferFrom(
            s,
            sender,
            from,
            to,
            tokenId,
            "",
            /* safe */
            true
        );
    }

    function safeTransferFrom(
        Layout storage s,
        address sender,
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) internal {
        _transferFrom(
            s,
            sender,
            from,
            to,
            tokenId,
            data,
            /* safe */
            true
        );
    }

    function batchTransferFrom(
        Layout storage s,
        address sender,
        address from,
        address to,
        uint256[] memory tokenIds
    ) internal {
        require(to != address(0), "ERC721: transfer to zero");
        bool operatable = _isOperatable(s, from, sender);

        uint256 length = tokenIds.length;
        unchecked {
            for (uint256 i; i != length; ++i) {
                uint256 tokenId = tokenIds[i];
                _transferNFT(s, sender, from, to, tokenId, operatable, true);
                emit Transfer(from, to, tokenId);
            }
        }

        if (length != 0) {
            _transferNFTUpdateBalances(s, from, to, length);
        }
    }

    function mintOnce(
        Layout storage s,
        address sender,
        address to,
        uint256 tokenId,
        bytes memory data,
        bool safe
    ) internal {
        require(to != address(0), "ERC721: mint to zero");
        require(s.owners[tokenId] != _BURNT_NFT_OWNER, "ERC721: burnt NFT");

        _mintNFT(s, to, tokenId, false);

        emit Transfer(address(0), to, tokenId);
        if (safe && to.isContract()) {
            _callOnERC721Received(sender, address(0), to, tokenId, data);
        }
    }

    function mint(
        Layout storage s,
        address sender,
        address to,
        uint256 tokenId,
        bytes memory data,
        bool safe
    ) internal {
        require(to != address(0), "ERC721: mint to zero");

        _mintNFT(s, to, tokenId, false);

        emit Transfer(address(0), to, tokenId);
        if (safe && to.isContract()) {
            _callOnERC721Received(sender, address(0), to, tokenId, data);
        }
    }

    function batchMintOnce(
        Layout storage s,
        address to,
        uint256[] memory tokenIds
    ) internal {
        require(to != address(0), "ERC721: mint to zero");

        uint256 length = tokenIds.length;
        unchecked {
            for (uint256 i; i != length; ++i) {
                uint256 tokenId = tokenIds[i];
                require(s.owners[tokenId] != _BURNT_NFT_OWNER, "ERC721: burnt NFT");
                _mintNFT(s, to, tokenId, true);
                emit Transfer(address(0), to, tokenId);
            }
        }

        s.nftBalances[to] += length;
    }

    function batchMint(
        Layout storage s,
        address to,
        uint256[] memory tokenIds
    ) internal {
        require(to != address(0), "ERC721: mint to zero");

        uint256 length = tokenIds.length;
        unchecked {
            for (uint256 i; i != length; ++i) {
                uint256 tokenId = tokenIds[i];
                _mintNFT(s, to, tokenId, true);
                emit Transfer(address(0), to, tokenId);
            }
        }

        s.nftBalances[to] += length;
    }

    function burnFrom(
        Layout storage s,
        address sender,
        address from,
        uint256 tokenId
    ) internal {
        bool operatable = _isOperatable(s, from, sender);

        _burnNFT(s, sender, from, tokenId, operatable, false);
        emit Transfer(from, address(0), tokenId);
    }

    function batchBurnFrom(
        Layout storage s,
        address sender,
        address from,
        uint256[] memory tokenIds
    ) internal {
        bool operatable = _isOperatable(s, from, sender);

        uint256 length = tokenIds.length;

        unchecked {
            for (uint256 i; i != length; ++i) {
                uint256 tokenId = tokenIds[i];
                _burnNFT(s, sender, from, tokenId, operatable, true);
                emit Transfer(from, address(0), tokenId);
            }
        }

        if (length != 0) {
            s.nftBalances[from] -= length;
        }
    }

    function balanceOf(Layout storage s, address owner) internal view returns (uint256) {
        require(owner != address(0), "ERC721: zero address");
        return s.nftBalances[owner];
    }

    function ownerOf(Layout storage s, uint256 tokenId) internal view returns (address) {
        address owner = address(uint160(s.owners[tokenId]));
        require(owner != address(0), "ERC721: non-existing NFT");
        return owner;
    }

    function layout() internal pure returns (Layout storage s) {
        bytes32 position = ERC721_STORAGE_POSITION;
        assembly {
            s.slot := position
        }
    }

    function _transferFrom(
        Layout storage s,
        address sender,
        address from,
        address to,
        uint256 tokenId,
        bytes memory data,
        bool safe
    ) private {
        require(to != address(0), "ERC721: transfer to zero");
        bool operatable = _isOperatable(s, from, sender);

        _transferNFT(s, sender, from, to, tokenId, operatable, false);

        emit Transfer(from, to, tokenId);
        if (safe && to.isContract()) {
            _callOnERC721Received(sender, from, to, tokenId, data);
        }
    }

    function _transferNFT(
        Layout storage s,
        address sender,
        address from,
        address to,
        uint256 id,
        bool operatable,
        bool isBatch
    ) private {
        uint256 owner = s.owners[id];
        require(from == address(uint160(owner)), "ERC721: non-owned NFT");
        if (!operatable) {
            require((owner & _APPROVAL_BIT_TOKEN_OWNER_ != 0) && sender == s.nftApprovals[id], "ERC721: non-approved sender");
        }
        s.owners[id] = uint256(uint160(to));
        if (!isBatch) {
            _transferNFTUpdateBalances(s, from, to, 1);
        }
    }

    function _transferNFTUpdateBalances(
        Layout storage s,
        address from,
        address to,
        uint256 amount
    ) private {
        if (from != to) {
            unchecked {
                // cannot underflow as balance is verified through ownership
                s.nftBalances[from] -= amount;
                //  cannot overflow as supply cannot overflow
                s.nftBalances[to] += amount;
            }
        }
    }

    function _mintNFT(
        Layout storage s,
        address to,
        uint256 id,
        bool isBatch
    ) private {
        require(s.owners[id] == 0, "ERC721: existing/burnt NFT");

        s.owners[id] = uint256(uint160(to));

        if (!isBatch) {
            unchecked {
                // cannot overflow due to the cost of minting individual tokens
                ++s.nftBalances[to];
            }
        }
    }

    function _burnNFT(
        Layout storage s,
        address sender,
        address from,
        uint256 id,
        bool operatable,
        bool isBatch
    ) private {
        uint256 owner = s.owners[id];
        require(from == address(uint160(owner)), "ERC721: non-owned NFT");
        if (!operatable) {
            require((owner & _APPROVAL_BIT_TOKEN_OWNER_ != 0) && sender == s.nftApprovals[id], "ERC721: non-approved sender");
        }
        s.owners[id] = _BURNT_NFT_OWNER;

        if (!isBatch) {
            unchecked {
                // cannot underflow as balance is verified through NFT ownership
                --s.nftBalances[from];
            }
        }
    }

    /// @notice Calls {IERC721Receiver-onERC721Received} on a target contract.
    /// @dev Reverts if `to` is not a contract.
    /// @dev Reverts if the call to the target fails or is refused.
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
        require(IERC721Receiver(to).onERC721Received(sender, from, tokenId, data) == _ERC721_RECEIVED, "ERC721: transfer refused");
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
