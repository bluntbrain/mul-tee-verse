// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "./TEERegistry.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TrustScoreEngine
 * @dev Contract for calculating and storing verification counts for TEEs.
 * Provides functionality to manage verification counts and reset verification data.
 * Part of the Proof of Attestation consensus mechanism.
 */
contract TrustScoreEngine is Ownable {
    // Reference to the TEE registry
    TEERegistry public teeRegistry;
    
    // Struct to store verification counts
    struct VerificationCounts {
        uint256 totalVerifications;
        uint256 successfulVerifications;
    }
    
    // Verification results: verified TEE ID -> verifier TEE ID -> result
    mapping(string => mapping(string => bool)) public verificationResults;
    
    // Store verification counts for each TEE
    mapping(string => VerificationCounts) public verificationCounts;
    
    // Events
    event VerificationCountsUpdated(
        string indexed teeId, 
        uint256 totalVerifications, 
        uint256 successfulVerifications
    );
    
    /**
     * @dev Constructor to set initial owner and TEE registry
     * @param initialOwner The address that will own this contract
     * @param _teeRegistry Address of the TEE registry contract
     */
    constructor(
        address initialOwner,
        address _teeRegistry
    ) Ownable(initialOwner) {
        teeRegistry = TEERegistry(_teeRegistry);
    }
    
    /**
     * @dev Calculate verification counts by iterating through all verifications
     */
    function recalculateVerificationCounts() internal {        
        // Get all TEE IDs for iteration
        string[] memory allTeeIds = teeRegistry.getAllTEEIds();
        
        for (uint256 i = 0; i < allTeeIds.length; i++) {
            string memory teeId = allTeeIds[i];
            uint256 totalVerifications = 0;
            uint256 successfulVerifications = 0;

            // Iterate through all TEEs as potential verifiers
            for (uint256 k = 0; k < allTeeIds.length; k++) {
                string memory verifierId = allTeeIds[k];
                // Skip if it's the same TEE
                if (keccak256(abi.encodePacked(teeId)) == keccak256(abi.encodePacked(verifierId))) {
                    continue;
                }
                
                totalVerifications++;
                if (verificationResults[teeId][verifierId]) {
                        successfulVerifications++;
                }
            }

            // Update verification counts
            verificationCounts[teeId] = VerificationCounts({
                totalVerifications: totalVerifications,
                successfulVerifications: successfulVerifications
            });
        
            emit VerificationCountsUpdated(teeId, totalVerifications, successfulVerifications);
        }
    }
    
    /**
     * @dev Get verification counts for a TEE
     * @param _teeId TEE ID to get counts for
     * @return totalVerifications Total verifications
     * @return successfulVerifications Successful verifications
     */
    function getVerificationCounts(string calldata _teeId) 
        external 
        view 
        returns (uint256 totalVerifications, uint256 successfulVerifications) 
    {
        VerificationCounts memory counts = verificationCounts[_teeId];
        return (counts.totalVerifications, counts.successfulVerifications);
    }

    /**
     * @dev Get all verification counts for all TEEs
     * @return teeIds Array of all TEE IDs
     * @return totalVerificationCounts Array of total verification counts
     * @return successfulVerificationCounts Array of successful verification counts
     */
    function getAllVerificationCounts() 
        external 
        view 
        returns (
            string[] memory teeIds, 
            uint256[] memory totalVerificationCounts, 
            uint256[] memory successfulVerificationCounts
        ) 
    {
        // Get all TEE IDs from the registry
        teeIds = teeRegistry.getAllTEEIds();
        
        // Create arrays for verification counts
        totalVerificationCounts = new uint256[](teeIds.length);
        successfulVerificationCounts = new uint256[](teeIds.length);
        
        // Populate the arrays with verification counts
        for (uint256 i = 0; i < teeIds.length; i++) {
            VerificationCounts memory counts = verificationCounts[teeIds[i]];
            totalVerificationCounts[i] = counts.totalVerifications;
            successfulVerificationCounts[i] = counts.successfulVerifications;
        }
        
        return (teeIds, totalVerificationCounts, successfulVerificationCounts);
    }
    
    /**
     * @dev Reset all verification data for all TEEs
     */
    function resetAllVerifications() external onlyOwner {
        string[] memory allTeeIds = teeRegistry.getAllTEEIds();
        
        for (uint256 i = 0; i < allTeeIds.length; i++) {
            string memory teeId = allTeeIds[i];
            
            // Clear all verifications involving this TEE
            for (uint256 j = 0; j < allTeeIds.length; j++) {
                delete verificationResults[teeId][allTeeIds[j]];
            }
            
            // Reset verification counts
            delete verificationCounts[teeId];
            
            emit VerificationCountsUpdated(teeId, 0, 0);
        }
    }
}