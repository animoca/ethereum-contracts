// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {Address} from "@openzeppelin/contracts/utils/Address.sol";

contract ForwarderMock {
    using Address for address;

    function forward(
        address from,
        address target,
        bytes calldata data
    ) external payable {
        target.functionCallWithValue(abi.encodePacked(data, from), msg.value);
    }
}
