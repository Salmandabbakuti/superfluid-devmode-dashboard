const { Framework } = require("@superfluid-finance/sdk-core");
const { ethers } = require("hardhat");
const { deployTestFramework } = require("@superfluid-finance/ethereum-contracts/dev-scripts/deploy-test-framework");
const TestToken = require("@superfluid-finance/ethereum-contracts/build/contracts/TestToken.json");
const fs = require("fs");

async function main() {
  console.log("[INFO]: Deploying Superfluid Framework and SuperTokens on local network");
  const [owner, account1, account2] = await ethers.getSigners();
  const { frameworkDeployer, superTokenDeployer } = await deployTestFramework();
  const contractsFramework = await frameworkDeployer.getFramework();
  const provider = ethers.provider;

  // initialize framework
  const sf = await Framework.create({
    chainId: 31337,
    provider,
    resolverAddress: contractsFramework.resolver,
    protocolReleaseVersion: "test"
  });

  console.log("[INFO]: Deploying wrapper token contracts [fDAI, fUSDC, fTUSD]");

  const millionTokens = ethers.utils.parseEther("1000000").toString();

  // deploying 1 million test fDAI, fUSDC, fTUSD tokens and wrapping them
  await superTokenDeployer.deployWrapperSuperToken(
    "Fake DAI Token",
    "fDAI",
    18,
    millionTokens
  );

  await superTokenDeployer.deployWrapperSuperToken(
    "Fake USDC Token",
    "fUSDC",
    18,
    millionTokens
  );

  await superTokenDeployer.deployWrapperSuperToken(
    "Fake TUSD Token",
    "fTUSD",
    18,
    millionTokens
  );

  console.log("[INFO]: Minting and upgrading wrapper tokens [fDAIx, fUSDCx, fTUSDx] to first 3 accounts");

  // load wrapper tokens
  const fdaix = await sf.loadSuperToken("fDAIx");
  const fdai = new ethers.Contract(fdaix.underlyingToken.address, TestToken.abi, owner);

  const fusdcx = await sf.loadSuperToken("fUSDCx");
  const fusdc = new ethers.Contract(fusdcx.underlyingToken.address, TestToken.abi, owner);

  const ftusdx = await sf.loadSuperToken("fTUSDx");
  const ftusd = new ethers.Contract(ftusdx.underlyingToken.address, TestToken.abi, owner);


  const thousandTokens = ethers.utils.parseEther("1000");

  // minting fDAI to first 3 accounts
  await fdai.mint(owner.address, thousandTokens);
  await fdai.mint(account1.address, thousandTokens);
  await fdai.mint(account2.address, thousandTokens);

  // minting fUSDC to first 3 accounts
  await fusdc.mint(owner.address, thousandTokens);
  await fusdc.mint(account1.address, thousandTokens);
  await fusdc.mint(account2.address, thousandTokens);

  // minting fTUSD to first 3 accounts
  await ftusd.mint(owner.address, thousandTokens);
  await ftusd.mint(account1.address, thousandTokens);
  await ftusd.mint(account2.address, thousandTokens);

  // approving fDAIx to spend fDAI
  await fdai.approve(fdaix.address, thousandTokens);
  await fdai.connect(account1).approve(fdaix.address, thousandTokens);
  await fdai.connect(account2).approve(fdaix.address, thousandTokens);
  // Upgrading all fDAI to fDAIx for first 3 accounts
  const upgradeFDAI = fdaix.upgrade({ amount: thousandTokens });

  await upgradeFDAI.exec(owner);
  await upgradeFDAI.exec(account1);
  await upgradeFDAI.exec(account2);

  // approving fUSDCx to spend fUSDC
  await fusdc.approve(fusdcx.address, thousandTokens);
  await fusdc.connect(account1).approve(fusdcx.address, thousandTokens);
  await fusdc.connect(account2).approve(fusdcx.address, thousandTokens);
  // Upgrading all fUSDC to fUSDCx
  const upgradeFUSDC = fusdcx.upgrade({ amount: thousandTokens });

  await upgradeFUSDC.exec(owner);
  await upgradeFUSDC.exec(account1);
  await upgradeFUSDC.exec(account2);

  // approving fTUSDx to spend fTUSD
  await ftusd.approve(ftusdx.address, thousandTokens);
  await ftusd.connect(account1).approve(ftusdx.address, thousandTokens);
  await ftusd.connect(account2).approve(ftusdx.address, thousandTokens);
  // Upgrading all fTUSD to fTUSDx
  const upgradeFTUSD = ftusdx.upgrade({ amount: thousandTokens });

  await upgradeFTUSD.exec(owner);
  await upgradeFTUSD.exec(account1);
  await upgradeFTUSD.exec(account2);

  console.log("[INFO]: Copying addresses to local file");

  // store token addresses, cfav1 address in local file
  const addresses = {
    fdaix: fdaix.address,
    fdai: fdai.address,
    fusdcx: fusdcx.address,
    fusdc: fusdc.address,
    ftusdx: ftusdx.address,
    ftusd: ftusd.address,
    host: contractsFramework.host,
    cfa: contractsFramework.cfa,
    resolver: contractsFramework.resolver,
    cfav1Forwarder: contractsFramework.cfaV1Forwarder
  };
  fs.writeFileSync("./client/utils/contractAddresses.json", JSON.stringify(addresses, null, 2));

  console.log("[INFO]: Done deploying, minting and upgrading wrapper tokens [fDAIx, fUSDCx, fTUSDx]");
}

main()
  .catch((error) => console.log("Something went wrong while deploying framework:", error));
