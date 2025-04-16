// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {LinearPool} from "./../LinearPool.sol";
import {ERC721Receiver} from "./../../../token/ERC721/ERC721Receiver.sol";
import {IERC721} from "./../../../token/ERC721/interfaces/IERC721.sol";
import {IForwarderRegistry} from "./../../../metatx/interfaces/IForwarderRegistry.sol";

abstract contract ERC721StakingLinearPool is LinearPool, ERC721Receiver {
    IERC721 public immutable STAKING_TOKEN;

    mapping(uint256 tokenId => address owner) public tokenOwners;

    error InvalidToken();
    error NotTheTokenOwner(address staker, uint256 tokenId, address owner);

    constructor(IERC721 stakingToken, IForwarderRegistry forwarderRegistry) LinearPool(forwarderRegistry) {
        STAKING_TOKEN = stakingToken;
    }

    function onERC721Received(address, address from, uint256 tokenId, bytes calldata) external virtual override returns (bytes4) {
        if (msg.sender != address(STAKING_TOKEN)) revert InvalidToken();
        bool requiresTransfer = false;
        bool batch = false;
        _stake(from, abi.encode(requiresTransfer, abi.encode(batch, tokenId)));
        return this.onERC721Received.selector;
    }

    function stake(bytes calldata stakeData) public payable virtual override {
        // non-reentrancy check removed
        bool requiresTransfer = true;
        _stake(_msgSender(), abi.encode(requiresTransfer, stakeData));
    }

    function _computeStake(address staker, bytes memory stakeData) internal virtual override returns (uint256 stakePoints) {
        (bool requiresTransfer, bytes memory data) = abi.decode(stakeData, (bool, bytes));
        bool batch = abi.decode(data, (bool));
        if (batch) {
            (, uint256[] memory tokenIds) = abi.decode(data, (bool, uint256[]));
            uint256 count = tokenIds.length;
            for (uint256 i; i != count; ++i) {
                uint256 tokenId = tokenIds[i];
                tokenOwners[tokenId] = staker;
                stakePoints += _tokenValue(tokenId);
                // batch case always requires transfer
                STAKING_TOKEN.transferFrom(staker, address(this), tokenId);
            }
        } else {
            (, uint256 tokenId) = abi.decode(data, (bool, uint256));
            tokenOwners[tokenId] = staker;
            stakePoints = _tokenValue(tokenId);
            if (requiresTransfer) {
                STAKING_TOKEN.transferFrom(staker, address(this), tokenId);
            }
        }
    }

    function _computeWithdraw(address staker, bytes memory withdrawData) internal virtual override returns (uint256 stakePoints) {
        bool batch = abi.decode(withdrawData, (bool));
        if (batch) {
            (, uint256[] memory tokenIds) = abi.decode(withdrawData, (bool, uint256[]));
            uint256 count = tokenIds.length;
            for (uint256 i; i != count; ++i) {
                uint256 tokenId = tokenIds[i];
                address tokenOwner = tokenOwners[tokenId];
                require(staker == tokenOwner, NotTheTokenOwner(staker, tokenId, tokenOwner));
                delete tokenOwners[tokenId];
                stakePoints += _tokenValue(tokenId);
                STAKING_TOKEN.transferFrom(address(this), staker, tokenId);
            }
        } else {
            (, uint256 tokenId) = abi.decode(withdrawData, (bool, uint256));
            address tokenOwner = tokenOwners[tokenId];
            require(staker == tokenOwner, NotTheTokenOwner(staker, tokenId, tokenOwner));
            delete tokenOwners[tokenId];
            stakePoints = _tokenValue(tokenId);
            STAKING_TOKEN.transferFrom(address(this), staker, tokenId);
        }
    }

    function _tokenValue(uint256 tokenId) internal view virtual returns (uint256 stakePoints);
}
