// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

library Address {
    /// @notice Checks if the address is a deployed smart contract.
    /// @param addr The address to check.
    /// @return hasBytecode True if `addr` is a deployed smart contract, false otherwise.
    function hasBytecode(address addr) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(addr)
        }
        return size != 0;
    }
}
