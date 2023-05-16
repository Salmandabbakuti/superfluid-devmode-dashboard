"use client";
import { useEffect, useState } from "react";
import { GraphQLClient } from "graphql-request";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { JsonRpcProvider } from "@ethersproject/providers";
import { formatEther } from "@ethersproject/units";
import { Contract } from "@ethersproject/contracts";
import { Interface } from "@ethersproject/abi";
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
  DeleteOutlined,
  CopyOutlined
} from "@ant-design/icons";
import styles from "./page.module.css";

import addresses from "../config/contractAddresses.json";

import {
  cfaABI,
  hostABI,
  erc20ABI,
  tokens,
  calculateFlowRateInTokenPerMonth,
  calculateFlowRateInWeiPerSecond,
  STREAMS_QUERY
} from "../utils";

const provider = new JsonRpcProvider("http://localhost:8545");

const { Header, Footer, Sider, Content } = Layout;
dayjs.extend(relativeTime);

const client = new GraphQLClient(
  "http://localhost:8000/subgraphs/name/salmandabbakuti/superfluid-devmode-dashboard",
  { headers: {} }
);




const cfaInterface = new Interface(cfaABI);

const hostContract = new Contract(addresses.host, hostABI, provider);

// load contracts
const fdaixContract = new Contract(
  addresses.fdaix,
  erc20ABI,
  provider
);
const fusdcxContract = new Contract(
  addresses.fusdcx,
  erc20ABI,
  provider
);
const ftusdxContract = new Contract(
  addresses.ftusdx,
  erc20ABI,
  provider
);

