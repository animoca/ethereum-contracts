// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {ITokenMetadataResolver} from "./interfaces/ITokenMetadataResolver.sol";
import {IERC677Receiver} from "./../../token/ERC20/interfaces/IERC677Receiver.sol";
import {ContractOwnershipStorage} from "./../../access/libraries/ContractOwnershipStorage.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {VRFV2WrapperConsumerBase} from "@chainlink/contracts/src/v0.8/VRFV2WrapperConsumerBase.sol";

/// @title TokenMetadataResolverRandomizedReveal.
/// @notice Token Metadata Resolver with a reveal mechanism.
/// @notice Before reveal, all the tokens have the same metadata URI. After reveal tokens have individual metadata URIs based on a random offset.
/// @notice This resolver is designed to work with incremental token IDs NFTs starting at 0 and a fixed token supply.
contract TokenMetadataResolverRandomizedReveal is ITokenMetadataResolver, IERC677Receiver, VRFV2WrapperConsumerBase {
    using ContractOwnershipStorage for address;
    using Strings for uint256;

    enum RevealStatus {
        NotRequested,
        Requested,
        Revealed
    }

    mapping(address => string) public preRevealTokenMetadataURI; // tokenContract => pre-reveal token metadata URI
    mapping(address => string) public postRevealBaseMetadataURI; // tokenContract => post-reveal base metadata URI
    mapping(address => uint256) public tokenSupply; // tokenContract => token supply
    mapping(address => RevealStatus) public revealStatus; // tokenContract => reveal status
    mapping(address => uint256) public metadataOffset; // tokenContract => metadata offset
    mapping(uint256 => address) public requestIdToTokenContract; // requestId => tokenContract

    /// @notice Emitted when the token data is set.
    /// @param tokenContract The token contract on which the base metadata URI was set.
    /// @param preRevealTokenMetadataURI The pre-reveal token metadata URI.
    /// @param postRevealBaseMetadataURI The post-reveal base metadata URI.
    /// @param tokenSupply The token supply.
    event TokenDataSet(address tokenContract, string preRevealTokenMetadataURI, string postRevealBaseMetadataURI, uint256 tokenSupply);

    /// @notice Emitted when a request to reveal tokens is made.
    /// @param tokenContract The token contract on which the tokens are requested to reveal.
    /// @param requestId The ChainLink VRF request ID.
    event RevealRequested(address tokenContract, uint256 requestId);

    /// @notice Emitted when the tokens are revealed.
    /// @param tokenContract The token contract on which the tokens are revealed.
    /// @param requestId The ChainLink VRF request ID.
    /// @param metadataOffset The random metadata offset.
    event TokensRevealed(address tokenContract, uint256 requestId, uint256 metadataOffset);

    /// @notice Thrown when trying to set an empty pre-reveal token metadata URI.
    /// @param tokenContract The token contract which data is being set.
    error EmptyPreRevealTokenMetadataURI(address tokenContract);

    /// @notice Thrown when trying to set an empty post-reveal base metadata URI.
    /// @param tokenContract The token contract which data is being set.
    error EmptyPostRevealBaseMetadataURI(address tokenContract);

    /// @notice Thrown when setting token data with a zero token supply.
    /// @param tokenContract The token contract which data is being set.
    error ZeroTokenSupply(address tokenContract);

    /// @notice Thrown when requesting to reveal tokens but the token data is not set.
    /// @param tokenContract The token contract on which is being requested to reveal.
    error TokenDataNotSet(address tokenContract);

    /// @notice Thrown when trying to set the metadata for a token which has already been requested to reveal.
    /// @param tokenContract The token contract which is already requested to reveal.
    error RevealAlreadyRequested(address tokenContract);

    /// @notice Emitted when trying to reveal a token which is already revealed.
    /// @param tokenContract The token contract which is already revealed.
    error TokensAlreadyRevealed(address tokenContract);

    /// @notice Thrown when trying to call the `onTokenTransfer` function but the sender is not the LINK token contract.
    error WrongLINKTokenAddress(address wrongAddress);

    /// @notice Thrown when trying to fulfill a randomness request with a wrong request ID (ie. not associated to a token contract).
    /// @param requestId The request ID.
    error UnknownRequestId(uint256 requestId);

    constructor(address linkToken, address vrfWrapper) VRFV2WrapperConsumerBase(linkToken, vrfWrapper) {}

    /// @notice Sets the metadata URIs and the token supply for a token contract.
    /// @dev Reverts with {EmptyPreRevealTokenMetadataURI} if the pre-reveal token metadata URI is empty.
    /// @dev Reverts with {EmptyPostRevealBaseMetadataURIs} if the post-reveal base metadata URI is empty.
    /// @dev Reverts with {ZeroTokenSupply} if the token supply is 0.
    /// @dev Reverts with {NotTargetContractOwner} if the sender is not the owner of the token contract.
    /// @dev Reverts with {RevealAlreadyRequested} if reveal has already been requested.
    /// @dev Emits a {TokenDataSet} event.
    /// @param tokenContract The token contract on which to set the base metadata URI.
    /// @param preRevealTokenURI The pre-reveal token metadata URI.
    /// @param postRevealBaseURI The post-reveal base metadata URI.
    /// @param supply The token supply.
    function setTokenData(address tokenContract, string calldata preRevealTokenURI, string calldata postRevealBaseURI, uint256 supply) external {
        if (bytes(preRevealTokenURI).length == 0) revert EmptyPreRevealTokenMetadataURI(tokenContract);
        if (bytes(postRevealBaseURI).length == 0) revert EmptyPostRevealBaseMetadataURI(tokenContract);
        if (supply == 0) revert ZeroTokenSupply(tokenContract);
        tokenContract.enforceIsTargetContractOwner(msg.sender);
        if (revealStatus[tokenContract] != RevealStatus.NotRequested) revert RevealAlreadyRequested(tokenContract);
        preRevealTokenMetadataURI[tokenContract] = preRevealTokenURI;
        postRevealBaseMetadataURI[tokenContract] = postRevealBaseURI;
        tokenSupply[tokenContract] = supply;
        emit TokenDataSet(tokenContract, preRevealTokenURI, postRevealBaseURI, supply);
    }

    /// @notice Requests to switch the base metadata URI to the post-reveal URI while applying a fixed random offset to the metadata token ID URI.
    /// @notice This function is called externally ans requires prior approval of LINK token to be transferred from the sender.
    /// @notice The amount of LINK token to be approved must be at least the request price found by `VRF_V2_WRAPPER.estimateRequestPrice`.
    /// @dev Reverts with {NotTargetContractOwner} if thew sender is not the owner of the token contract.
    /// @dev Reverts with {TokenDataNotSet} if the token data has not been set yet.
    /// @dev Reverts with {TokensAlreadyRevealed} if the tokens have already been revealed.
    /// @dev Emits a {RevealRequested} event.
    /// @param tokenContract The token contract for which to reveal the tokens.
    /// @param callbackGasLimit The gas limit to set for the VRF V2 wrapper callback.
    /// @param requestConfirmations The number of confirmations to wait before fulfilling the request.
    function requestReveal(address tokenContract, uint32 callbackGasLimit, uint16 requestConfirmations) external {
        LINK.transferFrom(msg.sender, address(this), VRF_V2_WRAPPER.calculateRequestPrice(callbackGasLimit));
        _requestReveal(msg.sender, tokenContract, callbackGasLimit, requestConfirmations);
    }

    /// @notice Requests to switch the base metadata URI to the post-reveal URI while applying a fixed random offset to the metadata token ID URI.
    /// @notice This function is called by the LINK token contract when using the `transferAndCall` function targeting this contract.
    /// @notice The amount parameter of the `transferAndCall` function must equal the request price found by `VRF_V2_WRAPPER.estimateRequestPrice`.
    /// @dev Reverts with {WrongLINKTokenAddress} if the sender is not the LINK token contract.
    /// @dev Reverts with {NotTargetContractOwner} if `from` is not the owner of the token contract.
    /// @dev Reverts with {TokenDataNotSet} if the token data has not been set yet.
    /// @dev Reverts with {TokensAlreadyRevealed} if the tokens have already been revealed.
    /// @dev Emits a {RevealRequested} event.
    /// @param from The LINK token owner.
    /// @param data The data passed to the `transferAndCall` function.
    function onTokenTransfer(address from, uint256, bytes calldata data) external returns (bool) {
        if (msg.sender != address(LINK)) revert WrongLINKTokenAddress(msg.sender);
        (address tokenContract, uint32 callbackGasLimit, uint16 requestConfirmations) = abi.decode(data, (address, uint32, uint16));
        _requestReveal(from, tokenContract, callbackGasLimit, requestConfirmations);
        return true;
    }

    /// @inheritdoc ITokenMetadataResolver
    function tokenMetadataURI(address tokenContract, uint256 tokenId) external view returns (string memory tokenURI) {
        if (revealStatus[tokenContract] == RevealStatus.Revealed) {
            uint256 metadataId = (tokenId + metadataOffset[tokenContract]) % tokenSupply[tokenContract];
            return string(abi.encodePacked(postRevealBaseMetadataURI[tokenContract], metadataId.toString()));
        } else {
            return preRevealTokenMetadataURI[tokenContract];
        }
    }

    /// @notice Requests to switch the base metadata URI to the post-reveal URI while applying a fixed random offset to the metadata token ID URI.
    /// @dev Reverts with {NotTargetContractOwner} if `operator` is not the owner of the token contract.
    /// @dev Reverts with {TokenDataNotSet} if the token data has not been set yet.
    /// @dev Reverts with {TokensAlreadyRevealed} if the tokens have already been revealed.
    /// @dev Emits a {RevealRequested} event.
    /// @param operator The operator requesting the revelation.
    /// @param tokenContract The token contract on which to set the base metadata URI.
    /// @param callbackGasLimit The gas limit to set for the VRF V2 wrapper callback.
    /// @param requestConfirmations The number of confirmations to wait before fulfilling the request.
    function _requestReveal(address operator, address tokenContract, uint32 callbackGasLimit, uint16 requestConfirmations) internal {
        tokenContract.enforceIsTargetContractOwner(operator);
        if (tokenSupply[tokenContract] == 0) revert TokenDataNotSet(tokenContract);
        if (revealStatus[tokenContract] == RevealStatus.Revealed) revert TokensAlreadyRevealed(tokenContract);
        uint256 requestId = requestRandomness(callbackGasLimit, requestConfirmations, 1);
        requestIdToTokenContract[requestId] = tokenContract;
        revealStatus[tokenContract] = RevealStatus.Requested;
        emit RevealRequested(tokenContract, requestId);
    }

    /// @notice Callback function called by the VRF V2 wrapper when the randomness is received. Applies the random offset.
    /// @dev Reverts with {UnknownRequestId} if the request ID is not associated to a token contract.
    /// @dev Reverts with {TokensAlreadyRevealed} if the tokens have already been revealed.
    /// @dev Emits a {TokensRevealed} event.
    /// @param requestId The ChainLink VRF request ID.
    /// @param randomWords The randomness result.
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal virtual override {
        address tokenContract = requestIdToTokenContract[requestId];
        if (tokenContract == address(0)) revert UnknownRequestId(requestId);
        delete requestIdToTokenContract[requestId];
        if (revealStatus[tokenContract] == RevealStatus.Revealed) revert TokensAlreadyRevealed(tokenContract);
        uint256 offset = randomWords[0] % tokenSupply[tokenContract];
        metadataOffset[tokenContract] = offset;
        revealStatus[tokenContract] = RevealStatus.Revealed;
        emit TokensRevealed(tokenContract, requestId, offset);
    }
}
