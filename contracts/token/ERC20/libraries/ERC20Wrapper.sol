// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {IERC20} from "./../interfaces/IERC20.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";

// Inspired from OpenZeppelin, see:
// https://github.com/OpenZeppelin/openzeppelin-contracts/blob/b13bdb02492cca68091d56c31072b60f10e6142e/contracts/token/ERC20/utils/SafeERC20.sol
/// @title ERC20Wrapper
/// @notice Wraps ERC20 functions to support non-standard implementations which do not return a bool value.
/// @notice Calls to the wrapped functions revert only if they throw or if they return false.
library ERC20Wrapper {
    using Address for address;

    function wrappedTransfer(
        IERC20 token,
        address to,
        uint256 value
    ) internal {
        _callWithOptionalReturnData(token, abi.encodeWithSelector(token.transfer.selector, to, value));
    }

    function wrappedTransferFrom(
        IERC20 token,
        address from,
        address to,
        uint256 value
    ) internal {
        _callWithOptionalReturnData(token, abi.encodeWithSelector(token.transferFrom.selector, from, to, value));
    }

    function wrappedApprove(
        IERC20 token,
        address spender,
        uint256 value
    ) internal {
        _callWithOptionalReturnData(token, abi.encodeWithSelector(token.approve.selector, spender, value));
    }

    function _callWithOptionalReturnData(IERC20 token, bytes memory data) internal {
        bytes memory returndata = address(token).functionCall(data, "ERC20Wrapper: low-level call failed");
        if (returndata.length > 0) {
            require(abi.decode(returndata, (bool)), "ERC20Wrapper: operation failed");
        }
    }
}
