// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

/// @dev Derived from https://github.com/OpenZeppelin/openzeppelin-contracts (MIT licence)
/// @dev See https://eips.ethereum.org/EIPS/eip-2771
library ERC2771Data {
    /// @notice Returns the sender address appended at the end of the calldata, as specified in ERC2771.
    function msgSender() internal pure returns (address sender) {
        assembly {
            sender := shr(96, calldataload(sub(calldatasize(), 20)))
        }
    }

    /// @notice Returns the calldata omitting the appended sender address, as specified in ERC2771.
    function msgData() internal pure returns (bytes calldata data) {
        return msg.data[:msg.data.length - 20];
    }
}
