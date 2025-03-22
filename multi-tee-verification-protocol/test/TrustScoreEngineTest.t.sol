// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Test.sol";

import { console } from "forge-std/console.sol";

import { TEERegistry } from "../src/TEERegistry.sol";
import { TrustScoreEngine } from "../src/TrustScoreEngine.sol";
import { AttestationVerificationRecord } from "../src/AttestationVerificationRecord.sol";
import { MultiTEEStorage } from "../src/MultiTEEStorage.sol";

/**
 * @title AttestationVerificationRecordDemo
 * @dev Demo contract to test the functionality of the AttestationVerificationRecord and TrustScoreEngine contracts
 */
contract AttestationVerificationRecordDemo is Test {
    TEERegistry public teeRegistry;
    TrustScoreEngine public trustScoreEngine;
    AttestationVerificationRecord public attestationRecord;
    address public owner;
    
    // TEE test data
    struct TEETestData {
        string id;
        address addr;
        string data;
    }
    
    TEETestData[] internal testTEEs;
    
    function setUp() public {
        owner = address(this);
        vm.label(owner, "Owner");
        
        // Initialize the TEE Registry
        teeRegistry = new TEERegistry(owner);
        vm.label(address(teeRegistry), "TEERegistry");
        
        // Initialize the TrustScoreEngine
        trustScoreEngine = new TrustScoreEngine(owner, address(teeRegistry));
        vm.label(address(trustScoreEngine), "TrustScoreEngine");
        
        // Initialize the AttestationVerificationRecord
        attestationRecord = new AttestationVerificationRecord(owner, address(teeRegistry));
        vm.label(address(attestationRecord), "AttestationVerificationRecord");
        
        // Setup test data
        testTEEs.push(TEETestData("tee-1", address(0x1), "Intel SGX Device"));
        testTEEs.push(TEETestData("tee-2", address(0x2), "AMD SEV Device"));
        testTEEs.push(TEETestData("tee-3", address(0x3), "ARM TrustZone Device"));
        testTEEs.push(TEETestData("tee-4", address(0x4), "RISC-V Keystone Device"));
        testTEEs.push(TEETestData("tee-99", address(0x99), "RISC-V Keystone Device"));
        
        vm.label(address(0x1), "TEE1");
        vm.label(address(0x2), "TEE2");
        vm.label(address(0x3), "TEE3");
        vm.label(address(0x4), "TEE4");
        vm.label(address(0x99), "TEE99");
    }
    
    function testFullDemo() public {
        console.log("Starting AttestationVerificationRecord Demo");
        
        // Run the full demo
        testSetupTEEs();
        testSubmitSingleVerification();
        testSubmitBatchVerifications();
        testGetVerificationCounts();
        testGetAllVerificationCounts();
        testResetAllVerifications();
        
        console.log("\nAttestationVerificationRecord Demo completed");
    }
    
    function testSetupTEEs() public {
        console.log("\n--- 1) Setting up TEEs ---");
        
        for (uint i = 0; i < testTEEs.length; i++) {
            teeRegistry.addTEE(testTEEs[i].id, testTEEs[i].addr, testTEEs[i].data);
            console.log("Added TEE:", testTEEs[i].id);
        }
        
        uint count = teeRegistry.getTEECount();
        console.log("Total TEE count:", count);
        
        // Assert the correct number of TEEs were added
        assertEq(count, testTEEs.length, "Should have correct number of TEEs after adding");
        
        // Assert each TEE exists
        for (uint i = 0; i < testTEEs.length; i++) {
            assertTrue(teeRegistry.teeIdExists(testTEEs[i].id), "TEE should exist");
        }
    }
    
    function testSubmitSingleVerification() public {
        // First ensure TEEs are added
        if (teeRegistry.getTEECount() == 0) {
            testSetupTEEs();
        }
        
        console.log("\n--- 2) Submitting a single verification ---");
        
        // Create a single verification
        AttestationVerificationRecord.VerificationData[] memory verifications = new AttestationVerificationRecord.VerificationData[](1);
        verifications[0] = AttestationVerificationRecord.VerificationData({
            verifierTeeId: testTEEs[0].id,
            verifiedTeeId: testTEEs[1].id,
            success: true
        });
        
        console.log("Submitting verification:");
        console.log("  Verifier:", verifications[0].verifierTeeId);
        console.log("  Verified:", verifications[0].verifiedTeeId);
        console.log("  Success:", verifications[0].success);
        
        // Submit the verification
        bool result = attestationRecord.submitBatchVerifications(verifications);
        console.log("Submission result:", result);
        
        // Check verification result directly
        bool storedResult = attestationRecord.verificationResults(testTEEs[1].id, testTEEs[0].id);
        console.log("Stored verification result:", storedResult);
        
        // Assert the verification was recorded correctly
        assertTrue(result, "Verification submission should succeed");
        assertTrue(storedResult, "Verification result should be true");
    }
    
    function testSubmitBatchVerifications() public {
        // First ensure TEEs are added
        if (teeRegistry.getTEECount() == 0) {
            testSetupTEEs();
        }
        
        console.log("\n--- 3) Submitting batch verifications ---");
        
        // Create a batch of verifications
        AttestationVerificationRecord.VerificationData[] memory verifications = new AttestationVerificationRecord.VerificationData[](5);
        
        // TEE-2 verifies TEE-1, TEE-3, and TEE-4
        verifications[0] = AttestationVerificationRecord.VerificationData({
            verifierTeeId: testTEEs[1].id,
            verifiedTeeId: testTEEs[0].id,
            success: true
        });
        
        verifications[1] = AttestationVerificationRecord.VerificationData({
            verifierTeeId: testTEEs[1].id,
            verifiedTeeId: testTEEs[2].id,
            success: false
        });
        
        verifications[2] = AttestationVerificationRecord.VerificationData({
            verifierTeeId: testTEEs[1].id,
            verifiedTeeId: testTEEs[3].id,
            success: true
        });
        
        // TEE-3 verifies TEE-1 and TEE-2
        verifications[3] = AttestationVerificationRecord.VerificationData({
            verifierTeeId: testTEEs[2].id,
            verifiedTeeId: testTEEs[0].id,
            success: true
        });
        
        verifications[4] = AttestationVerificationRecord.VerificationData({
            verifierTeeId: testTEEs[2].id,
            verifiedTeeId: testTEEs[1].id,
            success: false
        });
        
        console.log("Submitting batch of", verifications.length, "verifications");
        
        // Submit first batch (TEE-2 as verifier)
        AttestationVerificationRecord.VerificationData[] memory batch1 = new AttestationVerificationRecord.VerificationData[](3);
        for (uint i = 0; i < 3; i++) {
            batch1[i] = verifications[i];
        }
        
        bool result1 = attestationRecord.submitBatchVerifications(batch1);
        console.log("Batch 1 submission result:", result1);
        
        // Submit second batch (TEE-3 as verifier)
        AttestationVerificationRecord.VerificationData[] memory batch2 = new AttestationVerificationRecord.VerificationData[](2);
        batch2[0] = verifications[3];
        batch2[1] = verifications[4];
        
        bool result2 = attestationRecord.submitBatchVerifications(batch2);
        console.log("Batch 2 submission result:", result2);
        
        // Add an additional verification from TEE-4
        AttestationVerificationRecord.VerificationData[] memory batch3 = new AttestationVerificationRecord.VerificationData[](3);
        batch3[0] = AttestationVerificationRecord.VerificationData({
            verifierTeeId: testTEEs[3].id,
            verifiedTeeId: testTEEs[0].id,
            success: true
        });
        batch3[1] = AttestationVerificationRecord.VerificationData({
            verifierTeeId: testTEEs[3].id,
            verifiedTeeId: testTEEs[1].id,
            success: true
        });
        batch3[2] = AttestationVerificationRecord.VerificationData({
            verifierTeeId: testTEEs[3].id,
            verifiedTeeId: testTEEs[2].id,
            success: false
        });
        
        bool result3 = attestationRecord.submitBatchVerifications(batch3);
        console.log("Batch 3 submission result:", result3);
        
        // Assert all batch submissions succeeded
        assertTrue(result1 && result2 && result3, "All batch submissions should succeed");
    }
    
    function testGetVerificationCounts() public {
        // First ensure verifications are submitted
        if (teeRegistry.getTEECount() == 0) {
            testSetupTEEs();
            testSubmitBatchVerifications();
        }
        
        console.log("\n--- 4) Getting verification counts for individual TEEs ---");
        
        for (uint i = 0; i < testTEEs.length; i++) {
            string memory teeId = testTEEs[i].id;
            (uint256 total, uint256 successful) = attestationRecord.getVerificationCounts(teeId);
            
            console.log("Verification counts for", teeId, ":");
            console.log("  Total verifications:", total);
            console.log("  Successful verifications:", successful);
            console.log("  Success rate:", successful * 100 / (total > 0 ? total : 1), "%");
            
            // Check verification counts are within expected range
            assertTrue(total <= testTEEs.length - 1, "Total verifications should not exceed TEE count - 1");
        }
    }
    
    function testGetAllVerificationCounts() public {
        // First ensure verifications are submitted
        if (teeRegistry.getTEECount() == 0) {
            testSetupTEEs();
            testSubmitBatchVerifications();
        }
        
        console.log("\n--- 5) Getting all verification counts ---");
        
        (
            string[] memory teeIds, 
            uint256[] memory totalCounts, 
            uint256[] memory successCounts
        ) = attestationRecord.getAllVerificationCounts();
        
        console.log("Retrieved verification counts for", teeIds.length, "TEEs");
        
        for (uint i = 0; i < teeIds.length; i++) {
            console.log("TEE:", teeIds[i]);
            console.log("  Total verifications:", totalCounts[i]);
            console.log("  Successful verifications:", successCounts[i]);
            
            if (totalCounts[i] > 0) {
                console.log("  Success rate:", successCounts[i] * 100 / totalCounts[i], "%");
            } else {
                console.log("  Success rate: N/A (no verifications)");
            }
        }
        
        // Assert array lengths match
        assertEq(teeIds.length, totalCounts.length, "TeeIds and totalCounts arrays should have the same length");
        assertEq(teeIds.length, successCounts.length, "TeeIds and successCounts arrays should have the same length");
        assertEq(teeIds.length, testTEEs.length, "Should have verification counts for all TEEs");
    }
    
    function testResetAllVerifications() public {
        // First ensure verifications are submitted
        if (teeRegistry.getTEECount() == 0) {
            testSetupTEEs();
            testSubmitBatchVerifications();
        }
        
        console.log("\n--- 6) Resetting all verification data ---");
        
        // Get counts before reset
        (
            string[] memory teeIdsBefore, 
            uint256[] memory totalCountsBefore, 
            uint256[] memory successCountsBefore
        ) = attestationRecord.getAllVerificationCounts();
        
        console.log("Verification counts before reset:");
        for (uint i = 0; i < teeIdsBefore.length; i++) {
            console2.log(string.concat("  TEE ", teeIdsBefore[i], ": ", 
                  vm.toString(totalCountsBefore[i]), " total, ", 
                  vm.toString(successCountsBefore[i]), " successful"));
        }
        
        // Reset all verifications
        attestationRecord.resetAllVerifications();
        console.log("All verifications reset");
        
        // Get counts after reset
        (
            string[] memory teeIdsAfter, 
            uint256[] memory totalCountsAfter, 
            uint256[] memory successCountsAfter
        ) = attestationRecord.getAllVerificationCounts();
        
        console.log("Verification counts after reset:");
        for (uint i = 0; i < teeIdsAfter.length; i++) {
            console2.log(string.concat("  TEE ", teeIdsAfter[i], ": ", 
                  vm.toString(totalCountsAfter[i]), " total, ", 
                  vm.toString(successCountsAfter[i]), " successful"));            
            // Assert counts are reset to 0
            assertEq(totalCountsAfter[i], 0, "Total verification count should be reset to 0");
            assertEq(successCountsAfter[i], 0, "Successful verification count should be reset to 0");
        }
    }

    function testEdgeCasesSelfVerification() public {
        console.log("\n--- 7) Testing edge cases: Self-verification ---");
        
        // Ensure TEEs are added
        if (teeRegistry.getTEECount() == 0) {
            testSetupTEEs();
        }
        
        // Attempt self-verification (should be ignored)
        AttestationVerificationRecord.VerificationData[] memory verifications = new AttestationVerificationRecord.VerificationData[](1);
        verifications[0] = AttestationVerificationRecord.VerificationData({
            verifierTeeId: testTEEs[0].id,
            verifiedTeeId: testTEEs[0].id, // Same TEE ID (self-verification)
            success: true
        });
        
        console.log("Attempting self-verification for TEE:", testTEEs[0].id);
        bool result = attestationRecord.submitBatchVerifications(verifications);
        
        // Check verification counts after self-verification attempt
        (uint256 total, uint256 successful) = attestationRecord.getVerificationCounts(testTEEs[0].id);
        
        console.log("Submission result:", result);
        console.log("Total verifications after self-verification attempt:", total);
        console.log("Successful verifications after self-verification attempt:", successful);
        
        // Self-verification should be ignored in the counts
        assertEq(total, 4, "Self-verification should be ignored in total count");
        assertEq(successful, 0, "Self-verification should be ignored in successful count");
    }

    function testEdgeCasesNonExistentTEE() public {
        console.log("\n--- 8) Testing edge cases: Non-existent TEE ---");
        
        // Ensure TEEs are added
        if (teeRegistry.getTEECount() == 0) {
            testSetupTEEs();
        }
        
        // Attempt verification with non-existent verified TEE
        AttestationVerificationRecord.VerificationData[] memory verifications = new AttestationVerificationRecord.VerificationData[](1);
        verifications[0] = AttestationVerificationRecord.VerificationData({
            verifierTeeId: testTEEs[0].id,
            verifiedTeeId: "non-existent-tee",
            success: true
        });
        
        console.log("Attempting verification with non-existent verified TEE");
        bool result = attestationRecord.submitBatchVerifications(verifications);
        console.log("Submission result:", result);
        
        // The submission should succeed but the non-existent TEE verification should be skipped
        assertTrue(result, "Submission with non-existent verified TEE should not fail");
        
        // Attempt verification with non-existent verifier TEE
        verifications[0] = AttestationVerificationRecord.VerificationData({
            verifierTeeId: "non-existent-tee",
            verifiedTeeId: testTEEs[0].id,
            success: true
        });
        
        console.log("Attempting verification with non-existent verifier TEE");
        
        // This should revert because the verifier TEE must exist
        vm.expectRevert("Verifier TEE does not exist");
        attestationRecord.submitBatchVerifications(verifications);
        console.log("Submission correctly reverted as expected");
    }
}