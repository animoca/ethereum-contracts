# Changelog

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
