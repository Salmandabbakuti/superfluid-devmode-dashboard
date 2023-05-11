# Superfluid Developer-Mode Dashboard: WIP

> Terminal != Dashboard

> A dashboard is a way of displaying various types of visual data in one place. Usually, a dashboard is intended to convey different, but related information in an easy-to-digest form. A dashboard is often called a control panel, but the terms are interchangeable.

The Superfluid Developer-Mode Dashboard is a fullstack application that allows developers to create, update, and delete streams on their local Superfluid instance. The dashboard is designed to be easy to use and can be quickly set up to connect to your local blockchain where Superfluid is deployed. The dashboard provides a centralized location for users to manage all of their streams, view important details, and perform actions on them.

#### Dashboard

![sdd-dashboard-sc](https://user-images.githubusercontent.com/29351207/236810834-f3ac5d31-0fa0-4124-87a0-b6295b822182.png)

#### Search

![sdd-filter-sc](https://user-images.githubusercontent.com/29351207/236810862-a01266ea-18be-4403-aa29-f16e46bd5408.png)

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
docker-compose up -d
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

3. Navigate to http://localhost:3000/ and choose an account to use from dropdown and connect. Now, You can create, update, and delete, view, query, search streams on your local Superfluid instance with ease.

That's it! You are now ready to use the Developer-Mode Dashboard for Superfluid on your local blockchain.

### Demo

https://github.com/Salmandabbakuti/superfluid-devmode-dashboard/assets/29351207/f6c92867-b720-4a0e-83b3-94680530004d

### Troubleshooting

1. If you encounter any issues deploying the Superfluid contracts, make sure you have a local blockchain running on port `8545` and that you have started a Hardhat node using `npx hardhat node`. Check Hardhat errors and try running npx hardhat clean and then `npx hardhat node` again. Rerun the deploy script: `npx hardhat run scripts/deploy.js --network localhost`.

2. If you encounter any issues deploying the Superfluid subgraph, make sure you have started the local docker containers using `docker-compose up -d`. Also, make sure you have generated the subgraph code using `npm run codegen`. Check Docker container logs for errors: `docker logs <container-name>`. If you are still having issues, kill the docker containers using `docker-compose down` and try again.

## Credits & Resources:

- [Superfluid Wavepool ideas](https://superfluidhq.notion.site/Superfluid-Wave-Project-Ideas-7e8c792758004bd2ae452d1f9810cc58)
- [The Graph](https://thegraph.com/docs/en/developing/creating-a-subgraph/)
- [Graph Node](https://github.com/graphprotocol/graph-node)
- [Superfluid Guides](https://docs.superfluid.finance/superfluid/resources/integration-guides)
- [Hardhat](https://hardhat.org/getting-started/)
- [Ethers.js](https://docs.ethers.io/v5/)
- [Next.js](https://nextjs.org/docs/getting-started)

## Safety

This is experimental software and subject to change over time.

This is a proof of concept and is not ready for production use. It is not audited and has not been tested for security. Use at your own risk.
I do not give any warranties and will not be liable for any loss incurred through any use of this codebase.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
