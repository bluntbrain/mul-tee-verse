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
     * @dev Submit a verification result for another TEE
     * @param _verifierTeeId ID of the TEE submitting the verification
     * @param _verifiedTeeId ID of the TEE being verified
     * @param _success Whether the verification was successful
     */
    function submitVerification(
        string calldata _verifierTeeId,
        string calldata _verifiedTeeId,
        bool _success
    ) 
        external
        returns (bool)
    {
        // Check if TEEs exist and are active
        require(teeRegistry.teeIdExists(_verifierTeeId), "Verifier TEE does not exist");
        require(teeRegistry.teeIdExists(_verifiedTeeId), "Verified TEE does not exist");
        
        // Get TEE data for verification
        TEERegistry.TEEData memory verifierData = teeRegistry.getTEEById(_verifierTeeId);
        TEERegistry.TEEData memory verifiedData = teeRegistry.getTEEById(_verifiedTeeId);
        
        // Check if TEEs are active
        require(verifierData.isActive, "Verifier TEE is not active");
        require(verifiedData.isActive, "Verified TEE is not active");
        
        // Verify that TEEs are different (prevent self-verification)
        require(
            keccak256(abi.encodePacked(_verifierTeeId)) != keccak256(abi.encodePacked(_verifiedTeeId)),
            "Cannot verify self"
        );
        
        // Authenticate caller (must be the address associated with the verifier TEE)
        require(msg.sender == verifierData.teeAddress, "Caller is not the verifier TEE address");
        
        // Update verification result in the parent contract's storage
        verificationResults[_verifiedTeeId][_verifierTeeId] = _success;
        
        // Recalculate verification counts using the parent contract's method
        recalculateVerificationCounts();
        
        emit VerificationSubmitted(_verifierTeeId, _verifiedTeeId, _success);
        
        return true;
    }
}