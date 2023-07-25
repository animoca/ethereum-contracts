// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {ITokenMetadataResolver} from "./interfaces/ITokenMetadataResolver.sol";
import {AccessControlCheck} from "./../../access/libraries/AccessControlCheck.sol";

/// @title TokenMetadataResolverPerToken.
/// @notice Token Metadata Resolver which stores the metadata URI for each token.
/// @notice Only minters of the target token contract can set the token metadata URI for this target contract.
contract TokenMetadataResolverPerToken is ITokenMetadataResolver {
    using AccessControlCheck for address;

    bytes32 public constant MINTER_ROLE = "minter";

    mapping(address => mapping(uint256 => string)) public metadataURI;

    /// @notice Thrown when the input arrays are of inconsistent lengths.
    error InconsistentArrays();

    /// @notice Sets the metadata URI for a token on a contract.
    /// @dev Reverts if the sender is not the owner of the token contract.
    /// @param tokenContract The token contract on which to set the token URI.
    /// @param tokenId The token identifier.
    /// @param tokenURI The token metadata URI.
    function setTokenURI(address tokenContract, uint256 tokenId, string calldata tokenURI) external {
        tokenContract.enforceHasTargetContractRole(MINTER_ROLE, msg.sender);
        metadataURI[tokenContract][tokenId] = tokenURI;
    }

    /// @notice Sets the metadata URIs for a batch of tokens on a contract.
    /// @dev Reverts if the arrays are of inconsistent lengths.
    /// @dev Reverts if the sender is not the owner of the token contract.
    /// @param tokenContract The token contract on which to set the token URI.
    /// @param tokenIds The token identifiers.
    /// @param tokenURIs The token metadata URIs.
    function batchSetTokenURI(address tokenContract, uint256[] calldata tokenIds, string[] calldata tokenURIs) external {
        uint256 length = tokenIds.length;
        if (length != tokenURIs.length) {
            revert InconsistentArrays();
        }
        tokenContract.enforceHasTargetContractRole(MINTER_ROLE, msg.sender);

        unchecked {
            for (uint256 i; i != length; ++i) {
                metadataURI[tokenContract][tokenIds[i]] = tokenURIs[i];
            }
        }
    }

    /// @notice Gets the token metadata URI for a token.
    /// @param tokenContract The token contract for which to retrieve the token URI.
    /// @param tokenId The token identifier.
    /// @return tokenURI The token metadata URI.
    function tokenMetadataURI(address tokenContract, uint256 tokenId) external view virtual override returns (string memory tokenURI) {
        return metadataURI[tokenContract][tokenId];
    }
}
