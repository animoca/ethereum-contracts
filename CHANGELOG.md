# Changelog

## 0.0.5

### Breaking changes

- Removed HardHat plugin `import-artifacts` in favor of `hardhat-deploy`'s `external` configuration.
- Renamed `ERC165` contracts to `InterfaceDetection`.
- Renamed `Ownable` contracts to `ContractOwnership`.
- Renamed `Recoverable` contracts to `TokenRecovery`.
- Renamed `Pausable` contracts to `Pause`.
- Used `animoca.core.` convention for storage slots.
- Normalised value of `PROXYADMIN_VERSION_SLOT` to follow convention.

### New features

- Added contract `ERC20Receiver.sol`.
- Added the function `recoverETH` in `TokenRecovery`.
- Added more ERC721 interfaces.
- Added the ERC1155 basic interfaces.

### Bugfixes

- Fixed HardHat plugins import order to prevent `hardhat-ethers` to override functions provided by `hardhat-deploy-ethers`.
- Added missing `forwarderRegistry()` getter in `ForwarderRegistryContext.sol`.

### Improvements

- Moved to `solc@0.8.14`.
- Removed initialization function in `InterfaceDetectionStorage.sol`.
- `runBehaviorTests`: Immutable tests are run only if there is an `immutable` section. Diamond tests will run only if there is a `diamond` section.
- Added all getters logic in storage libraries.
- Splitted the storage initialisation logic between immutable and proxied version for optimisation.
- Improved README.

## 0.0.4

### Improvements

- Add debug artifacts.

## 0.0.4

- Initial release.
