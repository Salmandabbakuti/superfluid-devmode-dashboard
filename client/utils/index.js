import { formatEther, parseEther } from "@ethersproject/units";
import { JsonRpcProvider } from "@ethersproject/providers";
import { Contract } from "@ethersproject/contracts";
import { gql } from "graphql-request";

import addresses from "./contractAddresses.json";

const cfav1ForwarderABI = [
  "function createFlow(address token, address sender, address receiver, int96 flowrate, bytes userData) returns (bool)",
  "function updateFlow(address token, address sender, address receiver, int96 flowrate, bytes userData) returns (bool)",
  "function deleteFlow(address token, address sender, address receiver, bytes userData) returns (bool)",
];

const erc20ABI = [
  "function balanceOf(address) external view returns (uint256)",
];

export const provider = new JsonRpcProvider("http://localhost:8545");

// load contracts
export const cfav1ForwarderContract = new Contract(addresses.cfav1Forwarder, cfav1ForwarderABI, provider);
export const fdaixContract = new Contract(
  addresses.fdaix,
  erc20ABI,
  provider
);
export const fusdcxContract = new Contract(
  addresses.fusdcx,
  erc20ABI,
  provider
);
export const ftusdxContract = new Contract(
  addresses.ftusdx,
  erc20ABI,
  provider
);

export const tokens = [
  {
    name: "fDAIx",
    symbol: "fDAIx",
    address: addresses.fdaix.toLowerCase(),
    icon:
      "https://raw.githubusercontent.com/superfluid-finance/assets/master/public/tokens/dai/icon.svg"
  },
  {
    name: "fUSDCx",
    symbol: "fUSDCx",
    address: addresses.fusdcx.toLowerCase(),
    icon:
      "https://raw.githubusercontent.com/superfluid-finance/assets/master/public/tokens/usdc/icon.svg"
  },
  {
    name: "fTUSDx",
    symbol: "fTUSDx",
    address: addresses.ftusdx.toLowerCase(),
    icon:
      "https://raw.githubusercontent.com/superfluid-finance/assets/master/public/tokens/tusd/icon.svg"
  }
];

export const calculateFlowRateInTokenPerMonth = (amount) => {
  if (isNaN(amount)) return 0;
  // convert from wei/sec to token/month for displaying in UI
  const flowRate = (formatEther(amount) * 2592000).toFixed(9);
  // if flowRate is floating point number, remove unncessary trailing zeros
  return flowRate.replace(/\.?0+$/, "");
};

export const calculateFlowRateInWeiPerSecond = (amount) => {
  // convert amount from token/month to wei/second for sending to superfluid
  const flowRateInWeiPerSecond = parseEther(amount.toString())
    .div(2592000)
    .toString();
  return flowRateInWeiPerSecond;
};

export const STREAMS_QUERY = gql`
  query getStreams(
    $skip: Int
    $first: Int
    $orderBy: Stream_orderBy
    $orderDirection: OrderDirection
    $where: Stream_filter
  ) {
    streams(
      skip: $skip
      first: $first
      orderBy: $orderBy
      orderDirection: $orderDirection
      where: $where
    ) {
      id
      sender
      receiver
      token
      flowRate
      createdAt
      updatedAt
    }
  }
`;