# Superfluid Developer-Mode Dashboard: WIP

> Terminal != Dashboard

> A dashboard is a way of displaying various types of visual data in one place. Usually, a dashboard is intended to convey different, but related information in an easy-to-digest form. A dashboard is often called a control panel, but the terms are interchangeable.

>

The Superfluid Developer-Mode Dashboard is a fullstack application that allows developers to create, update, and delete streams on their local Superfluid instance. The dashboard is designed to be easy to use and can be quickly set up to connect to your local blockchain where Superfluid is deployed. The dashboard provides a centralized location for users to manage all of their streams, view important details, and perform actions on them.

### Features

The Developer-Mode Dashboard for Superfluid comes with the following features:

1. Create new streams: You can create new streams on your local Superfluid instance by specifying the token, recipient, and flow rate. The flow rate is specified in the format "tokens per month," which is more user-friendly than the standard wei per second format used by Ethereum.

2. Update existing streams: You can update existing streams by changing the flow rate.

3. Delete streams: You can delete streams that are no longer needed.

4. View stream details: You can view important details about your streams such as the token, recipient, flow rate, stream type, last updated and more.

5. Filter and search streams: You can filter and search streams by token, recipient, flow rate, stream type, and last updated.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/en/download/)
- [Docker](https://docs.docker.com/get-docker/)
- [Patience](https://www.youtube.com/watch?v=_k-F-MMvQV4)

### 1. Deploying the Superfluid Framework locally:

Before starting with the Developer-Mode Dashboard, you will need to deploy the Superfluid contracts on your local blockchain. Here are the steps to do this:

1. Install required dependencies:

```bash
npm install
```

2. Start a local blockchain using Hardhat:

```bash
npx hardhat node
```

3. Deploy the Superfluid contracts:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

### 2. Deploying Subgraph Locally:

Next, you will need to deploy the Superfluid subgraph locally. Here are the steps to do this:

1. Start local docker containers:

```bash
docker-compose up
```

2. Generate code for the subgraph:

```bash
npm run codegen
```

3. Create Subgraph and deploy it locally:

```bash
npm run create-local
npm run deploy-local
```

### 3. Starting the Client Application:

Finally, you will need to start the client application. Here are the steps to do this:

1. Navigate to the client directory and install required dependencies:

```bash
cd client
npm install
```

2. Start the client application:

```bash
npm run dev
```

3. Import First three accounts from your local blockchain into Metamask. You can do this by copying the private keys from your local blockchain and importing them into Metamask. You can find the private keys in the console where you started your local blockchain.

```
Accounts
========

WARNING: These accounts, and their private keys, are publicly known.
Any funds sent to them on Mainnet or any other live network WILL BE LOST.

Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

Account #2: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC (10000 ETH)
Private Key: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
```

4. Navigate to http://localhost:3000/ and connect your wallet, switch to imported accounts. Now, You can create, update, and delete, view, query, search streams on your local Superfluid instance with ease.

That's it! You are now ready to use the Developer-Mode Dashboard for Superfluid on your local blockchain.

## Credits & Resources:

- [Superfluid Wavepool ideas](https://superfluidhq.notion.site/Superfluid-Wave-Project-Ideas-7e8c792758004bd2ae452d1f9810cc58)
- [The Graph](https://thegraph.com/docs/en/developing/creating-a-subgraph/)
- [Graph Node](https://github.com/graphprotocol/graph-node)
- [Superfluid Guides](https://docs.superfluid.finance/superfluid/resources/integration-guides)
- [Hardhat](https://hardhat.org/getting-started/)
- [Ethers.js](https://docs.ethers.io/v5/)
- [Next.js](https://nextjs.org/docs/getting-started)
- [Ant Design](https://ant.design/docs/react/getting-started)

## Safety

This is experimental software and subject to change over time.

This is a proof of concept and is not ready for production use. It is not audited and has not been tested for security. Use at your own risk.
I do not give any warranties and will not be liable for any loss incurred through any use of this codebase.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
