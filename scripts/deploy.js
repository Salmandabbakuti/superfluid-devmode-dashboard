const { Framework } = require("@superfluid-finance/sdk-core");
const { ethers } = require("hardhat");
const { deployTestFramework } = require("@superfluid-finance/ethereum-contracts/dev-scripts/deploy-test-framework");
const TestToken = require("@superfluid-finance/ethereum-contracts/build/contracts/TestToken.json");
const fs = require("fs");

async function main() {
  const [owner, account1, account2] = await ethers.getSigners();
  const { frameworkDeployer, superTokenDeployer } = await deployTestFramework();
  const contractsFramework = await frameworkDeployer.getFramework();

  // initialize framework
  const sf = await Framework.create({
    chainId: 31337,
    provider: owner.provider,
    resolverAddress: contractsFramework.resolver,
    protocolReleaseVersion: "test"
  });

  // deploy wrapper tokens dai,usdc,usdt and store addresses in local file

  await superTokenDeployer.deployWrapperSuperToken(
    "Fake DAI Token",
    "fDAI",
    18,
    ethers.utils.parseEther("100000000").toString()
  );

  await superTokenDeployer.deployWrapperSuperToken(
    "Fake USDC Token",
    "fUSDC",
    18,
    ethers.utils.parseEther("100000000").toString()
  );

  await superTokenDeployer.deployWrapperSuperToken(
    "Fake USDT Token",
    "fUSDT",
    18,
    ethers.utils.parseEther("100000000").toString()
  );

  const thousandEther = ethers.utils.parseEther("10000");
  // load wrapper tokens and mint to all accounts
  const daix = await sf.loadSuperToken("fDAIx");
  const dai = new ethers.Contract(daix.underlyingToken.address, TestToken.abi, owner);

  const usdcx = await sf.loadSuperToken("fUSDCx");
  const usdc = new ethers.Contract(usdcx.underlyingToken.address, TestToken.abi, owner);

  const usdtx = await sf.loadSuperToken("fUSDTx");
  const usdt = new ethers.Contract(usdtx.underlyingToken.address, TestToken.abi, owner);



  // minting and wrapping test DAI to all accounts
  await dai.mint(owner.address, thousandEther);
  await dai.mint(account1.address, thousandEther);
  await dai.mint(account2.address, thousandEther);

  // minting and wrapping test USDC to all accounts
  await usdc.mint(owner.address, thousandEther);
  await usdc.mint(account1.address, thousandEther);
  await usdc.mint(account2.address, thousandEther);

  // minting and wrapping test USDT to all accounts
  await usdt.mint(owner.address, thousandEther);
  await usdt.mint(account1.address, thousandEther);
  await usdt.mint(account2.address, thousandEther);

  // approving DAIx to spend DAI (Super Token object is not an ethers contract object and has different operation syntax)
  await dai.approve(daix.address, ethers.constants.MaxInt256);
  await dai.connect(account1).approve(daix.address, ethers.constants.MaxInt256);
  await dai.connect(account2).approve(daix.address, ethers.constants.MaxInt256);
  // Upgrading all DAI to DAIx
  const ownerUpgradeDAI = daix.upgrade({ amount: thousandEther });
  const account1UpgradeDAI = daix.upgrade({ amount: thousandEther });
  const account2UpgradeDAI = daix.upgrade({ amount: thousandEther });

  await ownerUpgradeDAI.exec(owner);
  await account1UpgradeDAI.exec(account1);
  await account2UpgradeDAI.exec(account2);

  // approving USDCx to spend USDC (Super Token object is not an ethers contract object and has different operation syntax)
  await usdc.approve(usdcx.address, ethers.constants.MaxInt256);
  await usdc.connect(account1).approve(usdcx.address, ethers.constants.MaxInt256);
  await usdc.connect(account2).approve(usdcx.address, ethers.constants.MaxInt256);
  // Upgrading all USDC to USDCx
  const ownerUpgradeUSDC = usdcx.upgrade({ amount: thousandEther });
  const account1UpgradeUSDC = usdcx.upgrade({ amount: thousandEther });
  const account2UpgradeUSDC = usdcx.upgrade({ amount: thousandEther });

  await ownerUpgradeUSDC.exec(owner);
  await account1UpgradeUSDC.exec(account1);
  await account2UpgradeUSDC.exec(account2);

  // approving USDTx to spend USDT (Super Token object is not an ethers contract object and has different operation syntax)
  await usdt.approve(usdtx.address, ethers.constants.MaxInt256);
  await usdt.connect(account1).approve(usdtx.address, ethers.constants.MaxInt256);
  await usdt.connect(account2).approve(usdtx.address, ethers.constants.MaxInt256);
  // Upgrading all USDT to USDTx
  const ownerUpgradeUSDT = usdtx.upgrade({ amount: thousandEther });
  const account1UpgradeUSDT = usdtx.upgrade({ amount: thousandEther });
  const account2UpgradeUSDT = usdtx.upgrade({ amount: thousandEther });

  await ownerUpgradeUSDT.exec(owner);
  await account1UpgradeUSDT.exec(account1);
  await account2UpgradeUSDT.exec(account2);

  // store token addresses, cfav1 address in local file
  const addresses = {
    daix: daix.address,
    dai: dai.address,
    usdcx: usdcx.address,
    usdc: usdc.address,
    usdtx: usdtx.address,
    usdt: usdt.address,
    host: contractsFramework.host,
    cfa: contractsFramework.cfa,
    resolver: contractsFramework.resolver,
    cfav1: contractsFramework.cfaV1Forwarder
  };
  fs.writeFileSync("./addresses.json", JSON.stringify(addresses, null, 2));
}

main()
  .then((res) => {
    console.log("done");
  })
  .catch((error) => {
    console.error(error);
  });
