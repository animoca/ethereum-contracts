# Changelog

## 4.2.2

### Bugfixes

- Fixed a bug where totalStaked was incorrectly computed during withdrawal in LinearPool.
- Prevented rewards dilution when adding rewards in LinearPool as it could be unfair to stakers.
- Moved reentrancy guards to internal functions and kept the guards active in deriving contract for linear staking contracts.

### Improvements

- Improved documentation and fixed typos in linear staking contracts.

## 4.2.1

### Improvements

- Added `TokenRecovery` to linear staking contracts.
- Added inline documentation to linear staking contracts.

## 4.2.0

### New features

- Added linear reward pool staking contracts.

## 4.1.3

### Bugfixes

- Downgraded to `chai@4` due to incompatibility with hardhat.
- Added package `resolutions` for `@ethersproject/**@5`, `elliptic`, `@openzeppelin/contracts`, `@openzeppelin/contracts-upgradeable`, `axios` and `cookie` to fix security issues in transitive dependencies.

## 4.1.2

### Bugfixes

- Use `solc@0.8.28` for non-deployable solidity code.

## 4.1.1

### Bugfixes

- ERC20 test bugfix.

## 4.1.0

### New features

- Moved the core logic of `TokenRecoveryBase` in new `TokenRecoveryLibrary` so it can be used with different access controls.
- Added `ITokenRecovery` interface.

## 4.0.0

### Breaking changes

- Updated `ForwarderRegistry` so that forwarder approvals are set per meta-tx target contract instead of globally.
- Replaced `ForwarderRegistry`.`removeForwarderApproval` function with `ForwarderRegistry`.`setForwarderApproval`.
- Upgraded to `solc@0.8.28`.
- Upgraded to `openzeppelin/contracts@5.2.0`.
- Upgraded to new Node version.

### New features

- Added `SafeContractOwnership` which requires the new owner to accept the ownership before it is transferred.
- Added `abis.js` to conveniently import ABIs of this library's contracts.
- Added `Address` library to replace removed feature from openzeppelin.

### Bugfixes

- Fixed a bug in `TokenRecovery` which allowed to transfer ERC20 tokens through `recoverERC721s` function.

### Improvements

- Updated dependencies versions.

## 3.0.0

### New features

- Added preset ERC721 contracts `ERC721Full`, `ERC721FullBurn` and `ERC721FullMintOnceBurn` (and their proxied versions).
- Added preset ERC1155 contracts `ERC1155Full` and `ERC1155FullBurn` (and their proxied versions).
- Token metadata for ERC721 and ERC1155 are now handled through an external resolver contract whose reference is set at construction time. For this feature, added contracts `ITokenMetadataResolver`, `TokenMetadataStorage`, `TokenMetadataBase` and several resolver implementations. The logic for ERC721 and ERC1155 is implemented in new `ERC721MetadataBase`/`ERC721MetadataFacet`/`ERC721Metadata` and `ER1155MetadataBase`/`ERC1155MetadataFacet`/`ERC1155Metadata` contracts respectively.
- Added new metadata scheme with `TokenMetadataResolverRandomizedReveal`.
- ERC1155 contracts now support `name()` and `symbol()` as part of their metadata implementation.
- Added contract interfaces `IAccessControl`, `IPause`, `ICheckpoints`, `IPayoutWallet`, `IProxyAdmin` and `ISeals`.
- Added functions in contract libraries `ContractOwnershipStorage` and `AccessControlStorage` to facilitate the retrieval of access-control information from external contracts.
- Added `ERC677Mock`.

### Breaking changes

- Moved all contracts events definitions to dedicated files (see `events` subfolders).
- Changed all legacy contracts errors to custom errors (see `errors` subfolders).
- Moved diamond struct and enum definitions to `DiamondCommon`.
- Removed all previous `ERC721MetadataXXX` contracts.
- Removed all previous `ERC1155MetadataXXX` contracts.
- Removed contracts `ERC721SimpleMock`, `ERC721WithOperatorFiltererMock`, `ERC721Mock`, `ERC721MintableOnceMock`, `ERC721MetadataPerTokenMock` and `ERC721BurnableMock`.
- Removed contracts `ERC1155SimpleMock`, `ERC1155WithOperatorFiltererMock`, `ERC1155Mock`, `ERC1155MetadataURIPerTokenMock` and `ERC1155BurnableMock` (and their proxied counterparts).
- Removed `ERC2981Mock`.
- Upgraded to `solc@0.8.22`.
- Upgraded to `ethers6`.

### Improvements

- Removed events duplication in storage libraries and use events from interfaces instead.
- Changed `TokenRecovery` functions from `external` to `public` to allow calling them from overriding implementations.
- Updated dependencies versions.

## 2.0.0

### New features

- Added preset ERC20 contracts `ERC20FixedSupply` and `ERC20MintBurn` (and their proxied versions).

### Breaking changes

- Removed `ERC20SimpleMock`, `ERC20Mock` and `ERC20BurnableMock`.
- Upgraded to `@openzeppelin/contracts@4.9.2`.
- Upgraded to `solc@0.8.19`.

### Improvements

- Updated to latest dependencies.

## 1.1.1

### Bugfixes

- Fix dependabot security alerts.
- Update to latest dependencies.

## 1.1.0

### New features

- `CumulativeMerkleClaim`: a contract to manage payouts which accumulate over time.

