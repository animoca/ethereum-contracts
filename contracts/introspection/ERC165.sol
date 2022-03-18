// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ERC165Base} from "./ERC165Base.sol";
import {LibInterfaceDetection} from "./libraries/LibInterfaceDetection.sol";

/**
 * @title ERC165 Interface Detection Standard (immutable version).
 * @dev This contract is to be used via inheritance in an immutable (non-proxied) implementation.
 */
abstract contract ERC165 is ERC165Base {
    constructor() {
        LibInterfaceDetection.initInterfaceDetectionStorage();
    }
}
