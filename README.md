# hardhat-boilerplate

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, a sample script that deploys that contract, and an example of a task implementation, which simply lists the available accounts with balances.

> Recommended to use Node.js v14+ and npm v7+.

Try running some of the following tasks:

```shell
npm install

# starts local node
npx hardhat node

# compile contracts
npx hardhat compile

# deploy contract defined in tasks on specified network
npx hardhat deploy --network local

# deploy contract in scripts/deploy.js on specified network
npx hardhat run scripts/deploy.js --network local

# unit tests
npx hardhat test

# remove all compiled and deployed artifacts
npx hardhat clean

# show help
npx hardhat help
```
