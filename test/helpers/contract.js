const {ethers} = require('hardhat');

async function deployContract(name, args = []) {
  const contract = await (await ethers.getContractFactory(name)).deploy(...args);
  await contract.deployed();
  return contract;
}

module.exports = {
  deployContract,
};
