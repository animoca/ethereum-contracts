// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import {IERC1271} from "./../cryptography/interfaces/IERC1271.sol";
import {IERC1654} from "./../cryptography/interfaces/IERC1654.sol";
import {IERC2771} from "./../metatx/interfaces/IERC2771.sol";
import {IForwarderRegistry} from "./../metatx/interfaces/IForwarderRegistry.sol";
import {ERC2771Data} from "./libraries/ERC2771Data.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/// @title Universal Meta-Transactions Forwarder Registry.
/// @notice Users can allow specific forwarders to forward meta-transactions on their behalf.
/// @dev Derived from https://github.com/wighawag/universal-forwarder (MIT licence)
contract ForwarderRegistry is IERC2771, IForwarderRegistry {
    using Address for address;
    using ECDSA for bytes32;

    enum SignatureType {
        DIRECT,
        EIP1654,
        EIP1271
    }

    struct Forwarder {
        uint248 nonce;
        bool approved;
    }

    bytes4 internal constant ERC1271_MAGICVALUE = 0x20c13b0b;
    bytes4 internal constant ERC1654_MAGICVALUE = 0x1626ba7e;

    bytes32 internal constant EIP712DOMAIN_NAME = keccak256("ForwarderRegistry");
    bytes32 internal constant APPROVAL_TYPEHASH = keccak256("ApproveForwarder(address forwarder,bool approved,uint256 nonce)");

    mapping(address => mapping(address => Forwarder)) internal _forwarders;

    uint256 private immutable _deploymentChainId;
    bytes32 private immutable _deploymentDomainSeparator;

    /// @notice Emitted when a forwarder is approved or disapproved.
    /// @param signer The account for which `forwarder` is approved or disapproved.
    /// @param forwarder The account approved or disapproved as forwarder.
    /// @param approved True for an approval, false for a disapproval.
    /// @param nonce The `signer`'s account nonce before the approval change.
    event ForwarderApproved(address indexed signer, address indexed forwarder, bool approved, uint256 nonce);

    constructor() {
        uint256 chainId;
        //solhint-disable-next-line no-inline-assembly
        assembly {
            chainId := chainid()
        }
        _deploymentChainId = chainId;
        _deploymentDomainSeparator = _calculateDomainSeparator(chainId);
    }

    /// @notice Approves or disapproves a forwarder for the sender.
    /// @param forwarder The address of the forwarder to change the approval of.
    /// @param approved Whether to approve or disapprove (if previously approved) the forwarder.
    function approveForwarder(address forwarder, bool approved) external {
        address signer = msg.sender;
        Forwarder storage forwarderData = _forwarders[signer][forwarder];
        _approveForwarder(forwarderData, signer, forwarder, approved, forwarderData.nonce);
    }

    /// @notice Approves or disapproves a forwarder using EIP-2771 (msg.sender is the forwarder and the approval signer is appended to the calldata).
    /// @param approved Whether to approve or disapprove (if previously approved) the forwarder.
    /// @param signature Signature by signer for approving forwarder.
    /// @param signatureType The signature type.
    function approveForwarder(
        bool approved,
        bytes calldata signature,
        SignatureType signatureType
    ) external {
        address signer = ERC2771Data.msgSender();
        address forwarder = msg.sender;

        Forwarder storage forwarderData = _forwarders[signer][forwarder];
        uint256 nonce = uint256(forwarderData.nonce);

        _requireValidSignature(signer, forwarder, approved, nonce, signature, signatureType);
        _approveForwarder(forwarderData, signer, forwarder, approved, nonce);
    }

    /// @notice Forwards the meta-transaction (assuming the caller has been approved by the signer as a forwarder).
    /// @param target The destination of the call (that will receive the meta-transaction).
    /// @param data The content of the call (the signer address will be appended to it according to EIP-2771).
    function forward(address target, bytes calldata data) external payable {
        address signer = ERC2771Data.msgSender();
        require(_forwarders[signer][msg.sender].approved, "NOT_AUTHORIZED_FORWARDER");
        target.functionCallWithValue(abi.encodePacked(data, signer), msg.value);
    }

    /// @notice Approves the forwarder and forwards the meta-transaction.
    /// @param signature Signature by the signer for approving the forwarder.
    /// @param target The destination of the call (that will receive the meta-transaction).
    /// @param data The content of the call (the signer address will be appended to it according to EIP-2771).
    function approveAndForward(
        bytes calldata signature,
        SignatureType signatureType,
        address target,
        bytes calldata data
    ) external payable {
        address signer = ERC2771Data.msgSender();
        address forwarder = msg.sender;

        Forwarder storage forwarderData = _forwarders[signer][forwarder];
        uint256 nonce = uint256(forwarderData.nonce);

        _requireValidSignature(signer, forwarder, true, nonce, signature, signatureType);
        _approveForwarder(forwarderData, signer, forwarder, true, nonce);

        target.functionCallWithValue(abi.encodePacked(data, signer), msg.value);
    }

    /// @notice Checks the signed approval (but does not record it) and forwards the meta-transaction.
    /// @param signature Signature by the signer for approving the forwarder.
    /// @param target The destination of the call (that will receive the meta-transaction).
    /// @param data The content of the call (the signer address will be appended to it according to EIP-2771).
    function checkApprovalAndForward(
        bytes calldata signature,
        SignatureType signatureType,
        address target,
        bytes calldata data
    ) external payable {
        address signer = ERC2771Data.msgSender();
        address forwarder = msg.sender;
        _requireValidSignature(signer, forwarder, true, uint256(_forwarders[signer][forwarder].nonce), signature, signatureType);
        target.functionCallWithValue(abi.encodePacked(data, signer), msg.value);
    }

    /// @notice Gets the ERC1271 DOMAIN_SEPARATOR.
    /// @return domainSeparator The ERC1271 domain separator.
    // solhint-disable-next-line func-name-mixedcase
    function DOMAIN_SEPARATOR() external view returns (bytes32 domainSeparator) {
        return _DOMAIN_SEPARATOR();
    }

    /// @notice Gets the current nonce for the signer/forwarder pair.
    /// @param signer The signer account.
    /// @param forwarder The forwarder account.
    /// @return nonce The current nonce for the `signer`/`forwarder` pair.
    function getNonce(address signer, address forwarder) external view returns (uint256 nonce) {
        return uint256(_forwarders[signer][forwarder].nonce);
    }

    /// @inheritdoc IForwarderRegistry
    function isForwarderFor(address signer, address forwarder) external view override returns (bool) {
        return forwarder == address(this) || _forwarders[signer][forwarder].approved;
    }

    /// @inheritdoc IERC2771
    function isTrustedForwarder(address) external pure override returns (bool) {
        return true;
    }

    function _requireValidSignature(
        address signer,
        address forwarder,
        bool approved,
        uint256 nonce,
        bytes memory signature,
        SignatureType signatureType
    ) internal view {
        bytes memory data = abi.encodePacked("\x19\x01", _DOMAIN_SEPARATOR(), keccak256(abi.encode(APPROVAL_TYPEHASH, forwarder, approved, nonce)));
        if (signatureType == SignatureType.EIP1271) {
            require(IERC1271(signer).isValidSignature(data, signature) == ERC1271_MAGICVALUE, "SIGNATURE_1271_INVALID");
        } else if (signatureType == SignatureType.EIP1654) {
            require(IERC1654(signer).isValidSignature(keccak256(data), signature) == ERC1654_MAGICVALUE, "SIGNATURE_1654_INVALID");
        } else {
            address actualSigner = keccak256(data).recover(signature);
            require(signer == actualSigner, "SIGNATURE_WRONG_SIGNER");
        }
    }

    function _approveForwarder(
        Forwarder storage forwarderData,
        address signer,
        address forwarder,
        bool approved,
        uint256 nonce
    ) internal {
        forwarderData.approved = approved;
        unchecked {
            forwarderData.nonce = uint248(nonce + 1);
        }
        emit ForwarderApproved(signer, forwarder, approved, nonce);
    }

    // solhint-disable-next-line func-name-mixedcase
    function _DOMAIN_SEPARATOR() private view returns (bytes32) {
        uint256 chainId;
        //solhint-disable-next-line no-inline-assembly
        assembly {
            chainId := chainid()
        }

        // in case a fork happens, to support the chain that had to change its chainId, we compue the domain operator
        return chainId == _deploymentChainId ? _deploymentDomainSeparator : _calculateDomainSeparator(chainId);
    }

    function _calculateDomainSeparator(uint256 chainId) private view returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    keccak256("EIP712Domain(string name,uint256 chainId,address verifyingContract)"),
                    EIP712DOMAIN_NAME,
                    chainId,
                    address(this)
                )
            );
    }
}
