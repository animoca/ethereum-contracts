// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {IForwarderRegistry} from "./../../../metatx/interfaces/IForwarderRegistry.sol";
import {ERC20BatchTransfersFacet} from "./../../../token/ERC20/ERC20BatchTransfersFacet.sol";

contract ERC20BatchTransfersFacetMock is ERC20BatchTransfersFacet {
    constructor(IForwarderRegistry forwarderRegistry) ERC20BatchTransfersFacet(forwarderRegistry) {}

    function __msgData() external view returns (bytes calldata) {
        return _msgData();
    }
}
