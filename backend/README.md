# Backend (Hardhat)

This directory contains the Hardhat project for the DeFi Risk Analyzer smart contract.

## Commands:

- Install
  ```
  npm install
  ```
- Start local node
  ```
  npm run node
  ```
- Deploy to localhost
  ```
  npm run deploy:localhost
  ```
- Deploy to Sepolia (set vars first)
  ```
  npx hardhat vars set MNEMONIC "test test test test test test test test test test test junk"
  npx hardhat vars set INFURA_API_KEY "<YOUR_INFURA_KEY>"
  npm run deploy:sepolia
  ```

The deployment artifacts are saved under `deployments/<chain>/DeFiRiskAnalyzer.json`.


