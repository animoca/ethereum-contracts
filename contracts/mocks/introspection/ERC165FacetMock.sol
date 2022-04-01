// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {InterfaceDetectionStorage} from "./../../introspection/libraries/InterfaceDetectionStorage.sol";
import {ERC165Facet} from "./../../introspection/ERC165Facet.sol";

contract ERC165FacetMock is ERC165Facet {
    using InterfaceDetectionStorage for InterfaceDetectionStorage.Layout;

    function setSupportedInterface(bytes4 interfaceId, bool supported) external {
        InterfaceDetectionStorage.layout().setSupportedInterface(interfaceId, supported);
    }
}
