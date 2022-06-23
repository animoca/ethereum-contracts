// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import {MultiStaticCall} from "./../../utils/MultiStaticCall.sol";

contract MultiStaticCallMock is MultiStaticCall {
    function revertingCall() public pure {
        revert("reverted");
    }
}
