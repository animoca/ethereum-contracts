// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {LinearPool} from "./../LinearPool.sol";
import {ERC1155TokenReceiver} from "./../../../token/ERC1155/ERC1155TokenReceiver.sol";
import {IERC1155} from "./../../../token/ERC1155/interfaces/IERC1155.sol";
import {IForwarderRegistry} from "./../../../metatx/interfaces/IForwarderRegistry.sol";
import {InconsistentArrayLengths} from "./../../../CommonErrors.sol";

abstract contract ERC1155StakingLinearPool is LinearPool, ERC1155TokenReceiver {
    IERC1155 public immutable STAKING_TOKEN;

    mapping(address staker => mapping(uint256 id => uint256 amount)) public balances;

    error InvalidToken();
    error NotEnoughBalance(address staker, uint256 id, uint256 amount, uint256 balance);

    constructor(IERC1155 stakingToken, IForwarderRegistry forwarderRegistry) LinearPool(forwarderRegistry) {
        STAKING_TOKEN = stakingToken;
    }

    function stake(bytes calldata stakeData) public payable virtual override {
        bool requiresTransfer = true;
        _stake(_msgSender(), abi.encode(requiresTransfer, stakeData));
    }

    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 amount,
        bytes calldata
    ) external virtual override returns (bytes4) {
        if (operator != address(this)) {
            if (msg.sender != address(STAKING_TOKEN)) revert InvalidToken();
            bool requiresTransfer = false;
            bool batch = false;
            _stake(from, abi.encode(requiresTransfer, abi.encode(batch, id, amount)));
        }
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] calldata ids,
        uint256[] calldata amounts,
        bytes calldata
    ) external virtual override returns (bytes4) {
        if (operator != address(this)) {
            if (msg.sender != address(STAKING_TOKEN)) revert InvalidToken();
            bool requiresTransfer = false;
            bool batch = true;
            _stake(from, abi.encode(requiresTransfer, abi.encode(batch, ids, amounts)));
        }
        return this.onERC1155BatchReceived.selector;
    }

    function _computeStake(address staker, bytes memory stakeData) internal virtual override returns (uint256 stakePoints) {
        (bool requiresTransfer, bytes memory data) = abi.decode(stakeData, (bool, bytes));
        bool batch = abi.decode(data, (bool));
        if (batch) {
            (, uint256[] memory ids, uint256[] memory amounts) = abi.decode(data, (bool, uint256[], uint256[]));
            uint256 count = ids.length;
            require(count == amounts.length, InconsistentArrayLengths());
            for (uint256 i; i != count; ++i) {
                uint256 id = ids[i];
                uint256 amount = amounts[i];
                balances[staker][id] += amount;
                stakePoints += _tokenValue(id, amount);
            }
            if (requiresTransfer) {
                STAKING_TOKEN.safeBatchTransferFrom(staker, address(this), ids, amounts, "");
            }
        } else {
            (, uint256 id, uint256 amount) = abi.decode(data, (bool, uint256, uint256));
            balances[staker][id] += amount;
            stakePoints = _tokenValue(id, amount);
            if (requiresTransfer) {
                STAKING_TOKEN.safeTransferFrom(staker, address(this), id, amount, "");
            }
        }
    }

    function _computeWithdraw(address staker, bytes memory withdrawData) internal virtual override returns (uint256 stakePoints) {
        bool batch = abi.decode(withdrawData, (bool));
        if (batch) {
            (, uint256[] memory ids, uint256[] memory amounts) = abi.decode(withdrawData, (bool, uint256[], uint256[]));
            uint256 count = ids.length;
            require(count == amounts.length, InconsistentArrayLengths());
            for (uint256 i; i != count; ++i) {
                uint256 id = ids[i];
                uint256 amount = amounts[i];
                uint256 balance = balances[staker][id];
                require(balance >= amount, NotEnoughBalance(staker, id, amount, balance));
                balances[staker][id] = balance - amount;
                stakePoints += _tokenValue(id, amount);
            }
            STAKING_TOKEN.safeBatchTransferFrom(address(this), staker, ids, amounts, "");
        } else {
            (, uint256 id, uint256 amount) = abi.decode(withdrawData, (bool, uint256, uint256));
            uint256 balance = balances[staker][id];
            require(balance >= amount, NotEnoughBalance(staker, id, amount, balance));
            balances[staker][id] = balance - amount;
            stakePoints = _tokenValue(id, amount);
            STAKING_TOKEN.safeTransferFrom(address(this), staker, id, amount, "");
        }
    }

    function _tokenValue(uint256 id, uint256 amount) internal view virtual returns (uint256 stakePoints);
}
