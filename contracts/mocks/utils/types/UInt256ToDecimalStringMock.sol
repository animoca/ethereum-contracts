// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {UInt256ToDecimalString} from "../../../utils/types/UInt256ToDecimalString.sol";

contract UInt256ToDecimalStringMock {
    using UInt256ToDecimalString for uint256;

    function toDecimalString(uint256 value) external pure returns (string memory result) {
        result = value.toDecimalString();
    }
}
