module.exports = {
  solidity: {
    compilers: [
      {
        version: '0.8.30',
        settings: {
          viaIR: true,
          optimizer: {
            enabled: true,
            runs: 99999,
          },
        },
      },
    ],
  },
};
