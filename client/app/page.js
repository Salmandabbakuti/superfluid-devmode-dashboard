"use client";
import { useEffect, useState } from "react";
import { GraphQLClient, gql } from "graphql-request";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Framework } from "@superfluid-finance/sdk-core";
import { JsonRpcProvider } from "@ethersproject/providers";
import { Wallet } from "@ethersproject/wallet";
import { parseEther, formatEther } from "@ethersproject/units";
import {
  Avatar,
  Button,
  Layout,
  Card,
  Input,
  message,
  Space,
  Table,
  Tag,
  Select,
  Popconfirm,
  InputNumber
} from "antd";
import {
  SyncOutlined,
  EditOutlined,
  DeleteOutlined
} from "@ant-design/icons";
import styles from "./page.module.css";

import addresses from "../config/contractAddresses.json";
import accounts from "../config/accounts.json";

const { Header, Footer, Sider, Content } = Layout;
dayjs.extend(relativeTime);

const client = new GraphQLClient(
  "http://localhost:8000/subgraphs/name/salmandabbakuti/superfluid-devmode-dashboard",
  { headers: {} }
);

const tokens = [
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

const calculateFlowRateInTokenPerMonth = (amount) => {
  if (isNaN(amount)) return 0;
  // convert from wei/sec to token/month for displaying in UI
  const flowRate = (formatEther(amount) * 2592000).toFixed(9);
  // if flowRate is floating point number, remove unncessary trailing zeros
  return flowRate.replace(/\.?0+$/, "");
};

const calculateFlowRateInWeiPerSecond = (amount) => {
  // convert amount from token/month to wei/second for sending to superfluid
  const flowRateInWeiPerSecond = parseEther(amount.toString())
    .div(2592000)
    .toString();
  return flowRateInWeiPerSecond;
};


const STREAMS_QUERY = gql`
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

export default function Home() {
  const [account, setAccount] = useState(null);
  const [accountIndex, setAccountIndex] = useState(0);
  const [provider, setProvider] = useState(null);
  const [streams, setStreams] = useState([]);
  const [streamInput, setStreamInput] = useState({ token: tokens[0].address });
  const [updatedFlowRate, setUpdatedFlowRate] = useState(0);
  const [loading, setLoading] = useState(false);
  const [superfluidSdk, setSuperfluidSdk] = useState(null);
  const [searchFilter, setSearchFilter] = useState({
    type: "",
    token: "",
    searchInput: ""
  });

  const handleConnectAccount = async () => {
    try {
      const selectedAccount = accounts[accountIndex];
      const provider = new JsonRpcProvider("http://localhost:8545");
      const wallet = new Wallet(selectedAccount.privateKey, provider);
      const sf = await Framework.create({
        chainId: 31337,
        provider,
        resolverAddress: addresses.resolver,
        protocolReleaseVersion: "test"
      });
      setSuperfluidSdk(sf);
      setAccount(wallet.address.toLowerCase());
      setProvider(provider);
      message.success("Account connected");
    } catch (err) {
      console.error("Error connecting account:", err);
      message.error("Error connecting account");
    }
  };

  const handleCreateStream = async ({
    token,
    sender = account,
    receiver,
    flowRate
  }) => {
    console.log("create inputs: ", token, sender, receiver, flowRate);
    if (!token || !sender || !receiver || !flowRate)
      return message.error("Please fill all the fields");
    try {
      setLoading(true);
      const superToken = await superfluidSdk.loadSuperToken(token);
      const flowRateInWeiPerSecond = calculateFlowRateInWeiPerSecond(flowRate);
      console.log("flowRateInWeiPerSecond: ", flowRateInWeiPerSecond);
      let flowOp = superToken.createFlow({
        sender,
        receiver,
        flowRate: flowRateInWeiPerSecond
      });

      await flowOp.exec(provider.getSigner());
      message.success("Stream created successfully");
      setLoading(false);
    } catch (err) {
      setLoading(false);
      message.error("Failed to create stream");
      console.error("failed to create stream: ", err);
    }
  };

  const handleUpdateStream = async ({
    token,
    sender = account,
    receiver,
    flowRate
  }) => {
    console.log("update inputs: ", token, sender, receiver, flowRate);
    if (!flowRate) return message.error("Please enter new flow rate");
    try {
      setLoading(true);
      const superToken = await superfluidSdk.loadSuperToken(token);
      const flowRateInWeiPerSecond = calculateFlowRateInWeiPerSecond(flowRate);
      console.log("flowRateInWeiPerSecond: ", flowRateInWeiPerSecond);
      let flowOp = superToken.updateFlow({
        sender,
        receiver,
        flowRate: flowRateInWeiPerSecond
      });
      await flowOp.exec(provider.getSigner());
      message.success("Stream updated successfully");
      setLoading(false);
    } catch (err) {
      setLoading(false);
      message.error("Failed to update stream");
      console.error("failed to update stream: ", err);
    }
  };

  const handleDeleteStream = async ({ token, sender, receiver }) => {
    try {
      setLoading(true);
      const superToken = await superfluidSdk.loadSuperToken(token);
      let flowOp = superToken.deleteFlow({
        sender,
        receiver
      });

      await flowOp.exec(provider.getSigner());
      message.success("Stream deleted successfully");
      setLoading(false);
    } catch (err) {
      setLoading(false);
      message.error("Failed to delete stream");
      console.error("failed to delete stream: ", err);
    }
  };

  useEffect(() => {
    if (provider) {
      getStreams();
      // sync streams every 30 seconds
      const intervalCall = setInterval(() => {
        getStreams();
      }, 30000);
      return () => {
        clearInterval(intervalCall);
        window.ethereum.removeAllListeners();
      };
    }
  }, [provider]);

  const getStreams = () => {
    setLoading(true);
    // update search filters based on type
    const { type, token, searchInput } = searchFilter;
    const filterObj = {};
    if (token) filterObj.token = token;
    if (type === "INCOMING") {
      filterObj.receiver = account;
    } else if (type === "OUTGOING") {
      filterObj.sender = account;
    } else if (type === "TERMINATED") {
      filterObj.flowRate = "0";
    }
    client
      .request(STREAMS_QUERY, {
        skip: 0,
        first: 100,
        orderBy: "createdAt",
        orderDirection: "desc",
        where: {
          and: [
            filterObj,
            { or: [{ sender: account }, { receiver: account }] },
            ...(searchInput && [
              {
                or: [
                  { sender_contains_nocase: searchInput },
                  { receiver_contains_nocase: searchInput },
                  { token_contains_nocase: searchInput }
                ]
              }
            ])
          ]
        }
      })
      .then((data) => {
        console.log("streams: ", data.streams);
        setStreams(data.streams);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        message.error("Something went wrong!");
        console.error("failed to get streams: ", err);
      });
  };

  const columns = [
    {
      title: "Asset",
      key: "token",
      width: "5%",
      render: ({ token }) => {
        const tokenData = tokens.find(
          (oneToken) => oneToken.address === token
        ) || {
          icon: "",
          symbol: "Unknown"
        };
        return (
          <>
            <Avatar shape="circle" size="large" src={tokenData.icon} />
            <a
              href={`https://goerli.etherscan.io/token/${token}`}
              target="_blank"
              rel="noreferrer"
              style={{ marginLeft: 10 }}
            >
              {tokenData.symbol}
            </a>
          </>
        );
      }
    },
    {
      title: "Sender",
      key: "sender",
      ellipsis: true,
      width: "10%",
      render: ({ sender }) => (
        <a
          href={`https://goerli.etherscan.io/address/${sender}`}
          target="_blank"
          rel="noreferrer"
        >
          {sender === account ? `${sender} (You)` : sender}
        </a>
      )
    },
    {
      title: "Receiver",
      key: "receiver",
      ellipsis: true,
      width: "10%",
      render: ({ receiver }) => (
        <a
          href={`https://goerli.etherscan.io/address/${receiver}`}
          target="_blank"
          rel="noreferrer"
        >
          {receiver === account ? `${receiver} (You)` : receiver}
        </a>
      )
    },
    {
      title: "Flow Rate",
      key: "flowRate",
      sorter: (a, b) => a.flowRate - b.flowRate,
      width: "5%",
      render: ({ flowRate, token }) => {
        // calculate flow rate in tokens per month
        const monthlyFlowRate = calculateFlowRateInTokenPerMonth(flowRate);
        const tokenSymbol =
          tokens.find((oneToken) => oneToken.address === token)?.symbol ||
          "Unknown";
        return (
          <span style={{ color: "#1890ff" }}>
            {monthlyFlowRate} {tokenSymbol}/mo
          </span>
        );
      }
    },
    {
      title: "Created / Updated At",
      key: "createdAt",
      sorter: (a, b) => a.createdAt - b.createdAt,
      width: "5%",
      render: ({ createdAt, updatedAt }) => (
        <Space direction="vertical">
          <span>{dayjs(createdAt * 1000).format("DD MMM YYYY")}</span>
          <span>{dayjs(updatedAt * 1000).format("DD MMM YYYY")}</span>
        </Space>
      )
    },
    {
      title: "Actions",
      width: "5%",
      render: (row) => (
        <>
          {row.sender === account ? (
            <>
              {row.flowRate === "0" ? (
                <Space>
                  <Tag color="blue">OUTGOING</Tag>
                  <Tag color="red">TERMINATED</Tag>
                </Space>
              ) : (
                <Space size="small">
                  <Popconfirm
                    title={
                      <InputNumber
                        addonAfter="/month"
                        placeholder="New Flow Rate"
                        onChange={(val) => setUpdatedFlowRate(val)}
                      />
                    }
                    // add descrition as input number to update flow rate
                    description="Enter new flow rate"
                    onConfirm={() =>
                      handleUpdateStream({ ...row, flowRate: updatedFlowRate })
                    }
                  >
                    <Button type="primary" shape="circle">
                      <EditOutlined />
                    </Button>
                  </Popconfirm>
                  <Popconfirm
                    title="Are you sure to delete?"
                    onConfirm={() => handleDeleteStream(row)}
                  >
                    <Button type="primary" shape="circle" danger>
                      <DeleteOutlined />
                    </Button>
                  </Popconfirm>
                </Space>
              )}
            </>
          ) : (
            <Space>
              <Tag color="green">INCOMING</Tag>
              {row.status === "TERMINATED" && <Tag color="red">TERMINATED</Tag>}
            </Space>
          )}
        </>
      )
    }
  ];

  return (
    <>
      <Layout style={{ minHeight: "100vh" }}>
        <Sider theme="dark" breakpoint="lg" collapsedWidth="0">
          {account && (
            <Card type="inner" size="small">
              <Card.Meta
                title={
                  <Button
                    type="primary"
                    shape="round"
                    onClick={() => window.location.reload()}
                  >
                    Disconnect
                  </Button>
                }
                description={`${account.slice(0, 8)}...${account.slice(-8)}`}
                avatar={
                  <Avatar
                    shape="circle"
                    size="large"
                    alt="Profile"
                    src={`https://api.dicebear.com/5.x/open-peeps/svg?seed=${account}`}
                  />
                }
              />
            </Card>
          )}
        </Sider>
        <Layout className="site-layout">
          <Header className="site-layout-background" style={{ padding: 0 }}>
            <h1 style={{ textAlign: "center", color: "white" }}>
              Superfluid Devmode Dashboard
            </h1>
          </Header>
          <Content
            className="site-layout-background"
            style={{
              margin: "24px 16px",
              padding: 24,
              minHeight: 280
            }}
          >
            <Space>
              <label htmlFor="account">Select Account:</label>
              <Select
                defaultValue={accounts[0].address}
                name="account"
                id="account"
                value={accounts[accountIndex].address}
                style={{
                  borderRadius: 10,
                  marginBottom: 10
                }}
                onChange={(val) => setAccountIndex(val)}
              >
                {accounts.map((account, i) => (
                  <Select.Option value={i} key={i}>
                    {account.address}
                  </Select.Option>
                ))}
              </Select>
              <Button
                type="primary"
                shape="round"
                style={{ marginTop: 10 }}
                onClick={handleConnectAccount}
              >
                Connect
              </Button>
            </Space>
            {provider && (
              <div>
                {/* Create Stream Section Starts */}
                <Card
                  bordered
                  title="Create Stream"
                  className={styles.cardContainer}
                  actions={[
                    <Button
                      key="create"
                      type="primary"
                      shape="round"
                      style={{ marginTop: 10 }}
                      onClick={() => handleCreateStream(streamInput)}
                    >
                      Send
                    </Button>
                  ]}
                >
                  <Input
                    type="text"
                    placeholder="Receiver Wallet Address"
                    name="receiver"
                    value={streamInput.receiver || ""}
                    onChange={(e) =>
                      setStreamInput({
                        ...streamInput,
                        receiver: e.target.value
                      })
                    }
                    style={{
                      borderRadius: 10,
                      marginBottom: 10
                    }}
                  />
                  <Space>
                    <label htmlFor="token">Select Token:</label>
                    <Select
                      defaultValue={tokens[0].symbol}
                      name="token"
                      id="token"
                      value={streamInput?.token || tokens[0].address}
                      style={{
                        borderRadius: 10,
                        marginBottom: 10
                      }}
                      onChange={(val) =>
                        setStreamInput({ ...streamInput, token: val })
                      }
                    >
                      {tokens.map((token, i) => (
                        <Select.Option value={token.address} key={i}>
                          <Avatar shape="circle" size="small" src={token.icon} />{" "}
                          {token.symbol}
                        </Select.Option>
                      ))}
                    </Select>
                    {/*  add flowrate input */}
                    <InputNumber
                      name="flowRate"
                      addonAfter="/month"
                      placeholder="Flow Rate"
                      value={streamInput?.flowRate || 0}
                      onChange={(val) =>
                        setStreamInput({ ...streamInput, flowRate: val })
                      }
                      style={{
                        borderRadius: 10,
                        marginBottom: 10
                        // width: 120
                      }}
                    />
                  </Space>
                </Card>
                {/* Create Stream Section Ends */}
                {/* Streams Table Starts */}
                <h2>My Streams</h2>
                <Space>
                  <label htmlFor="search">Token:</label>
                  <Select
                    defaultValue=""
                    style={{ width: 120 }}
                    onChange={(val) =>
                      setSearchFilter({ ...searchFilter, token: val })
                    }
                  >
                    <Select.Option value="">All</Select.Option>
                    {tokens.map((token, i) => (
                      <Select.Option value={token.address} key={i}>
                        <Avatar shape="circle" size="small" src={token.icon} />{" "}
                        {token.symbol}
                      </Select.Option>
                    ))}
                  </Select>
                  <label htmlFor="search">Stream Type:</label>
                  <Select
                    defaultValue=""
                    style={{ width: 120 }}
                    onChange={(val) =>
                      setSearchFilter({ ...searchFilter, type: val })
                    }
                  >
                    <Select.Option value="">All</Select.Option>
                    <Select.Option value="INCOMING">
                      <Tag color="green">INCOMING</Tag>
                    </Select.Option>
                    <Select.Option value="OUTGOING">
                      <Tag color="blue">OUTGOING</Tag>
                    </Select.Option>
                    <Select.Option value="TERMINATED">
                      <Tag color="red">TERMINATED</Tag>
                    </Select.Option>
                  </Select>
                  <Input.Search
                    placeholder="Search by address"
                    value={searchFilter?.searchInput}
                    enterButton
                    allowClear
                    loading={loading}
                    onSearch={getStreams}
                    onChange={(e) =>
                      setSearchFilter({
                        ...searchFilter,
                        searchInput: e.target.value
                      })
                    }
                  />
                  <Button type="primary" onClick={getStreams}>
                    <SyncOutlined />
                  </Button>
                </Space>
                <Table
                  className="table_grid"
                  columns={columns}
                  rowKey="id"
                  dataSource={streams}
                  scroll={{ x: 970 }}
                  loading={loading}
                  pagination={{
                    pageSizeOptions: [5, 10, 20, 25, 50, 100],
                    showSizeChanger: true,
                    showQuickJumper: true,
                    defaultCurrent: 1,
                    defaultPageSize: 10,
                    size: "small"
                  }}
                />
                {/* Streams Table Ends */}
              </div>
            )}
          </Content>
          <Footer style={{ textAlign: "center" }}>
            <a
              href="https://github.com/Salmandabbakuti"
              target="_blank"
              rel="noopener noreferrer"
            >
              © {new Date().getFullYear()} Salman Dabbakuti. Powered by
              Superfluid
            </a>
          </Footer>
        </Layout>
      </Layout>
    </>
  );
}
