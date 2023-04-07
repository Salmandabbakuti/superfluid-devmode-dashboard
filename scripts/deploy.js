/*
* This script can only be run through Hardhat, and not through node directly.
* Since ethers or any other hardhat plugins are globally available to Hardhat Runtime Environment. So we are not importing them explicitly.
* So when running this script through node, we will get an error saying that ethers or any other plugins not defined error.
*/

async function main() {
  const contractFactory = await ethers.getContractFactory("Greeter");
  const contract = await contractFactory.deploy("Hello, Hardhat!");
  await contract.deployed();
  return contract;
}

main()
  .then(async (contract) => {
    console.log("Contract deployed at:", contract.address);
    // Write to contract
    const tx = await contract.setGreeting("Hello Ethereum Devs!");
    await tx.wait();
    // Read from contract
    const greeting = await contract.getGreeting();
    console.log('Greeting from contract:', greeting);
  })
  .catch((error) => {
    console.error(error);
  });
