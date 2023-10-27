module.exports = {
  mocha: {
    enableTimeouts: false,
    grep: '@skip-on-coverage', // Find everything with this tag
    invert: true, // Run the grep's inverse set.
  },
  skipFiles: [
    // TODO remove after solidity 0.8.22 is correctly supported
    'access/events/AccessControlEvents.sol',
    'access/events/ERC173Events.sol',
    'diamond/events/DiamondCutEvents.sol',
    'lifecycle/events/CheckpointsEvents.sol',
    'lifecycle/events/PauseEvents.sol',
    'payment/events/PayoutWalletEvents.sol',
    'proxy/events/ProxyAdminEvents.sol',
    'security/events/SealsEvents.sol',
    'token/ERC20/events/ERC20Events.sol',
    'token/ERC721/events/ERC721Events.sol',
    'token/ERC1155/events/ERC1155Events.sol',
  ],
};
