import "@fhevm/hardhat-plugin";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-ethers";
import "hardhat-deploy";
import "hardhat-gas-reporter";
import type { HardhatUserConfig } from "hardhat/config";
import { vars } from "hardhat/config";
import "solidity-coverage";

// Prefer environment variable MNEMONIC; fallback to Hardhat vars; default to test mnemonic
let MNEMONIC: string = process.env.MNEMONIC ?? "";
if (!MNEMONIC || MNEMONIC.trim() === "") {
  try {
    MNEMONIC = vars.get("MNEMONIC", "");
  } catch {
    MNEMONIC = "";
  }
}
if (!MNEMONIC || MNEMONIC.trim() === "") {
  MNEMONIC = "test test test test test test test test test test test junk";
}
const INFURA_API_KEY: string = vars.get(
  "INFURA_API_KEY",
  "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz"
);
// Support custom Sepolia RPC URL via environment variable
// Priority: process.env.SEPOLIA_RPC_URL > vars.get("SEPOLIA_RPC_URL") > undefined
let SEPOLIA_RPC_URL: string | undefined = process.env.SEPOLIA_RPC_URL;
if (!SEPOLIA_RPC_URL) {
  try {
    SEPOLIA_RPC_URL = vars.get("SEPOLIA_RPC_URL");
    if (SEPOLIA_RPC_URL === "") {
      SEPOLIA_RPC_URL = undefined;
    }
  } catch {
    SEPOLIA_RPC_URL = undefined;
  }
}

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  namedAccounts: {
    deployer: 0
  },
  etherscan: {
    apiKey: {
      sepolia: vars.get("ETHERSCAN_API_KEY", "")
    }
  },
  gasReporter: {
    currency: "USD",
    enabled: process.env.REPORT_GAS ? true : false,
    excludeContracts: []
  },
  networks: {
    hardhat: {
      accounts: {
        mnemonic: MNEMONIC
      },
      chainId: 31337
    },
    localhost: {
      accounts: {
        mnemonic: MNEMONIC
      },
      chainId: 31337,
      url: "http://127.0.0.1:8545"
    },
    sepolia: {
      accounts: {
        mnemonic: MNEMONIC,
        path: "m/44'/60'/0'/0/",
        count: 10
      },
      chainId: 11155111,
      url: SEPOLIA_RPC_URL || `https://sepolia.infura.io/v3/${INFURA_API_KEY}`
    }
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test"
  },
  solidity: {
    version: "0.8.27",
    settings: {
      metadata: {
        bytecodeHash: "none"
      },
      optimizer: {
        enabled: true,
        runs: 800
      },
      viaIR: true,
      evmVersion: "cancun"
    }
  },
  typechain: {
    outDir: "types",
    target: "ethers-v6"
  }
};

export default config;


