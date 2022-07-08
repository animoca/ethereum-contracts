// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

library SealsStorage {
    using SealsStorage for SealsStorage.Layout;

    struct Layout {
        mapping(uint256 => bool) seals;
    }

    bytes32 internal constant LAYOUT_STORAGE_SLOT = bytes32(uint256(keccak256("animoca.core.security.Seals.storage")) - 1);

    event Sealed(uint256 sealId, address sealer);

    function seal(
        Layout storage s,
        address sealer,
        uint256 sealId
    ) internal {
        require(!s.seals[sealId], "Seals: sealed");
        s.seals[sealId] = true;
        emit Sealed(sealId, sealer);
    }

    function isSealed(Layout storage s, uint256 sealId) internal view returns (bool) {
        return s.seals[sealId];
    }

    function layout() internal pure returns (Layout storage s) {
        bytes32 position = LAYOUT_STORAGE_SLOT;
        assembly {
            s.slot := position
        }
    }
}
