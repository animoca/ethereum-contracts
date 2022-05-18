// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import {IForwarderRegistry} from "./../../metatx/interfaces/IForwarderRegistry.sol";
import {InterfaceDetectionStorage} from "./../../introspection/libraries/InterfaceDetectionStorage.sol";
import {ERC165Facet} from "./../../introspection/ERC165Facet.sol";

contract ERC165FacetMock is ERC165Facet {
    using InterfaceDetectionStorage for InterfaceDetectionStorage.Layout;

    constructor(IForwarderRegistry forwarderRegistry) ERC165Facet(forwarderRegistry) {}

    function setSupportedInterface(bytes4 interfaceId, bool supported) external {
        InterfaceDetectionStorage.layout().setSupportedInterface(interfaceId, supported);
    }

    function __msgData() external view returns (bytes calldata) {
        return _msgData();
    }
}
