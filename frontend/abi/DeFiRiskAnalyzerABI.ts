
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const DeFiRiskAnalyzerABI = {
  "abi": [
    {
      "inputs": [],
      "name": "ZamaProtocolUnsupported",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "externalEuint32",
          "name": "cipherAssets",
          "type": "bytes32"
        },
        {
          "internalType": "externalEuint32",
          "name": "cipherRiskPref",
          "type": "bytes32"
        },
        {
          "internalType": "externalEuint32",
          "name": "cipherPositionVol",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "inputProof",
          "type": "bytes"
        }
      ],
      "name": "analyze",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "confidentialProtocolId",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getAll",
      "outputs": [
        {
          "internalType": "euint32",
          "name": "riskScore",
          "type": "bytes32"
        },
        {
          "internalType": "euint8",
          "name": "riskLevel",
          "type": "bytes32"
        },
        {
          "internalType": "euint8",
          "name": "stablePct",
          "type": "bytes32"
        },
        {
          "internalType": "euint8",
          "name": "bluechipPct",
          "type": "bytes32"
        },
        {
          "internalType": "euint8",
          "name": "highRiskPct",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getRecommendations",
      "outputs": [
        {
          "internalType": "euint8",
          "name": "stable",
          "type": "bytes32"
        },
        {
          "internalType": "euint8",
          "name": "bluechip",
          "type": "bytes32"
        },
        {
          "internalType": "euint8",
          "name": "highRisk",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getRiskLevel",
      "outputs": [
        {
          "internalType": "euint8",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getRiskScore",
      "outputs": [
        {
          "internalType": "euint32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ]
} as const;

