// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {IERC2981} from "./../interfaces/IERC2981.sol";
import {ProxyInitialization} from "./../../../proxy/libraries/ProxyInitialization.sol";
import {InterfaceDetectionStorage} from "./../../../introspection/libraries/InterfaceDetectionStorage.sol";

library ERC2981Storage {
    using ERC2981Storage for ERC2981Storage.Layout;
    using InterfaceDetectionStorage for InterfaceDetectionStorage.Layout;

    struct Layout {
        uint256 royaltyPercentage;
        address royaltyReceiver;
    }

    bytes32 internal constant LAYOUT_STORAGE_SLOT = bytes32(uint256(keccak256("animoca.token.ERC2981.storage")) - 1);

    error IncorrectRoyaltyPercentage(uint256 percentage);

    /// @notice Marks the following ERC165 interface(s) as supported: ERC2981.
    function init() internal {
        InterfaceDetectionStorage.layout().setSupportedInterface(type(IERC2981).interfaceId, true);
    }

    function setRoyaltyPercentage(uint256 percentage) internal {
        if (percentage > 100000) {
            revert IncorrectRoyaltyPercentage(percentage);
        }
        layout().royaltyPercentage = percentage;
    }

    /// @notice Called with the sale price to determine how much royalty is owed and to whom.
    /// @param tokenId The NFT asset queried for royalty information
    /// @param salePrice The sale price of the NFT asset specified by `tokenId`
    /// @return receiver Address of who should be sent the royalty payment
    /// @return royaltyAmount The royalty payment amount for `salePrice`
    function royaltyInfo(uint256 tokenId, uint256 salePrice) internal view returns (address receiver, uint256 royaltyAmount) {
        Layout storage l = layout();
        receiver = l.royaltyReceiver;
        uint256 royaltyPercentage = l.royaltyPercentage;
        if (salePrice == 0 || royaltyPercentage == 0) {
            royaltyAmount = 0;
        } else {
            if (salePrice < 100000) {
                royaltyAmount = (salePrice * royaltyPercentage) / 100000;
            } else {
                royaltyAmount = (salePrice / 1000000) * royaltyPercentage;
            }
        }
    }

    function layout() internal pure returns (Layout storage s) {
        bytes32 position = LAYOUT_STORAGE_SLOT;
        assembly {
            s.slot := position
        }
    }
}
