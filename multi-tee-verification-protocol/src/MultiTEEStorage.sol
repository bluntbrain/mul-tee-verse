// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

/**
 * @title MultiTEEStorage
 * @dev Storage contract for storing TEE data in a distributed MultiTEE network.
 * This contract serves as the data layer for the Proof of Attestation Consensus Mechanism.
 * Stores TEE identifiers, blockchain addresses, activation status, 
 * attestation data and Trust Scores.
 */
contract MultiTEEStorage {
    // Structs
    struct TEEData {
        string teeId;
        address teeAddress;
        bool isActive;
        string teeData;
    }
    
    // State variables
    mapping(string => TEEData) internal teeRecords;
    
    // Events
    event TEEStored(string indexed teeId, address indexed teeAddress);
    event TEEStatusChanged(string indexed teeId, bool isActive);
    
    // Modifiers
    modifier teeExists(string memory _teeId) {
        require(teeRecords[_teeId].teeAddress != address(0), "TEE does not exist");
        _;
    }
    modifier teeDoesNotExist(string memory _teeId) {
        require(teeRecords[_teeId].teeAddress == address(0), "TEE already exists");
        _;
    }
    
    // Getter Functions
    
    /**
     * @dev Get TEE data by ID
     * @param _teeId Unique identifier for the TEE
     * @return TEE data structure
     */
    function getTEEById(string memory _teeId) external view teeExists(_teeId) returns (TEEData memory) {
        return teeRecords[_teeId];
    }
    
    /**
     * @dev Check if a TEE is active
     * @param _teeId Unique identifier for the TEE
     * @return Activity status
     */
    function isTEEActive(string memory _teeId) external view teeExists(_teeId) returns (bool) {
        return teeRecords[_teeId].isActive;
    }
    
    /**
     * @dev Check if a TEE exists
     * @param _teeId Unique identifier for the TEE
     * @return Whether the TEE exists
     */
    function teeIdExists(string memory _teeId) external view returns (bool) {
        return teeRecords[_teeId].teeAddress != address(0);
    }
}