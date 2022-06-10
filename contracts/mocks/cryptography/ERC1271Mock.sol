// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import {IERC1271} from "./../../cryptography/interfaces/IERC1271.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract ERC1271Mock is IERC1271 {
    using ECDSA for bytes32;

    address internal immutable _owner;

    constructor(address owner) {
        _owner = owner;
    }

    function isValidSignature(bytes calldata data, bytes memory signature) external view override returns (bytes4 magicValue) {
        address signer = keccak256(data).recover(signature);
        if (signer == _owner) {
            return 0x20c13b0b;
        } else {
            return 0xffffffff;
        }
    }
}
