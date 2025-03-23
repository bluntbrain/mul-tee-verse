export const contractAbi = [
    {
      "type": "constructor",
      "inputs": [
        {
          "name": "initialOwner",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "_teeRegistry",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "getAllVerificationCounts",
      "inputs": [],
      "outputs": [
        {
          "name": "teeIds",
          "type": "string[]",
          "internalType": "string[]"
        },
        {
          "name": "totalVerificationCounts",
          "type": "uint256[]",
          "internalType": "uint256[]"
        },
        {
          "name": "successfulVerificationCounts",
          "type": "uint256[]",
          "internalType": "uint256[]"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "getVerificationCounts",
      "inputs": [
        {
          "name": "_teeId",
          "type": "string",
          "internalType": "string"
        }
      ],
      "outputs": [
        {
          "name": "totalVerifications",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "successfulVerifications",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "owner",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "address"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "renounceOwnership",
      "inputs": [],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "resetAllVerifications",
      "inputs": [],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "submitBatchVerifications",
      "inputs": [
        {
          "name": "_verifications",
          "type": "tuple[]",
          "internalType": "struct AttestationVerificationRecord.VerificationData[]",
          "components": [
            {
              "name": "verifierTeeId",
              "type": "string",
              "internalType": "string"
            },
            {
              "name": "verifiedTeeId",
              "type": "string",
              "internalType": "string"
            },
            {
              "name": "success",
              "type": "bool",
              "internalType": "bool"
            }
          ]
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "bool",
          "internalType": "bool"
        }
      ],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "teeRegistry",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "address",
          "internalType": "contract TEERegistry"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "transferOwnership",
      "inputs": [
        {
          "name": "newOwner",
          "type": "address",
          "internalType": "address"
        }
      ],
      "outputs": [],
      "stateMutability": "nonpayable"
    },
    {
      "type": "function",
      "name": "verificationCounts",
      "inputs": [
        {
          "name": "",
          "type": "string",
          "internalType": "string"
        }
      ],
      "outputs": [
        {
          "name": "totalVerifications",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "successfulVerifications",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "function",
      "name": "verificationResults",
      "inputs": [
        {
          "name": "",
          "type": "string",
          "internalType": "string"
        },
        {
          "name": "",
          "type": "string",
          "internalType": "string"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "bool",
          "internalType": "bool"
        }
      ],
      "stateMutability": "view"
    },
    {
      "type": "event",
      "name": "OwnershipTransferred",
      "inputs": [
        {
          "name": "previousOwner",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        },
        {
          "name": "newOwner",
          "type": "address",
          "indexed": true,
          "internalType": "address"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "VerificationCountsUpdated",
      "inputs": [
        {
          "name": "teeId",
          "type": "string",
          "indexed": true,
          "internalType": "string"
        },
        {
          "name": "totalVerifications",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        },
        {
          "name": "successfulVerifications",
          "type": "uint256",
          "indexed": false,
          "internalType": "uint256"
        }
      ],
      "anonymous": false
    },
    {
      "type": "event",
      "name": "VerificationSubmitted",
      "inputs": [
        {
          "name": "verifierTeeId",
          "type": "string",
          "indexed": true,
          "internalType": "string"
        },
        {
          "name": "verifiedTeeId",
          "type": "string",
          "indexed": true,
          "internalType": "string"
        },
        {
          "name": "success",
          "type": "bool",
          "indexed": false,
          "internalType": "bool"
        }
      ],
      "anonymous": false
    },
    {
      "type": "error",
      "name": "OwnableInvalidOwner",
      "inputs": [
        {
          "name": "owner",
          "type": "address",
          "internalType": "address"
        }
      ]
    },
    {
      "type": "error",
      "name": "OwnableUnauthorizedAccount",
      "inputs": [
        {
          "name": "account",
          "type": "address",
          "internalType": "address"
        }
      ]
    }
  ]
  