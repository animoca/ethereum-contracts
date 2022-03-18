// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Bytes32} from "./../../utils/libraries/Bytes32.sol";

contract Bytes32Mock {
    function strToBytes32(string calldata value) external pure returns (bytes32) {
        return bytes32(bytes(value));
    }

    function toBase32String(bytes32 value) external pure returns (string memory) {
        return Bytes32.toBase32String(value);
    }

    function toASCIIString(bytes32 value) external pure returns (string memory) {
        return Bytes32.toASCIIString(value);
    }
}
