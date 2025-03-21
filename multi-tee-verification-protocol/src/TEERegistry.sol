// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "./MultiTEEStorage.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TEERegistry
 * @dev Registry contract for managing TEEs in a distributed attestation network.
 * This contract inherits from MultiTEEStorage and implements functions to add, update, and remove TEEs.
 * It serves as the administrative layer for the Proof of Attestation consensus mechanism.
 * Uses OpenZeppelin's Ownable for access control.
 */
contract TEERegistry is MultiTEEStorage, Ownable {
    
    // Events
    event TEEAdded(string indexed teeId, address indexed teeAddress);
    event TEEUpdated(string indexed teeId, address indexed teeAddress, bool isActive, string teeData);
    event TEERemoved(string indexed teeId);
    
    /**
     * @dev Constructor to set initial owner
     * @param initialOwner The address that will own this contract
     */
    constructor(address initialOwner) Ownable(initialOwner) {
        // Ownable constructor is called with initialOwner
    }
    
    /**
     * @dev Add a new TEE to the registry
     * @param _teeId Unique identifier for the TEE
     * @param _teeAddress On-chain address associated with the TEE
     * @param _teeData Additional TEE data
     */
    function addTEE(string memory _teeId, address _teeAddress, string memory _teeData) 
        external
        onlyOwner
        teeDoesNotExist(_teeId)
    {
        require(_teeAddress != address(0), "Invalid TEE address");
        
        // Store TEE data in the inherited storage
        teeRecords[_teeId] = TEEData({
            teeId: _teeId,
            teeAddress: _teeAddress,
            isActive: true,
            teeData: _teeData
        });
        
        // Add the TEE ID to the array
        teeIds.push(_teeId);
        teeIdToIndex[_teeId] = teeIds.length - 1;
        
        emit TEEAdded(_teeId, _teeAddress);
    }
    
    /**
     * @dev Update all TEE data at once
     * @param _teeId Unique identifier for the TEE
     * @param _newAddress New address for the TEE
     * @param _isActive New active status
     * @param _teeData New TEE data
     */
    function updateTEE(
        string memory _teeId, 
        address _newAddress, 
        bool _isActive, 
        string memory _teeData
    ) 
        external
        onlyOwner
        teeExists(_teeId)
    {
        TEEData storage tee = teeRecords[_teeId];

        // Update the address
        tee.teeAddress = _newAddress;
        tee.isActive = _isActive;
        tee.teeData = _teeData;

        emit TEEUpdated(_teeId, _newAddress, _isActive, _teeData);
    }
    
    /**
     * @dev Set TEE active status
     * @param _teeId Unique identifier for the TEE
     * @param _isActive New active status
     */
    function setTEEActive(string memory _teeId, bool _isActive) 
        external
        onlyOwner
        teeExists(_teeId)
    {
        teeRecords[_teeId].isActive = _isActive;
    }
    
    /**
     * @dev Remove a TEE from the registry
     * @param _teeId Unique identifier for the TEE
     */
    function removeTEE(string memory _teeId) 
        external
        onlyOwner
        teeExists(_teeId)
    {
        // Remove the TEE ID from the array directly in this contract
        uint256 indexToRemove = teeIdToIndex[_teeId];
        uint256 lastIndex = teeIds.length - 1;
        
        // If the TEE to remove is not the last one
        if (indexToRemove != lastIndex) {
            // Move the last TEE to the position of the TEE to remove
            string memory lastTeeId = teeIds[lastIndex];
            teeIds[indexToRemove] = lastTeeId;
            teeIdToIndex[lastTeeId] = indexToRemove;
        }
        
        // Remove the last element
        teeIds.pop();
        delete teeIdToIndex[_teeId];
        
        // Delete from the mapping
        delete teeRecords[_teeId];
        
        emit TEERemoved(_teeId);
    }
    
    /**
     * @dev Override renounceOwnership to prevent accidentally leaving the contract without an owner
     */
    function renounceOwnership() public override onlyOwner view {
        revert("Ownership cannot be renounced for security reasons");
    }
}