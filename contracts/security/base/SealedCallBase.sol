// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {SealsStorage} from "./../libraries/SealsStorage.sol";
import {AccessControlStorage} from "./../../access/libraries/AccessControlStorage.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {SealsBase} from "./SealsBase.sol";

/// @title Sealead executions via calls on target contracts (proxiable version).
/// @notice Enables contract calls to be performed uniquely thanks to a seal identifier.
/// @notice Multiple executions can happen for example due to automation bugs in a backend or in a script.
/// @notice Typically, it can be a good practice to protect the minting of fungible tokens with an immutable seal identifier,
/// @notice such as a constant defined in a script or in a unique database field.
/// @dev This contract is to be used via inheritance in a proxied implementation.
/// @dev Note: This contract requires AccessControl.
abstract contract SealedCallBase is SealsBase {
    using SealsStorage for SealsStorage.Layout;
    using AccessControlStorage for AccessControlStorage.Layout;
    using Address for address;

    function sealedCall(
        address target,
        bytes calldata callData,
        uint256 sealId
    ) external returns (bytes memory returnData) {
        address sealer = _msgSender();
        AccessControlStorage.layout().enforceHasRole(SEALER_ROLE, sealer);
        SealsStorage.layout().seal(sealer, sealId);
        return target.functionCall(callData);
    }
}
