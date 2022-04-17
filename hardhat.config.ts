import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "@nomiclabs/hardhat-ethers";

dotenv.config();


task("addLiqudity", "add tokens to pool")
  .addParam("address", "The contract address on Rinkeby")
  .addParam("tokena", "address first token")
  .addParam("tokenb", "address second token")
  .addParam("tokenamin", "minimum number of tokens")
  .addParam("tokenbmin", "minimum number of tokens")
  .addParam("to", "address  to")
  .addParam("deadline", "deadline transaction")
  .setAction(async (taskArgs, hre) => {
    const contract = await hre.ethers.getContractAt("Adapter", taskArgs.address)
    await contract.addLiquidity(
      taskArgs.tokena,
      taskArgs.tokenb,
      taskArgs.tokenamin,
      taskArgs.tokenbmin,
      taskArgs.to,
      taskArgs.deadline
    );
  });

task("removeLiquidity", "add tokens to pool")
  .addParam("address", "The contract address on Rinkeby")
  .addParam("tokena", "address first token")
  .addParam("tokenb", "address second token")
  .addParam("liquidity", "remove liquidity")
  .addParam("tokenamin", "minimum number of tokens")
  .addParam("tokenbmin", "minimum number of tokens")
  .addParam("to", "address  to")
  .addParam("deadline", "deadline transaction")
  .setAction(async (taskArgs, hre) => {
    const contract = await hre.ethers.getContractAt("Adapter", taskArgs.address)
    await contract.removeLiquidity(
      taskArgs.tokena,
      taskArgs.tokenb,
      taskArgs.liquidity,
      taskArgs.tokenamin,
      taskArgs.tokenbmin,
      taskArgs.to,
      taskArgs.deadline
    );
  });

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: "0.8.4",
  networks: {
    rinkeby: {
      url: `https://eth-rinkeby.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts:
        process.env.RINKEBY_PRIVATE_KEY !== undefined ? [process.env.RINKEBY_PRIVATE_KEY] : [],
    },
    hardhat: {
      initialBaseFeePerGas: 0,
      forking: {
        enabled: true,
        url: process.env.RINKEBY_URL || '',
        blockNumber: 10509242,
      }
    },
    bscTestnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      gasPrice: 20000000000,
      accounts:
        process.env.RINKEBY_PRIVATE_KEY !== undefined ? [process.env.RINKEBY_PRIVATE_KEY] : [],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: {
      rinkeby: process.env.ETHERSCAN_API_KEY,
      bscTestnet: process.env.BSCSCAN_API_KEY,
    },
  },
};


export default config;
