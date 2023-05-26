# Superfluid Developer-Mode Dashboard

> CLI != Dashboard

> A dashboard is a way of displaying various types of visual data in one place. Usually, a dashboard is intended to convey different, but related information in an easy-to-digest form. A dashboard is often called a control panel, but the terms are interchangeable.

The Superfluid Developer-Mode Dashboard is a fullstack application that allows developers to create, update, and delete streams on their local Superfluid instance. The dashboard is designed to be easy to use and can be quickly set up to connect to your local blockchain where Superfluid is deployed. The dashboard provides a centralized location for users to manage all of their streams, view important details, and perform actions on them.

#### Dashboard

![dashboard-sf-dm](https://github.com/Salmandabbakuti/superfluid-devmode-dashboard/assets/29351207/1a72f10f-a830-472d-8819-0d7b34d27a26)

![sf-dm-list](https://github.com/Salmandabbakuti/superfluid-devmode-dashboard/assets/29351207/d4f75ab0-ec15-4a05-baf7-b5f95e5d16f3)

#### Search

![sf-dm-search](https://github.com/Salmandabbakuti/superfluid-devmode-dashboard/assets/29351207/5a0d7667-6b7f-4ab7-b436-69b3e4c98e9b)

### Features

The Developer-Mode Dashboard for Superfluid simplifies the process of creating, updating, and deleting, reading streams by eliminating the need to remember wallet/token addresses or type stream IDs. Here's a simplified description of the features:

**1. Creating streams:** You can easily create streams by copying the recipient address from select account dropdown and pasting it. Additionally, you can choose the desired token and specify the flow rate in a user-friendly "tokens per month" format.

**2. Updating streams:** To update a stream, you can simply click the edit button of the desired stream. There's no need to input the stream ID or sender/receiver addresses. Just enter the new flow rate and confirm the update.

**3. Deleting streams:** Deleting a stream is straightforward. By clicking the delete button of a specific stream, you can remove it without the hassle of entering sender/receiver addresses.

**4. View stream details:** You have the ability to access and review essential details about your streams. This includes information such as the token being used, recipient address, flow rate, stream type, last updated timestamp, and more. This comprehensive view allows you to easily track and understand the characteristics of each stream.

**5. Filter and search streams:** The dashboard offers a convenient way to filter and search for specific streams based on various criteria. You can apply filters based on the token being used, recipient address, flow rate, stream type. This functionality enables you to quickly locate and manage streams based on specific parameters, enhancing efficiency and streamlining the workflow.

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

### 3. Starting the Client Application (Optional):

> Note: Running the client application is optional. You can use this [deployed frontend directly](https://superfluid-devmode-dashboard.vercel.app). Just ensure that your blockchain is running on port 8545 and that the framework and subgraph are deployed (following the previous steps).

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

2. If you encounter any issues deploying the Superfluid subgraph, make sure you have started the local docker containers using `docker-compose up -d`. Wait for a few seconds to ensure that the containers have started completely before running next commands. This will give them enough time to initialize and set up the required services. Make sure you have generated the subgraph code using `npm run codegen`. Check Docker container logs for errors: `docker logs <container-name>`. If you are still having issues, kill the docker containers using `docker-compose down` and try again.

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
