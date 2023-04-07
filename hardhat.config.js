require('@nomicfoundation/hardhat-toolbox');

task("deploy", "Deploys Contract", async () => {
  const contractFactory = await ethers.getContractFactory("Greeter");
  const contract = await contractFactory.deploy("Hello, Hardhat!");
  await contract.deployed();
  console.log("contract deployed at:", contract.address);
});


module.exports = {
  solidity: "0.8.16",
  // defaultNetwork: "local",
  // networks: {
  //   local: {
  //     url: "http://127.0.0.1:8545",
  //   }
  // }
};