/*
* This script can only be run through Hardhat, and not through node directly.
* Since ethers or any other hardhat plugins are globally available to Hardhat Runtime Environment. So we are not importing them explicitly.
* So when running this script through node, we will get an error saying that ethers or any other plugins not defined error.
*/

const { expect } = require("chai");

describe("Contract Tests", function () {
  let accounts;
  let greeterContract;

  // `before` will run only once, useful for deploying the contract and use it on every test
  // It receives a callback, which can be async.
  before(async () => {
    // Get the ContractFactory and Signers here.
    const contractFactory = await ethers.getContractFactory("Greeter");
    accounts = await ethers.getSigners();
    // Deploy the contract specifying the constructor arguments
    greeterContract = await contractFactory.deploy("Hello, Hardhat!");
    await greeterContract.deployed();
  });

  it("Should return the new greeting once it's changed", async function () {
    expect(await greeterContract.getGreeting()).to.equal("Hello, Hardhat!");
    const setGreetingTx = await greeterContract.setGreeting("Hola, mundo!");
    // wait for the transaction to be mined
    await setGreetingTx.wait();
    expect(await greeterContract.getGreeting()).to.equal("Hola, mundo!");
  });
});
