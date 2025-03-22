// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import { Test, console } from "forge-std/Test.sol";
import { TEERegistry } from "../src/TEERegistry.sol";
import { MultiTEEStorage } from "../src/MultiTEEStorage.sol";

/**
 * @title TEERegistryDemo
 * @dev Demo contract to test the functionality of the TEERegistry contract
 */
contract TEERegistryDemo is Test {
    TEERegistry public teeRegistry;
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
        
        // Initialize the TEE Registry with this contract as the owner
        teeRegistry = new TEERegistry(owner);
        vm.label(address(teeRegistry), "TEERegistry");
        
        // Setup test data
        testTEEs.push(TEETestData("tee-1", address(0x1), "Intel SGX Device"));
        testTEEs.push(TEETestData("tee-2", address(0x2), "AMD SEV Device"));
        testTEEs.push(TEETestData("tee-3", address(0x3), "ARM TrustZone Device"));
        
        vm.label(address(0x1), "TEE1");
        vm.label(address(0x2), "TEE2");
        vm.label(address(0x3), "TEE3");
    }
    
    function testFullDemo() public {
        console.log("Starting TEERegistry Demo");
        
        // Run the full demo
        testAddTEEs();
        testUpdateTEE();
        testRemoveTEE();
        testGetterFunctions();
        testRemoveAllTEEs();
        
        console.log("\nTEERegistry Demo completed");
    }
    
    function testAddTEEs() public {
        console.log("\n--- 1) Adding 3 TEEs ---");
        
        for (uint i = 0; i < testTEEs.length; i++) {
            teeRegistry.addTEE(testTEEs[i].id, testTEEs[i].addr, testTEEs[i].data);
            console.log("Added TEE:", testTEEs[i].id);
        }
        
        uint count = teeRegistry.getTEECount();
        console.log("Total TEE count:", count);
        
        // Assert the correct number of TEEs were added
        assertEq(count, 3, "Should have 3 TEEs after adding");
        
        // Assert each TEE exists
        for (uint i = 0; i < testTEEs.length; i++) {
            assertTrue(teeRegistry.teeIdExists(testTEEs[i].id), "TEE should exist");
        }
    }
    
    function testUpdateTEE() public {
        // First ensure TEEs are added
        if (teeRegistry.getTEECount() == 0) {
            testAddTEEs();
        }
        
        console.log("\n--- 2) Updating a TEE ---");
        
        // Get original data for logging
        MultiTEEStorage.TEEData memory originalTEE = teeRegistry.getTEEById(testTEEs[1].id);
        console.log("Original TEE address:", originalTEE.teeAddress);
        console.log("Original TEE isActive:", originalTEE.isActive);
        console.log("Original TEE data:", originalTEE.teeData);
        
        // Update the TEE
        address newAddress = address(0x4);
        vm.label(newAddress, "NewTEEAddress");
        bool newStatus = false;
        string memory newData = "Updated AMD SEV Device";
        
        teeRegistry.updateTEE(testTEEs[1].id, newAddress, newStatus, newData);
        console.log("Updated TEE:", testTEEs[1].id);
        
        // Verify update
        MultiTEEStorage.TEEData memory updatedTEE = teeRegistry.getTEEById(testTEEs[1].id);
        console.log("New TEE address:", updatedTEE.teeAddress);
        console.log("New TEE isActive:", updatedTEE.isActive);
        console.log("New TEE data:", updatedTEE.teeData);
        
        // Assert the TEE was updated correctly
        assertEq(updatedTEE.teeAddress, newAddress, "TEE address should be updated");
        assertEq(updatedTEE.isActive, newStatus, "TEE active status should be updated");
        assertEq(updatedTEE.teeData, newData, "TEE data should be updated");
    }
    
    function testRemoveTEE() public {
        // First ensure TEEs are added
        if (teeRegistry.getTEECount() == 0) {
            testAddTEEs();
        }
        
        console.log("\n--- 3) Removing a TEE ---");
        
        // Get count before removal
        uint countBefore = teeRegistry.getTEECount();
        console.log("TEE count before removal:", countBefore);
        
        // Log the TEE to be removed
        console.log("Removing TEE:", testTEEs[0].id);
        
        // Remove a TEE
        teeRegistry.removeTEE(testTEEs[0].id);
        
        // Check count after removal
        uint countAfter = teeRegistry.getTEECount();
        console.log("TEE count after removal:", countAfter);
        
        // Verify the TEE was removed
        bool exists = teeRegistry.teeIdExists(testTEEs[0].id);
        console.log("TEE still exists:", exists);
        
        // Assert the TEE was properly removed
        assertEq(countAfter, countBefore - 1, "TEE count should decrease by 1");
        assertFalse(exists, "TEE should no longer exist");
    }
    
    function testGetterFunctions() public {
        // First ensure we have TEEs and one has been removed
        if (teeRegistry.getTEECount() == 0) {
            testAddTEEs();
            testRemoveTEE();
        }
        
        console.log("\n--- 4) Testing Getter Functions ---");
        
        // Test getTEEById
        MultiTEEStorage.TEEData memory tee = teeRegistry.getTEEById(testTEEs[1].id);
        console.log("getTEEById result - id:", tee.teeId);
        console.log("getTEEById result - address:", tee.teeAddress);
        console.log("getTEEById result - isActive:", tee.isActive);
        console.log("getTEEById result - data:", tee.teeData);
        
        // Test isTEEActive
        bool isActive = teeRegistry.isTEEActive(testTEEs[1].id);
        console.log("isTEEActive for", testTEEs[1].id, ":", isActive);
        
        // Test teeIdExists
        bool existingTee = teeRegistry.teeIdExists(testTEEs[1].id);
        console.log("teeIdExists for", testTEEs[1].id, ":", existingTee);
        
        bool nonExistingTee = teeRegistry.teeIdExists(testTEEs[0].id);
        console.log("teeIdExists for", testTEEs[0].id, ":", nonExistingTee);
        
        // Test getAllTEEIds
        string[] memory allIds = teeRegistry.getAllTEEIds();
        console.log("getAllTEEIds result - count:", allIds.length);
        for (uint i = 0; i < allIds.length; i++) {
            console.log("  TEE ID", i, ":", allIds[i]);
        }
        
        // Test getTEECount
        uint count = teeRegistry.getTEECount();
        console.log("getTEECount result:", count);
        
        // Assertions
        assertTrue(existingTee, "TEE should exist");
        assertFalse(nonExistingTee, "Removed TEE should not exist");
        assertEq(allIds.length, count, "TEE IDs array length should match count");
    }
    
    function testRemoveAllTEEs() public {
        // First ensure we have TEEs
        if (teeRegistry.getTEECount() == 0) {
            testAddTEEs();
        }
        
        console.log("\n--- 5) Removing All TEEs ---");
        
        // Get all remaining TEE IDs
        string[] memory remainingIds = teeRegistry.getAllTEEIds();
        console.log("Remaining TEEs to remove:", remainingIds.length);
        
        // Make a copy of the IDs since we're modifying the array during iteration
        string[] memory idsCopy = new string[](remainingIds.length);
        for (uint i = 0; i < remainingIds.length; i++) {
            idsCopy[i] = remainingIds[i];
        }
        
        // Remove each TEE
        for (uint i = 0; i < idsCopy.length; i++) {
            console.log("Removing TEE:", idsCopy[i]);
            teeRegistry.removeTEE(idsCopy[i]);
        }
        
        // Verify all TEEs are removed
        uint finalCount = teeRegistry.getTEECount();
        console.log("Final TEE count:", finalCount);
        
        // Assert all TEEs are removed
        assertEq(finalCount, 0, "All TEEs should be removed");
        
        // Assert the IDs array is empty
        string[] memory finalIds = teeRegistry.getAllTEEIds();
        assertEq(finalIds.length, 0, "TEE IDs array should be empty");
    }

    function testGetAllTEERecords() public {
        // First ensure we have TEEs
        if (teeRegistry.getTEECount() == 0) {
            testAddTEEs();
        }
        
        console.log("\n--- Testing getAllTEERecords ---");
        
        // Get all TEE records
        (string[] memory ids, MultiTEEStorage.TEEData[] memory data) = teeRegistry.getAllTEERecords();
        
        // Log the results
        console.log("Total records returned:", ids.length);
        
        for (uint i = 0; i < ids.length; i++) {
            console.log("\nRecord", i);
            console.log("  ID:", ids[i]);
            console.log("  Address:", data[i].teeAddress);
            console.log("  Active:", data[i].isActive);
            console.log("  Data:", data[i].teeData);
        }
        
        // Verify the length matches the expected count
        uint expectedCount = teeRegistry.getTEECount();
        assertEq(ids.length, expectedCount, "IDs array length should match TEE count");
        assertEq(data.length, expectedCount, "Data array length should match TEE count");
    }
}