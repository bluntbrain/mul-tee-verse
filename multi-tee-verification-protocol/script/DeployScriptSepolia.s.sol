// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {TEERegistry} from "../src/TEERegistry.sol";
import {AttestationVerificationRecord} from "../src/AttestationVerificationRecord.sol";
import {SampleTEEData} from "./helper-configs/SampleTEEData.s.sol";

contract DeployScriptSepolia is Script {
    // Contract instances
    TEERegistry public teeRegistry;
    AttestationVerificationRecord public attestationVerificationRecord;
    SampleTEEData public sampleTEEData;
    
    function run() external {
        // Load private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("==================================================");
        console.log("Deploying TEE Attestation System to Sepolia");
        console.log("Deployer address:", deployer);
        console.log("==================================================");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy contracts
        sampleTEEData = new SampleTEEData();
        console.log("SampleTEEData deployed at:", address(sampleTEEData));
        
        teeRegistry = new TEERegistry(deployer);
        console.log("TEERegistry deployed at:", address(teeRegistry));

        attestationVerificationRecord = new AttestationVerificationRecord(deployer, address(teeRegistry));
        console.log("AttestationVerificationRecord deployed at:", address(attestationVerificationRecord));

        // Add sample TEEs
        addSampleTEEs();
        
        // Add sample verifications
        addSampleVerifications();
    
        vm.stopBroadcast();
        
    }

    function addSampleTEEs() internal {
        console.log("\n=== Adding Sample TEEs ===");
              
        teeRegistry.addTEE(sampleTEEData.TEE_ID_1(), sampleTEEData.TEE_ADDRESS_1(), sampleTEEData.TEE_DATA_1());
        console.log("Added TEE:", sampleTEEData.TEE_ID_1());
        
        teeRegistry.addTEE(sampleTEEData.TEE_ID_2(), sampleTEEData.TEE_ADDRESS_2(), sampleTEEData.TEE_DATA_2());
        console.log("Added TEE:", sampleTEEData.TEE_ID_2());
        
        teeRegistry.addTEE(sampleTEEData.TEE_ID_3(), sampleTEEData.TEE_ADDRESS_3(), sampleTEEData.TEE_DATA_3());
        console.log("Added TEE:", sampleTEEData.TEE_ID_3());
        
        teeRegistry.addTEE(sampleTEEData.TEE_ID_4(), sampleTEEData.TEE_ADDRESS_4(), sampleTEEData.TEE_DATA_4());
        console.log("Added TEE:", sampleTEEData.TEE_ID_4());
        
        teeRegistry.addTEE(sampleTEEData.TEE_ID_5(), sampleTEEData.TEE_ADDRESS_5(), sampleTEEData.TEE_DATA_5());
        console.log("Added TEE:", sampleTEEData.TEE_ID_5());
        
        console.log("Sample TEEs added successfully");
    }

    function addSampleVerifications() internal {
        console.log("\n=== Adding Sample Verifications ===");
        
        // Create a larger verification data array (1->2, 1->3, 1->4, 1->5, 2->3, 2->4, 3->5)
        AttestationVerificationRecord.VerificationData[] 
            memory verifications = new AttestationVerificationRecord.VerificationData[](7);
        
        // TEE 1 verifies TEE 2 (success)
        verifications[0] = AttestationVerificationRecord.VerificationData({
            verifierTeeId: sampleTEEData.TEE_ID_1(),
            verifiedTeeId: sampleTEEData.TEE_ID_2(),
            success: true
        });
        
        // TEE 1 verifies TEE 3 (failure)
        verifications[1] = AttestationVerificationRecord.VerificationData({
            verifierTeeId: sampleTEEData.TEE_ID_1(),
            verifiedTeeId: sampleTEEData.TEE_ID_3(),
            success: false
        });
        
        // TEE 1 verifies TEE 4 (success)
        verifications[2] = AttestationVerificationRecord.VerificationData({
            verifierTeeId: sampleTEEData.TEE_ID_1(),
            verifiedTeeId: sampleTEEData.TEE_ID_4(),
            success: true
        });
        
        // TEE 1 verifies TEE 5 (success)
        verifications[3] = AttestationVerificationRecord.VerificationData({
            verifierTeeId: sampleTEEData.TEE_ID_1(),
            verifiedTeeId: sampleTEEData.TEE_ID_5(),
            success: true
        });
        
        // TEE 2 verifies TEE 3 (success)
        verifications[4] = AttestationVerificationRecord.VerificationData({
            verifierTeeId: sampleTEEData.TEE_ID_2(),
            verifiedTeeId: sampleTEEData.TEE_ID_3(),
            success: true
        });
        
        // TEE 2 verifies TEE 4 (failure)
        verifications[5] = AttestationVerificationRecord.VerificationData({
            verifierTeeId: sampleTEEData.TEE_ID_2(),
            verifiedTeeId: sampleTEEData.TEE_ID_4(),
            success: false
        });
        
        // TEE 3 verifies TEE 5 (success)
        verifications[6] = AttestationVerificationRecord.VerificationData({
            verifierTeeId: sampleTEEData.TEE_ID_3(),
            verifiedTeeId: sampleTEEData.TEE_ID_5(),
            success: true
        });
        
        // Submit batch
        attestationVerificationRecord.submitBatchVerifications(verifications);
        console.log("Submitted 7 verification records");
        
        // Add a second batch with more cross-verifications
        AttestationVerificationRecord.VerificationData[] 
            memory verifications2 = new AttestationVerificationRecord.VerificationData[](6);
            
        // TEE 2 verifies TEE 1 (success)
        verifications2[0] = AttestationVerificationRecord.VerificationData({
            verifierTeeId: sampleTEEData.TEE_ID_2(),
            verifiedTeeId: sampleTEEData.TEE_ID_1(),
            success: true
        });
        
        // TEE 3 verifies TEE 1 (success)
        verifications2[1] = AttestationVerificationRecord.VerificationData({
            verifierTeeId: sampleTEEData.TEE_ID_3(),
            verifiedTeeId: sampleTEEData.TEE_ID_1(),
            success: true
        });
        
        // TEE 3 verifies TEE 2 (success)
        verifications2[2] = AttestationVerificationRecord.VerificationData({
            verifierTeeId: sampleTEEData.TEE_ID_3(),
            verifiedTeeId: sampleTEEData.TEE_ID_2(),
            success: true
        });
        
        // TEE 4 verifies TEE 1 (failure)
        verifications2[3] = AttestationVerificationRecord.VerificationData({
            verifierTeeId: sampleTEEData.TEE_ID_4(),
            verifiedTeeId: sampleTEEData.TEE_ID_1(),
            success: false
        });
        
        // TEE 4 verifies TEE 5 (success)
        verifications2[4] = AttestationVerificationRecord.VerificationData({
            verifierTeeId: sampleTEEData.TEE_ID_4(),
            verifiedTeeId: sampleTEEData.TEE_ID_5(),
            success: true
        });
        
        // TEE 5 verifies TEE 2 (success)
        verifications2[5] = AttestationVerificationRecord.VerificationData({
            verifierTeeId: sampleTEEData.TEE_ID_5(),
            verifiedTeeId: sampleTEEData.TEE_ID_2(),
            success: true
        });
        
        // Submit second batch
        attestationVerificationRecord.submitBatchVerifications(verifications2);
        console.log("Submitted 6 more verification records");
        
        console.log("Sample verification data submitted successfully");
    }

}