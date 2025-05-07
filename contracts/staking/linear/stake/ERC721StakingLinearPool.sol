// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {LinearPool} from "./../LinearPool.sol";
import {ERC721Receiver} from "./../../../token/ERC721/ERC721Receiver.sol";
import {TokenRecoveryBase} from "./../../../security/base/TokenRecoveryBase.sol";
import {IERC721} from "./../../../token/ERC721/interfaces/IERC721.sol";
import {IForwarderRegistry} from "./../../../metatx/interfaces/IForwarderRegistry.sol";

abstract contract ERC721StakingLinearPool is LinearPool, ERC721Receiver {
    IERC721 public immutable STAKING_TOKEN;

    mapping(uint256 tokenId => address owner) public tokenOwners;

    error InvalidToken();
    error NotTheTokenOwner(address staker, uint256 tokenId, address owner);
    error InvalidRecoveryToken(uint256 tokenId);

    constructor(IERC721 stakingToken, IForwarderRegistry forwarderRegistry) LinearPool(forwarderRegistry) {
        STAKING_TOKEN = stakingToken;
    }

    /// @notice Callback called when the contract receives ERC721 tokens via the IERC721Receiver functions.
    /// @param from The address of the sender.
    /// @param tokenId The ID of the token received.
    /// @return bytes4 The function selector of the callback.
    /// @dev Reverts with {InvalidToken} if the sender is not the staking token.
    function onERC721Received(address, address from, uint256 tokenId, bytes calldata) external virtual override returns (bytes4) {
        if (msg.sender != address(STAKING_TOKEN)) revert InvalidToken();
        bool requiresTransfer = false;
        bool batch = false;
        _stake(from, abi.encode(requiresTransfer, abi.encode(batch, tokenId)));
        return this.onERC721Received.selector;
    }

    /// @inheritdoc LinearPool
    /// @param stakeData The data to be used for staking, encoded as
    ///   (bool batch, uint256 tokenId) where batch is false, or (bool batch, uint256[] tokenIds) where batch is true.
    function stake(bytes calldata stakeData) public payable virtual override {
        // non-reentrancy check removed
        bool requiresTransfer = true;
        _stake(_msgSender(), abi.encode(requiresTransfer, stakeData));
    }

    /// @inheritdoc LinearPool
    /// @param stakeData The data to be used for staking, encoded as (bool requiresTransfer, bytes stakeData) where stakeData is
    ///   (bool batch, uint256 tokenId) where batch is false, or (bool batch, uint256[] tokenIds) where batch is true.
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

    /// @inheritdoc LinearPool
    /// @param withdrawData The data to be used for withdrawing, encoded as
    ///   (bool batch, uint256 tokenId) where batch is false, or (bool batch, uint256[] tokenIds) where batch is true.
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

    /// @inheritdoc TokenRecoveryBase
    /// @dev Reverts with {InvalidRecoveryToken} if recovering some STAKING_TOKEN which was legitimately staked to this contract.
    function recoverERC721s(address[] calldata accounts, IERC721[] calldata contracts, uint256[] calldata tokenIds) public virtual override {
        for (uint256 i; i != contracts.length; ++i) {
            if (contracts[i] == STAKING_TOKEN) {
                uint256 tokenId = tokenIds[i];
                require(tokenOwners[tokenId] == address(0), InvalidRecoveryToken(tokenId));
            }
        }
        super.recoverERC721s(accounts, contracts, tokenIds);
    }

    function _tokenValue(uint256 tokenId) internal view virtual returns (uint256 stakePoints);
}
