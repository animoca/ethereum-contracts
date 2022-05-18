# Changelog

## 0.0.5

### Breaking changes

- Removed HardHat plugin `import-artifacts` in favor of `hardhat-deploy`'s `external` configuration.

### New features

- Added more ERC721 interfaces.
- Added the ERC1155 basic interfaces.

### Bugfixes

- Fix HardHat plugins import order to prevent `hardhat-ethers` to override functions provided by `hardhat-deploy-ethers`.

### Improvements

- Moved to `solc@0.8.14`.
- `runBehaviorTests`: Immutable tests are run only if there is an `immutable` section. Diamond tests will run only if there is a `diamond` section.

## 0.0.4

### Improvements

- Add debug artifacts.

## 0.0.4

- Initial release.
