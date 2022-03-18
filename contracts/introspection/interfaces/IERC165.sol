// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @dev ERC165 Interface Detection Standard.
 * @dev See https://eips.ethereum.org/EIPS/eip-165.
 * @dev Note: The ERC-165 identifier for this interface is 0xtodo.
 */
interface IERC165 {
    /**
     * Returns whether this contract implements the interface defined by `interfaceId`.
     * @dev Note: This function call must use less than 30 000 gas.
     * @param interfaceId the interface identifier to test.
     * @return true if the interface is supported, false if `interfaceId` is 0xffffffff or is the interface is not supported.
     */
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}
