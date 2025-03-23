import { Injectable, Logger } from "@nestjs/common";
import { ethers } from "ethers";
import { contractAbi } from "../abi/AttestationVerificationRecord.abi";

@Injectable()
export class MultiTeeProtocolService {
  private readonly logger = new Logger(MultiTeeProtocolService.name);

  private provider: ethers.Provider;
  private contract: ethers.Contract;
  private signer: ethers.Wallet;

  /**
   * Updates the attestation verification status of a TEE node to the protocol
   */
  async updateNodeVerificationStatus(
    verifications: Array<{
      verifierTeeId: string;
      verifiedTeeId: string;
      success: boolean;
  }>
  ) {
    console.log('--------------------------------------------------'); 
    console.log('📤 Verification Recorded'); 
    console.log('--------------------------------------------------');
    console.log(verifications);
    try {
      this.provider = new ethers.JsonRpcProvider(
        process.env.RPC
      );
  
      // Get private key from environment
      const privateKey = process.env.PRIVATE_KEY
      if (!privateKey) {
        throw new Error('Private key not found in environment variables');
      }
  
      // Create wallet with private key
      this.signer = new ethers.Wallet(privateKey, this.provider);
  
      // Get contract address from environment
      const contractAddress = "0xe2e74C434DF808074428a73aFe922aEb85b278fa"
      if (!contractAddress) {
        throw new Error('Contract address not found in environment variables');
      }
  
      // Initialize the contract
      this.contract = new ethers.Contract(contractAddress, contractAbi, this.signer);
      // Call the contract function
      console.log('--------------------------------------------------'); 
      console.log('📤 Sending attestation Verification Record to protocol'); 
      console.log('--------------------------------------------------\n\n');
      await this.contract.submitBatchVerifications(verifications);
      console.log('--------------------------------------------------'); 
      console.log('📤 Transaction Complete'); 
      console.log('--------------------------------------------------\n\n');
    } catch (error) {
      console.error('Error submitting batch verifications:', error);
      throw error;
    }
  }

}