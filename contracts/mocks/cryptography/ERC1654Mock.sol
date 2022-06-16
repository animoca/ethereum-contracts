// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import {IERC1654} from "./../../cryptography/interfaces/IERC1654.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract ERC1654Mock is IERC1654 {
    using ECDSA for bytes32;

    address internal immutable _owner;

    constructor(address owner) {
        _owner = owner;
    }

    function isValidSignature(bytes32 hash, bytes memory signature) external view override returns (bytes4 magicValue) {
        address signer = hash.recover(signature);
        if (signer == _owner) {
            return 0x1626ba7e;
        } else {
            return 0xffffffff;
        }
    }
}
