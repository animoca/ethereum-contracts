// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import {IERC20Permit} from "./../interfaces/IERC20Permit.sol";
import {StorageSlot} from "@openzeppelin/contracts/utils/StorageSlot.sol";
import {StorageVersion} from "./../../../proxy/libraries/StorageVersion.sol";
import {InterfaceDetectionStorage} from "./../../../introspection/libraries/InterfaceDetectionStorage.sol";
import {ERC20Storage} from "./ERC20Storage.sol";
import {ERC20DetailedStorage} from "./ERC20DetailedStorage.sol";

library ERC20PermitStorage {
    using InterfaceDetectionStorage for InterfaceDetectionStorage.Layout;
    using ERC20Storage for ERC20Storage.Layout;
    using ERC20DetailedStorage for ERC20DetailedStorage.Layout;

    struct Layout {
        mapping(address => uint256) accountNonces;
    }

    bytes32 public constant ERC20PERMIT_STORAGE_POSITION = bytes32(uint256(keccak256("animoca.core.token.ERC20.ERC20Permit.storage")) - 1);
    bytes32 public constant ERC20PERMIT_VERSION_SLOT = bytes32(uint256(keccak256("animoca.core.token.ERC20.ERC20Permit.version")) - 1);

    // 0x6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9
    bytes32 internal constant PERMIT_TYPEHASH = keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");

    /// @notice Initializes the storage.
    /// @dev Note: This function should be called ONLY in the constructor of an immutable (non-proxied) contract.
    /// @notice Marks the following ERC165 interface(s) as supported: ERC20Permit.
    function constructorInit() internal {
        InterfaceDetectionStorage.layout().setSupportedInterface(type(IERC20Permit).interfaceId, true);
    }

    /// @notice Initializes the storage.
    /// @notice Sets the ERC20Permit storage version to `1`.
    /// @notice Marks the following ERC165 interface(s) as supported: ERC20Permit.
    /// @dev Note: This function should be called ONLY in the init function of a proxied contract.
    /// @dev Reverts if the ERC20Permit storage is already initialized to version `1` or above.
    function proxyInit() internal {
        StorageVersion.setVersion(ERC20PERMIT_VERSION_SLOT, 1);
        InterfaceDetectionStorage.layout().setSupportedInterface(type(IERC20Permit).interfaceId, true);
    }

    function permit(
        Layout storage st,
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) internal {
        require(owner != address(0), "ERC20: zero address owner");
        require(block.timestamp <= deadline, "ERC20: expired permit");
        bytes32 hashStruct = keccak256(abi.encode(PERMIT_TYPEHASH, owner, spender, value, st.accountNonces[owner]++, deadline));
        bytes32 hash = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR(), hashStruct));
        address signer = ecrecover(hash, v, r, s);
        require(signer == owner, "ERC20: invalid permit");
        ERC20Storage.layout().approve(owner, spender, value);
    }

    function nonces(Layout storage s, address account) internal view returns (uint256) {
        return s.accountNonces[account];
    }

    // solhint-disable-next-line func-name-mixedcase
    function DOMAIN_SEPARATOR() internal view returns (bytes32) {
        uint256 chainId;
        assembly {
            chainId := chainid()
        }
        return
            keccak256(
                abi.encode(
                    keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                    keccak256(bytes(ERC20DetailedStorage.layout().name())),
                    keccak256("1"),
                    chainId,
                    address(this)
                )
            );
    }

    function layout() internal pure returns (Layout storage s) {
        bytes32 position = ERC20PERMIT_STORAGE_POSITION;
        assembly {
            s.slot := position
        }
    }
}
