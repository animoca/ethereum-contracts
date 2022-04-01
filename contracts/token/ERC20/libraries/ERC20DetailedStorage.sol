// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {IERC20Detailed} from "./../interfaces/IERC20Detailed.sol";
import {StorageVersion} from "./../../../proxy/libraries/StorageVersion.sol";
import {InterfaceDetectionStorage} from "./../../../introspection/libraries/InterfaceDetectionStorage.sol";

library ERC20DetailedStorage {
    using InterfaceDetectionStorage for InterfaceDetectionStorage.Layout;

    struct Layout {
        string name;
        string symbol;
        uint8 decimals;
    }

    bytes32 public constant ERC20DETAILED_STORAGE_POSITION = bytes32(uint256(keccak256("animoca.token.ERC20.ERC20Detailed.storage")) - 1);
    bytes32 public constant ERC20DETAILED_VERSION_SLOT = bytes32(uint256(keccak256("animoca.token.ERC20.ERC20Detailed.version")) - 1);

    /// @notice Initialises the storage with the token details.
    /// @notice Sets the ERC20Detailed storage version to `1`.
    /// @notice Marks the following ERC165 interface(s) as supported: ERC20Detailed.
    /// @dev Reverts if the ERC20Detailed storage is already initialized to version `1` or above.
    /// @param name The token name.
    /// @param symbol The token symbol.
    /// @param decimals The token decimals.
    function init(
        Layout storage s,
        string memory name,
        string memory symbol,
        uint8 decimals
    ) internal {
        StorageVersion.setVersion(ERC20DETAILED_VERSION_SLOT, 1);
        s.name = name;
        s.symbol = symbol;
        s.decimals = decimals;
        InterfaceDetectionStorage.layout().setSupportedInterface(type(IERC20Detailed).interfaceId, true);
    }

    function layout() internal pure returns (Layout storage s) {
        bytes32 position = ERC20DETAILED_STORAGE_POSITION;
        assembly {
            s.slot := position
        }
    }
}
