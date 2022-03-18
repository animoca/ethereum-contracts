// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IERC20} from "./../../../token/ERC20/interfaces/IERC20.sol";
import {ERC20Wrapper} from "./../../../token/ERC20/libraries/ERC20Wrapper.sol";

contract StandardERC20 {
    uint256 internal _state;

    function transfer(address, uint256) external returns (bool) {
        _state = 0;
        return true;
    }

    function transferFrom(
        address,
        address,
        uint256
    ) external returns (bool) {
        _state = 0;
        return true;
    }

    function approve(address, uint256) external returns (bool) {
        _state = 0;
        return true;
    }
}

contract NonStandardERC20 {
    uint256 internal _state;

    function transfer(address, uint256) external {
        _state = 0;
    }

    function transferFrom(
        address,
        address,
        uint256
    ) external {
        _state = 0;
    }

    function approve(address, uint256) external {
        _state = 0;
    }
}

contract FailingERC20 {
    uint256 internal _state;

    function transfer(address, uint256) external returns (bool) {
        _state = 0;
        return false;
    }

    function transferFrom(
        address,
        address,
        uint256
    ) external returns (bool) {
        _state = 0;
        return false;
    }

    function approve(address, uint256) external returns (bool) {
        _state = 0;
        return false;
    }
}

contract RevertingERC20 {
    uint256 internal _state;

    function transfer(address, uint256) external returns (bool) {
        _state = 0;
        // solhint-disable-next-line reason-string
        revert();
    }

    function transferFrom(
        address,
        address,
        uint256
    ) external returns (bool) {
        _state = 0;
        // solhint-disable-next-line reason-string
        revert();
    }

    function approve(address, uint256) external returns (bool) {
        _state = 0;
        // solhint-disable-next-line reason-string
        revert();
    }
}

contract RevertingWithMessageERC20 {
    uint256 internal _state;

    function transfer(address, uint256) external returns (bool) {
        _state = 0;
        revert("reverted");
    }

    function transferFrom(
        address,
        address,
        uint256
    ) external returns (bool) {
        _state = 0;
        revert("reverted");
    }

    function approve(address, uint256) external returns (bool) {
        _state = 0;
        revert("reverted");
    }
}

/**
 * @title ERC20Wrapper
 * Wraps ERC20 functions to support non-standard implementations which do not return a bool value.
 * Calls to the wrapped functions revert only if they throw or if they return false.
 */
contract ERC20WrapperMock {
    using ERC20Wrapper for IERC20;

    IERC20 public standardERC20;
    IERC20 public nonStandardERC20;
    IERC20 public failingERC20;
    IERC20 public revertingERC20;
    IERC20 public revertingWithMessageERC20;
    IERC20 public nonContractERC20;

    constructor() {
        standardERC20 = IERC20(address(new StandardERC20()));
        nonStandardERC20 = IERC20(address(new NonStandardERC20()));
        failingERC20 = IERC20(address(new FailingERC20()));
        revertingERC20 = IERC20(address(new RevertingERC20()));
        revertingWithMessageERC20 = IERC20(address(new RevertingWithMessageERC20()));
        nonContractERC20 = IERC20(msg.sender);
    }

    //

    function standardTransfer(address to, uint256 value) external {
        standardERC20.wrappedTransfer(to, value);
    }

    function standardTransferFrom(
        address from,
        address to,
        uint256 value
    ) external {
        standardERC20.wrappedTransferFrom(from, to, value);
    }

    function standardApprove(address spender, uint256 value) external {
        standardERC20.wrappedApprove(spender, value);
    }

    //

    function nonStandardTransfer(address to, uint256 value) external {
        nonStandardERC20.wrappedTransfer(to, value);
    }

    function nonStandardTransferFrom(
        address from,
        address to,
        uint256 value
    ) external {
        nonStandardERC20.wrappedTransferFrom(from, to, value);
    }

    function nonStandardApprove(address spender, uint256 value) external {
        nonStandardERC20.wrappedApprove(spender, value);
    }

    //

    function failingTransfer(address to, uint256 value) external {
        failingERC20.wrappedTransfer(to, value);
    }

    function failingTransferFrom(
        address from,
        address to,
        uint256 value
    ) external {
        failingERC20.wrappedTransferFrom(from, to, value);
    }

    function failingApprove(address spender, uint256 value) external {
        failingERC20.wrappedApprove(spender, value);
    }

    //

    function revertingTransfer(address to, uint256 value) external {
        revertingERC20.wrappedTransfer(to, value);
    }

    function revertingTransferFrom(
        address from,
        address to,
        uint256 value
    ) external {
        revertingERC20.wrappedTransferFrom(from, to, value);
    }

    function revertingApprove(address spender, uint256 value) external {
        revertingERC20.wrappedApprove(spender, value);
    }

    //

    function revertingWithMessageTransfer(address to, uint256 value) external {
        revertingWithMessageERC20.wrappedTransfer(to, value);
    }

    function revertingWithMessageTransferFrom(
        address from,
        address to,
        uint256 value
    ) external {
        revertingWithMessageERC20.wrappedTransferFrom(from, to, value);
    }

    function revertingWithMessageApprove(address spender, uint256 value) external {
        revertingWithMessageERC20.wrappedApprove(spender, value);
    }

    //

    function nonContractTransfer(address to, uint256 value) external {
        nonContractERC20.wrappedTransfer(to, value);
    }

    function nonContractTransferFrom(
        address from,
        address to,
        uint256 value
    ) external {
        nonContractERC20.wrappedTransferFrom(from, to, value);
    }

    function nonContractApprove(address spender, uint256 value) external {
        nonContractERC20.wrappedApprove(spender, value);
    }
}
