// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {IERC20Detailed} from "./../interfaces/IERC20Detailed.sol";
import {StorageVersion} from "./../../../proxy/libraries/StorageVersion.sol";
import {InterfaceDetectionStorage} from "./../../../introspection/libraries/InterfaceDetectionStorage.sol";

library ERC20DetailedStorage {
    using InterfaceDetectionStorage for InterfaceDetectionStorage.Layout;

    struct Layout {
        string tokenName;
        string tokenSymbol;
        uint8 tokenDecimals;
    }

    bytes32 public constant ERC20DETAILED_STORAGE_POSITION = bytes32(uint256(keccak256("animoca.core.token.ERC20.ERC20Detailed.storage")) - 1);
    bytes32 public constant ERC20DETAILED_VERSION_SLOT = bytes32(uint256(keccak256("animoca.core.token.ERC20.ERC20Detailed.version")) - 1);

    /// @notice Initialises the storage with the token details.
    /// @notice Sets the ERC20Detailed storage version to `1`.
    /// @notice Marks the following ERC165 interface(s) as supported: ERC20Detailed.
    /// @dev Reverts if the ERC20Detailed storage is already initialized to version `1` or above.
    /// @param name_ The token name.
    /// @param symbol_ The token symbol.
    /// @param decimals_ The token decimals.
    function init(
        Layout storage s,
        string memory name_,
        string memory symbol_,
        uint8 decimals_
    ) internal {
        StorageVersion.setVersion(ERC20DETAILED_VERSION_SLOT, 1);
        s.tokenName = name_;
        s.tokenSymbol = symbol_;
        s.tokenDecimals = decimals_;
        InterfaceDetectionStorage.layout().setSupportedInterface(type(IERC20Detailed).interfaceId, true);
    }

    function name(Layout storage s) internal view returns (string memory) {
        return s.tokenName;
    }

    function symbol(Layout storage s) internal view returns (string memory) {
        return s.tokenSymbol;
    }

    function decimals(Layout storage s) internal view returns (uint8) {
        return s.tokenDecimals;
    }

    function layout() internal pure returns (Layout storage s) {
        bytes32 position = ERC20DETAILED_STORAGE_POSITION;
        assembly {
            s.slot := position
        }
    }
}