## 1.0.0

### Breaking changes

- Move helpers to `@animoca/ethereum-contract-helpers`.

### Improvements

- Fix versioning rules.
- Update dependencies.

## 0.3.4

### Improvements

- Do not include audit reports in the node package.

## 0.3.3

### Improvements

- Updated to latest dependencies.

## 0.3.2

### Bugfixes

- Fixed bugs when using yarn v2 or above.

## 0.3.1

### New features

- Added support for ERC2981 royalty standard.
- Added support for token OperatorFilterer for ERC721 and ERC1155.

## 0.3.0

### Breaking changes

- Upgraded to `@openzeppelin/contracts@4.8.0`.
- Changed the approval typehash of `ForwarderRegistry`.

## 0.2.0

### Breaking changes

- Removed arguments from constructor/init for `ERC20`, `TokenMetadataWithBaseURI` and `Checkpoints`.

### Improvements

- Use calldata instead memory some libraries functions.

## 0.1.1

### Improvements

- Revert calldata usage in some token libraries functions.

## 0.1.0

### Breaking changes

- Upgraded to `solc@0.8.17`.
- Upgraded to `@openzeppelin/contracts@4.7.0`.
- Made `ERC20` and `ERC721` contracts abstract.
- Removed `ERC20Wrapper` in favor of openzeppelin's `SafeERC20`.
- Restructured `contracts` folder with subfolders `base` and `facets`.
- Renamed `IDiamondCutBase` to `IDiamondCutCommon`.
- Changed ACL from contract owner to minter for `TokenMetadataPerToken` admin functions in ERC721.
- Reworked `ForwarderRegistry`'s interfaces.
- Removed `ERC1654`-related contracts and features as EIP-1271 became final.
- Removed `time.js` test hepers in favor of new `@nomicfoundation/hardhat-network-helpers`.
- Removed plugin `waffle-tests`, now using `@nomicfoundation/hardhat-chai-matchers`.

### New features

- Added support for ERC1155.
- Added `MultiStaticCall`.
- Added `wasBurnt(uint256)` function to ERC721MintableOnce.
- Added `ERC721Deliverable`.
- Added `Seals`-related contracts.
- Added support for testing proxied contracts (behind an `OptimizedTransparentUpgradeableProxy`).

### Bugfixes

- Fixed a bug in ERC1155 transfers which caused a wrong balance for a transfer recipient.
- Fixed a bug in ForwarderRegistry which caused possible approval replay attacks on ERC1271 wallets.
- Fixed ERC721Storage `mint`, `batchMint` and `safeMint` which did not allow re-minting after burning.
- Fixed ERC721 transfer and burning tests which were not correctly testing transactions initiated by different recipients.
- Immutable mock implementations now correctly inherit from `ForwarderRegistryContext` instead of `ForwarderRegistryContextBase`.
- Fixed `memory`/`calldata` usage in ERC20 and ERC721 implementations.

### Improvements

- Improved calldata usage in some token libraries functions.
- Improved ERC721 implementation.
- Improved ERC721 tests.
- Improved ERC20 and ERC721 comments coverage.

## 0.0.5

### Breaking changes

#### Solidity

- Upgraded to `solc@0.8.14`.
- Renamed `ERC165` contracts to `InterfaceDetection`.
- Renamed `Ownable` contracts to `ContractOwnership`.
- Renamed `Recoverable` contracts to `TokenRecovery`.
- Renamed `Pausable` contracts to `Pause`.
- Renamed `StorageVersion` to `ProxyInitialization` and `setVersion` to `setPhase`.
- Used `animoca.core.` convention for storage slots.

#### Tools

- Removed HardHat plugin `import-artifacts` in favor of `hardhat-deploy`'s `external` configuration.
- Removed HardHat plugin `solidity-docgen` in favor of the plugin now provided by `solidity-docgen@0.6`.
- Removed HardHat plugin `gas-reporter-skips` in favor of using configurations.
- Removed HardHat plugin `solidity-coverage` in favor of using configurations.

### New features

- Added support for ERC721.
- Added contract `ERC20Receiver.sol`.
- Added the function `recoverETH` in `TokenRecovery`.
- Added more ERC721 interfaces.
- Added the ERC1155 basic interfaces.

### Bugfixes

#### Solidity

- Fixed a bug in `DiamondStorage.sol` which did not properly rethrow custom errors during initialization calls.
- Added missing `forwarderRegistry()` getter in `ForwarderRegistryContext.sol`.

#### Tools

- Fixed HardHat plugins import order to prevent `hardhat-ethers` to override functions provided by `hardhat-deploy-ethers`.
- Fixed a bug in `createFixtureLoader`.

### Improvements

#### Solidity

- Removed initialization function in `InterfaceDetectionStorage.sol`.
- Optimised Diamond implementation.
- Added all getters logic in storage libraries.
- Splitted the storage initialization logic between immutable and proxied version for optimisation.
- Expanded `unchecked` blocks to include the for loops increments in `ERC20Storage.sol`.
- Improved in-line comments.

##### Tools

- `runBehaviorTests`: Immutable tests are run only if there is an `immutable` section. Diamond tests will run only if there is a `diamond` section.
- Prepared test execution tools for gracefully handling solidity custom errors.
- Improved README.

## 0.0.4

### Improvements

- Add debug artifacts.

## 0.0.4

- Initial release.
