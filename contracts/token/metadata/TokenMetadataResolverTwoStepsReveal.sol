// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {ITokenMetadataResolver} from "./interfaces/ITokenMetadataResolver.sol";
import {ContractOwnershipStorage} from "./../../access/libraries/ContractOwnershipStorage.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/// @title TokenMetadataResolverTwoStepsReveal.
/// @notice Token Metadata Resolver which uses two base metadata URIs, one for pre-reveal and one for post-reveal.
/// @notice At reveal phase, the base metadat URI will be switched from pre-reveal to post-reveal.
/// @notice Only the owner of the target token contract can set the base metadata URI for this target contract.
contract TokenMetadataResolverTwoStepsReveal is ITokenMetadataResolver {
    using ContractOwnershipStorage for address;
    using Strings for uint256;

    mapping(address => bool) public isTokenRevealed;
    mapping(address => string) public preRevealBaseMetadataURI;
    mapping(address => string) public postRevealBaseMetadataURI;

    /// @notice Emitted when the base metadata URI is set.
    /// @param tokenContract The token contract on which the base metadata URI was set.
    /// @param preRevealBaseMetadataURI The pre-reveal base metadata URI.
    /// @param postRevealBaseMetadataURI The post-reveal base metadata URI.
    event BaseMetadataURIsSet(address tokenContract, string preRevealBaseMetadataURI, string postRevealBaseMetadataURI);

    /// @notice Emitted when the tokens are revealed.
    /// @param tokenContract The token contract on which the tokens are revealed.
    event TokensRevealed(address tokenContract);

    /// @notice Thrown when trying to set the base metadata URIs but one of them is empty.
    /// @param tokenContract The token contract on which the base metadata URIs are set.
    /// @param preRevealBaseMetadataURI The pre-reveal base metadata URI.
    /// @param postRevealBaseMetadataURI The post-reveal base metadata URI.
    error EmptyBaseMetadataURIs(address tokenContract, string preRevealBaseMetadataURI, string postRevealBaseMetadataURI);

    /// @notice Thrown when trying to set the base metadata URIs but they are already set.
    /// @param tokenContract The token contract on which the base metadata URIs are already set.
    error BaseMetadataURIsAlreadySet(address tokenContract);

    /// @notice Thrown when trying to reveal tokens but the base metadata URIs are not set.
    /// @param tokenContract The token contract on which the base metadata URIs are not set.
    error BaseMetadataURIsNotSet(address tokenContract);

    /// @notice Emitted when trying to reveal a token which is already revealed.
    /// @param tokenContract The token contract which is already revealed.
    error TokensAlreadyRevealed(address tokenContract);

    /// @notice Sets the base metadata URIs for both pre-reveal and post-reveal.
    /// @dev Note: This function should
    /// @dev Reverts with {EmptyBaseMetadataURIs} if one of the URIs is empty.
    /// @dev Reverts with {NotTargetContractOwner} if the sender is not the owner of the token contract.
    /// @dev Reverts with {BaseMetadataURIsAlreadySet} if the URIs have been previously set.
    /// @dev Emits a {BaseMetadataURIsSet} event.
    /// @param tokenContract The token contract on which to set the base metadata URI.
    /// @param preRevealBaseURI The pre-reveal base metadata URI.
    /// @param postRevealBaseURI The post-reveal base metadata URI.
    function setBaseMetadataURIs(address tokenContract, string calldata preRevealBaseURI, string calldata postRevealBaseURI) external {
        if (bytes(preRevealBaseURI).length == 0 || bytes(postRevealBaseURI).length == 0)
            revert EmptyBaseMetadataURIs(tokenContract, preRevealBaseURI, postRevealBaseURI);
        tokenContract.enforceIsTargetContractOwner(msg.sender);
        if (bytes(preRevealBaseMetadataURI[tokenContract]).length != 0) revert BaseMetadataURIsAlreadySet(tokenContract);
        preRevealBaseMetadataURI[tokenContract] = preRevealBaseURI;
        postRevealBaseMetadataURI[tokenContract] = postRevealBaseURI;
        emit BaseMetadataURIsSet(tokenContract, preRevealBaseURI, postRevealBaseURI);
    }

    /// @notice Switches the base metadata URI to the post-reveal URI.
    /// @dev Reverts with {NotTargetContractOwner} if the sender is not the owner of the token contract.
    /// @dev Reverts with {BaseMetadataURIsNotSet} if the URIs have not been set yet.
    /// @dev Reverts with {TokensAlreadyRevealed} if this function has already been called before.
    /// @param tokenContract The token contract on which to set the base metadata URI.
    function revealTokens(address tokenContract) external {
        tokenContract.enforceIsTargetContractOwner(msg.sender);
        if (bytes(preRevealBaseMetadataURI[tokenContract]).length == 0) revert BaseMetadataURIsNotSet(tokenContract);
        if (isTokenRevealed[tokenContract]) revert TokensAlreadyRevealed(tokenContract);
        isTokenRevealed[tokenContract] = true;
        emit TokensRevealed(tokenContract);
    }

    /// @notice Gets the token metadata URI for a token as the concatenation of the base metadata URI and the token identifier.
    /// @param tokenContract The token contract for which to retrieve the token URI.
    /// @param tokenId The token identifier.
    /// @return tokenURI The token metadata URI as the concatenation of the base metadata URI and the token identifier.
    function tokenMetadataURI(address tokenContract, uint256 tokenId) external view returns (string memory tokenURI) {
        if (isTokenRevealed[tokenContract]) {
            return string(abi.encodePacked(postRevealBaseMetadataURI[tokenContract], tokenId.toString()));
        } else {
            return string(abi.encodePacked(preRevealBaseMetadataURI[tokenContract], tokenId.toString()));
        }
    }
}
