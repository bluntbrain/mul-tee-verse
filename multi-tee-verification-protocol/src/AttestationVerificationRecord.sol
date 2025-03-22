// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "./TEERegistry.sol";
import "./TrustScoreEngine.sol";

/**
 * @title AttestationVerificationRecord
 * @dev Contract for recording attestation verification results between TEEs.
 * Inherits from TrustScoreEngine to use verification count management functionality.
 * Part of the Proof of Attestation consensus mechanism.
 */
contract AttestationVerificationRecord is TrustScoreEngine {
    // Struct to hold verification data
    struct VerificationData {
        string verifierTeeId;
        string verifiedTeeId;
        bool success;
    }
    
    // Events
    event VerificationSubmitted(
        string indexed verifierTeeId, 
        string indexed verifiedTeeId, 
        bool success
    );
    
    /**
     * @dev Constructor to set initial owner and TEE registry
     * @param initialOwner The address that will own this contract
     * @param _teeRegistry Address of the TEE registry contract
     */
    constructor(
        address initialOwner,
        address _teeRegistry
    ) TrustScoreEngine(initialOwner, _teeRegistry) {
        // TrustScoreEngine constructor is called with initialOwner and _teeRegistry
    }

    /**
     * @dev Submit multiple verification results in a single transaction
     * @param _verifications Array of verification data
     * @return success Whether the batch submission was successful
     */
    function submitBatchVerifications(
        VerificationData[] calldata _verifications
    ) 
        external
        returns (bool)
    {
        require(_verifications.length > 0, "Empty verification batch");
        
        // Get verifier TEE ID from the first verification entry
        string memory verifierTeeId = _verifications[0].verifierTeeId;
        
        // Check if verifier TEE exists
        require(teeRegistry.teeIdExists(verifierTeeId), "Verifier TEE does not exist");
        
        // Process each verification in the batch
        for (uint256 i = 0; i < _verifications.length; i++) {
            VerificationData calldata verification = _verifications[i];
            
            // Check conditions and skip invalid entries
            if (!teeRegistry.teeIdExists(verification.verifiedTeeId)) {
                continue;
            }
            
            if (keccak256(abi.encodePacked(verification.verifierTeeId)) == 
                keccak256(abi.encodePacked(verification.verifiedTeeId))) {
                continue;
            }
            
            // Update verification result in the parent contract's storage
            verificationResults[verification.verifiedTeeId][verification.verifierTeeId] = verification.success;
            
            // Emit individual verification event
            emit VerificationSubmitted(
                verification.verifierTeeId, 
                verification.verifiedTeeId, 
                verification.success
            );
        }
        
        // Recalculate verification counts once after all updates
        recalculateVerificationCounts();
        
        return true;
    }
}