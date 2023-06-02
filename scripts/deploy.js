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

  // deploy wrapper tokens dai,usdc,usdt and store addresses in local file
  console.log("[INFO]: Deploying wrapper token contracts [fDAIx, fUSDCx, fTUSDx]");

  const millionEther = ethers.utils.parseEther("1000000").toString();
  // deploying 1 million test DAI, USDC, TUSD tokens and wrapping them
  await superTokenDeployer.deployWrapperSuperToken(
    "Fake DAI Token",
    "fDAI",
    18,
    millionEther
  );

  await superTokenDeployer.deployWrapperSuperToken(
    "Fake USDC Token",
    "fUSDC",
    18,
    millionEther
  );

  await superTokenDeployer.deployWrapperSuperToken(
    "Fake TUSD Token",
    "fTUSD",
    18,
    millionEther
  );

  const thousandEther = ethers.utils.parseEther("1000");

  console.log("[INFO]: Minting and upgrading wrapper tokens [fDAIx, fUSDCx, fTUSDx] to first 3 accounts");
  // load wrapper tokens and mint to all accounts
  const fdaix = await sf.loadSuperToken("fDAIx");
  const fdai = new ethers.Contract(fdaix.underlyingToken.address, TestToken.abi, owner);

  const fusdcx = await sf.loadSuperToken("fUSDCx");
  const fusdc = new ethers.Contract(fusdcx.underlyingToken.address, TestToken.abi, owner);

  const ftusdx = await sf.loadSuperToken("fTUSDx");
  const ftusd = new ethers.Contract(ftusdx.underlyingToken.address, TestToken.abi, owner);



  // minting and wrapping test DAI to all accounts
  await fdai.mint(owner.address, thousandEther);
  await fdai.mint(account1.address, thousandEther);
  await fdai.mint(account2.address, thousandEther);

  // minting and wrapping test USDC to all accounts
  await fusdc.mint(owner.address, thousandEther);
  await fusdc.mint(account1.address, thousandEther);
  await fusdc.mint(account2.address, thousandEther);

  // minting and wrapping test TUSD to all accounts
  await ftusd.mint(owner.address, thousandEther);
  await ftusd.mint(account1.address, thousandEther);
  await ftusd.mint(account2.address, thousandEther);

  // approving DAIx to spend DAI (Super Token object is not an ethers contract object and has different operation syntax)
  await fdai.approve(fdaix.address, thousandEther);
  await fdai.connect(account1).approve(fdaix.address, thousandEther);
  await fdai.connect(account2).approve(fdaix.address, thousandEther);
  // Upgrading all DAI to DAIx
  const ownerUpgradeDAI = fdaix.upgrade({ amount: thousandEther });
  const account1UpgradeDAI = fdaix.upgrade({ amount: thousandEther });
  const account2UpgradeDAI = fdaix.upgrade({ amount: thousandEther });

  await ownerUpgradeDAI.exec(owner);
  await account1UpgradeDAI.exec(account1);
  await account2UpgradeDAI.exec(account2);

  // approving USDCx to spend USDC (Super Token object is not an ethers contract object and has different operation syntax)
  await fusdc.approve(fusdcx.address, thousandEther);
  await fusdc.connect(account1).approve(fusdcx.address, thousandEther);
  await fusdc.connect(account2).approve(fusdcx.address, thousandEther);
  // Upgrading all USDC to USDCx
  const ownerUpgradeUSDC = fusdcx.upgrade({ amount: thousandEther });
  const account1UpgradeUSDC = fusdcx.upgrade({ amount: thousandEther });
  const account2UpgradeUSDC = fusdcx.upgrade({ amount: thousandEther });

  await ownerUpgradeUSDC.exec(owner);
  await account1UpgradeUSDC.exec(account1);
  await account2UpgradeUSDC.exec(account2);

  // approving TUSDx to spend TUSD (Super Token object is not an ethers contract object and has different operation syntax)
  await ftusd.approve(ftusdx.address, thousandEther);
  await ftusd.connect(account1).approve(ftusdx.address, thousandEther);
  await ftusd.connect(account2).approve(ftusdx.address, thousandEther);
  // Upgrading all TUSD to TUSDx
  const ownerUpgradeTUSD = ftusdx.upgrade({ amount: thousandEther });
  const account1UpgradeTUSD = ftusdx.upgrade({ amount: thousandEther });
  const account2UpgradeTUSD = ftusdx.upgrade({ amount: thousandEther });

  await ownerUpgradeTUSD.exec(owner);
  await account1UpgradeTUSD.exec(account1);
  await account2UpgradeTUSD.exec(account2);

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

  console.log("[INFO]: Done deploying and minting wrapper tokens [fDAIx, fUSDCx, fTUSDx]");
}

main()
  .catch((error) => console.log("Something went wrong while deploying framework:", error));
