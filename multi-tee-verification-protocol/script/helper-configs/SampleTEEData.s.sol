// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

/**
 * @title TEEAttestationConfig
 * @dev Configuration parameters for TEE Attestation System deployment
 * This contract provides configuration values used during deployment
 */
contract SampleTEEData {
    // Owner address for deployed contracts
    address public constant OWNER = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266; // Anvil default address 0
    
    // Sample TEE addresses
    address public constant TEE_ADDRESS_1 = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8; // Anvil address 1
    address public constant TEE_ADDRESS_2 = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC; // Anvil address 2
    address public constant TEE_ADDRESS_3 = 0x90F79bf6EB2c4f870365E785982E1f101E93b906; // Anvil address 3
    address public constant TEE_ADDRESS_4 = 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65; // Anvil address 4
    address public constant TEE_ADDRESS_5 = 0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc; // Anvil address 5
    
    // Sample TEE IDs
    string public constant TEE_ID_1 = "tee001";
    string public constant TEE_ID_2 = "tee002";
    string public constant TEE_ID_3 = "tee003";
    string public constant TEE_ID_4 = "tee004";
    string public constant TEE_ID_5 = "tee005";
    
    // Sample TEE data in JSON format
    string public constant TEE_DATA_1 = 'TEE 1';
    string public constant TEE_DATA_2 = 'TEE 2';
    string public constant TEE_DATA_3 = 'TEE 3';
    string public constant TEE_DATA_4 = 'TEE 4';
    string public constant TEE_DATA_5 = 'TEE 5';
}