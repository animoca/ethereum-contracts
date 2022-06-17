# Changelog

## 0.1.1

### New features

- Added support for ERC1155.

## 0.1.0

### Breaking changes

- Upgraded to `solc@0.8.15`.
- Made `ERC20` and `ERC721` contracts abstract.
- Restructured `contracts` folder with subfolders `base` and `facets`.
- Renamed `IDiamondCutBase` to `IDiamondCutCommon`.

### New features

- Added `wasBurnt(uint256)` function to ERC721MintableOnce.
- Added `ERC721Deliverable`.

### Bugfixes

- Fixed ERC721Storage `mint`, `batchMint` and `safeMint` which did not allow re-minting after burning.
- Fixed ERC721 transfer and burning tests which were not correctly testing transactions initiated by different recipients.
- Immutable mock implementations now correctly inherit from `ForwarderRegistryContext` instead of `ForwarderRegistryContextBase`.
- Fixed `memory`/`calldata` usage in ERC20 and ERC721 implementations.

### Improvements

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
