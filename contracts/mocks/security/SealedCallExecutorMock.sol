// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import {IForwarderRegistry} from "./../../metatx/interfaces/IForwarderRegistry.sol";
import {SealedCallExecutor} from "./../../security/SealedCallExecutor.sol";

contract SealedCallExecutorMock is SealedCallExecutor {
    constructor(IForwarderRegistry forwarderRegistry) SealedCallExecutor(forwarderRegistry) {}

    function __msgData() external view returns (bytes calldata) {
        return _msgData();
    }
}
