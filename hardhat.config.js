require('@nomicfoundation/hardhat-toolbox');

module.exports = {
  defaultNetwork: "local",
  networks: {
    local: {
      url: "http://127.0.0.1:8545",
    }
  }
};