export default function Home() {
  const [accounts, setAccounts] = useState([]);
  const [account, setAccount] = useState(null);
  const [accountIndex, setAccountIndex] = useState(0);
  const [streams, setStreams] = useState([]);
  const [streamInput, setStreamInput] = useState({ token: tokens[0].address });
  const [updatedFlowRate, setUpdatedFlowRate] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState({
    type: "",
    token: "",
    searchInput: ""
  });
  const [balances, setBalances] = useState({
    daix: 0,
    fusdcx: 0,
    ftusdx: 0
  });

  //  getting list of accounts from provider
  useEffect(() => {
    provider
      .listAccounts()
      .then((accounts) => {
        console.log("accounts: ", accounts);
        setAccounts(accounts);
      })
      .catch((err) => {
        message.error(
          "Failed to get accounts. Please ensure local blockchain node is running on port 8545"
        );
        console.log("error getting provider accounts: ", err);
      });
  }, []);

  const handleConnectAccount = async () => {
    try {
      setLoading(true);
      const selectedAccount = accounts[accountIndex];
      // get balances of all tokens
      const fdaixBalance = await fdaixContract.balanceOf(selectedAccount);
      const fusdcxBalance = await fusdcxContract.balanceOf(selectedAccount);
      const ftusdxBalance = await ftusdxContract.balanceOf(selectedAccount);
      setBalances({
        fdaix: formatEther(fdaixBalance),
        fusdcx: formatEther(fusdcxBalance),
        ftusdx: formatEther(ftusdxBalance)
      });
      setAccount(selectedAccount.toLowerCase());
      setSearchFilter({ type: "", token: "", searchInput: "" });
      setLoading(false);
      message.success("Account connected");
    } catch (err) {
      setLoading(false);
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
      const flowRateInWeiPerSecond = calculateFlowRateInWeiPerSecond(flowRate);
      console.log("flowRateInWeiPerSecond: ", flowRateInWeiPerSecond);
      const signer = provider.getSigner(account);
      const txData = cfaInterface.encodeFunctionData("createFlow", [
        token,
        receiver,
        flowRateInWeiPerSecond,
        "0x"
      ]);
      const tx = await hostContract.connect(signer).callAgreement(addresses.cfa, txData, "0x");
      await tx.wait();
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
      const flowRateInWeiPerSecond = calculateFlowRateInWeiPerSecond(flowRate);
      console.log("flowRateInWeiPerSecond: ", flowRateInWeiPerSecond);
      const signer = provider.getSigner(account);
      const txData = cfaInterface.encodeFunctionData("updateFlow", [
        token,
        receiver,
        flowRateInWeiPerSecond,
        "0x"
      ]);
      const tx = await hostContract.connect(signer).callAgreement(addresses.cfa, txData, "0x");
      await tx.wait();
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
      const signer = provider.getSigner(account);
      const txData = cfaInterface.encodeFunctionData("deleteFlow", [
        token,
        sender,
        receiver,
        "0x"
      ]);
      const tx = await hostContract.connect(signer).callAgreement(addresses.cfa, txData, "0x");
      await tx.wait();
      message.success("Stream deleted successfully");
      setLoading(false);
    } catch (err) {
      setLoading(false);
      message.error("Failed to delete stream");
      console.error("failed to delete stream: ", err);
    }
  };

  useEffect(() => {
    if (account) {
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
  }, [account]);

  const getStreams = () => {
    setDataLoading(true);
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
        setDataLoading(false);
      })
      .catch((err) => {
        setDataLoading(false);
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
              href={`http://localhost:8545/token/${token}`}
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
          href={`http://localhost:8545/address/${sender}`}
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
          href={`http://localhost:8545/address/${receiver}`}
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
          {row.sender === account && row.flowRate !== "0" ? (
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
          ) : (
            <Space>
              <Tag color={row.sender === account ? "blue" : "green"}>
                {row.sender === account ? "OUTGOING" : "INCOMING"}
              </Tag>
              {row.flowRate === "0" && <Tag color="red">TERMINATED</Tag>}
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
            <Card
              type="inner"
              size="small"
              title={
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
              }
            >
              <Card.Meta
                title="Balances"
                description={
                  <Space direction="vertical">
                    {tokens.map((token) => (
                      <span key={token.address}>
                        <Avatar shape="circle" size="small" src={token.icon} />
                        <span style={{ marginLeft: 10 }}>{token.symbol}</span>
                        <span style={{ marginLeft: 10 }}>
                          {balances[token.name.toLowerCase()] || 0}
                        </span>
                      </span>
                    ))}
                  </Space>
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
                defaultValue={0}
                name="account"
                id="account"
                loading={loading}
                value={accountIndex}
                style={{
                  borderRadius: 10,
                  width: 280
                }}
                onChange={(val) => setAccountIndex(val)}
              >
                {accounts.map((account, i) => (
                  <Select.Option
                    value={i}
                    key={i}
                    onMouseEnter={(e) => {
                      const copyIcon = e.target.querySelector('.copy-icon');
                      if (copyIcon) copyIcon.style.display = 'inline-block';
                    }}
                    onMouseLeave={(e) => {
                      const copyIcon = e.target.querySelector('.copy-icon');
                      if (copyIcon) copyIcon.style.display = 'none';
                    }}
                  >
                    {`Account #${i} - ${account.slice(0, 8)}...${account.slice(-5)}`}
                    <CopyOutlined
                      className="copy-icon"
                      style={{ marginLeft: 10, fontSize: '17px', display: 'none' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(account);
                        message.success("Address copied to clipboard");
                      }}
                    />
                  </Select.Option>
                ))}
              </Select>
              <Button
                type="primary"
                shape="round"
                disabled={loading}
                onClick={handleConnectAccount}
              >
                Connect
              </Button>
            </Space>
            {account && (
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
                      disabled={loading}
                      loading={loading}
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
                          <Avatar
                            shape="circle"
                            size="small"
                            src={token.icon}
                          />{" "}
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
                    value={searchFilter?.token || ""}
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
                    value={searchFilter?.type || ""}
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
                    value={searchFilter?.searchInput || ""}
                    enterButton
                    allowClear
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
                  loading={dataLoading}
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
