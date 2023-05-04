"use client";
import { useEffect, useState } from "react";
import { GraphQLClient, gql } from "graphql-request";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Framework } from "@superfluid-finance/sdk-core";
import { providers, ethers } from "ethers";
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

const { Header, Footer, Sider, Content } = Layout;
dayjs.extend(relativeTime);

const client = new GraphQLClient(
  "https://api.thegraph.com/subgraphs/name/salmandabbakuti/superfluid-stream-push",
  { headers: {} }
);

const tokens = [
  {
    name: "fDAIx",
    symbol: "fDAIx",
    address: "0xf2d68898557ccb2cf4c10c3ef2b034b2a69dad00",
    icon:
      "https://raw.githubusercontent.com/superfluid-finance/assets/master/public//tokens/dai/icon.svg"
  },
  {
    name: "fUSDCx",
    symbol: "fUSDCx",
    address: "0x8ae68021f6170e5a766be613cea0d75236ecca9a",
    icon:
      "https://raw.githubusercontent.com/superfluid-finance/assets/master/public//tokens/usdc/icon.svg"
  },
  {
    name: "fTUSDx",
    symbol: "fTUSDx",
    address: "0x95697ec24439e3eb7ba588c7b279b9b369236941",
    icon:
      "https://raw.githubusercontent.com/superfluid-finance/assets/master/public//tokens/tusd/icon.svg"
  },
  {
    name: "ETHx",
    symbol: "ETHx",
    address: "0x5943f705abb6834cad767e6e4bb258bc48d9c947",
    icon:
      "https://raw.githubusercontent.com/superfluid-finance/assets/master/public//tokens/eth/icon.svg"
  }
];

const calculateFlowRateInTokenPerMonth = (amount) => {
  if (isNaN(amount)) return 0;
  // convert from wei/sec to token/month for displaying in UI
  const flowRate = (ethers.utils.formatEther(amount) * 2592000).toFixed(9);
  // if flowRate is floating point number, remove unncessary trailing zeros
  return flowRate.replace(/\.?0+$/, "");
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
      status
      flowRate
      createdAt
      updatedAt
    }
  }
`;

const options = {
  chart: {
    type: "networkgraph",
    height: "50%"
  },
  title: {
    text: "The Indo-European Language Tree",
    align: "left"
  },
  subtitle: {
    text: "A Force-Directed Network Graph in Highcharts",
    align: "left"
  },
  plotOptions: {
    networkgraph: {
      keys: ["from", "to"],
      layoutAlgorithm: {
        enableSimulation: true,
        friction: -0.9
      }
    }
  },
  series: [
    {
      accessibility: {
        enabled: false
      },
      dataLabels: {
        enabled: true,
        linkFormat: ""
      },
      id: "lang-tree",
      data: [
        ["0x734..b9C7Ff", "USDCx"],
        ["0x734..b9C7Ff", "DAIx"],
        ["0x734..b9C7Ff", "USDTx"],
        ["0x734..b9C7Ff", "ETHx"],
        ["USDCx", "0xc49..g8Jt75"],
        ["USDTx", "Anatolian"],
        ["0x734..b9C7Ff", "Indo-Iranian"],
        ["0x734..b9C7Ff", "Tocharian"]
      ]
    }
  ]
};

export default function Home() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [superfluidSdk, setSuperfluidSdk] = useState(null);
  const [paginationOptions, setPaginationOptions] = useState({
    first: 100,
    skip: 0
  });
  const [searchFilter, setSearchFilter] = useState({
    type: "",
    token: "",
    searchInput: ""
  });

  const handleConnectWallet = async () => {
    if (window?.ethereum) {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts"
      });
      console.log("Using account: ", accounts[0]);
      const provider = new providers.Web3Provider(window.ethereum);
      const { chainId } = await provider.getNetwork();
      if (chainId !== 5) {
        message.info("Switching to goerli testnet");
        // switch to the goerli testnet
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x5" }]
        });
      }
      console.log("chainId:", chainId);
      const sf = await Framework.create({
        chainId,
        provider
      });
      setSuperfluidSdk(sf);
      setProvider(provider);
      setChainId(chainId);
      setAccount(accounts[0]);
    } else {
      console.warn("Please use web3 enabled browser");
      message.warn("Please install Metamask or any other web3 enabled browser");
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
      console.log("window.ethereum", window.ethereum);
      window.ethereum.on("accountsChanged", () => window.location.reload());
      window.ethereum.on("chainChanged", (chainId) =>
        setChainId(parseInt(chainId))
      );
      window.ethereum.on("connect", (info) =>
        console.log("connected to network", info)
      );

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

  // useEffect(() => {
  //   getStreams();
  // },
  //   [paginationOptions]
  // );

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
              {row.status === "TERMINATED" ? (
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
            {provider ? (
              <div>
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
                    // total: 200,
                    size: "small"
                  }}
                // onChange={({ current, pageSize }) => {
                //   setPaginationOptions({ ...paginationOptions, first: pageSize, skip: (current - 1) * pageSize });
                // }}
                />
                {/* Streams Table Ends */}
              </div>
            ) : (
              <Button
                style={{ marginLeft: "30%" }}
                type="primary"
                shape="round"
                onClick={handleConnectWallet}
              >
                Connect Wallet
              </Button>
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
