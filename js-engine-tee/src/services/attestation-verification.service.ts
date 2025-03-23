import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as fs from 'fs';
import * as util from 'util';
import { exec } from 'child_process';
import axios from 'axios';
import { TeeService } from 'src/services/tee.service';
import { MultiTeeProtocolService } from './multi-tee-protocol.service';

const execPromise = util.promisify(exec);

@Injectable()
export class AttestationVerificationService {
    
    private readonly logger = new Logger(AttestationVerificationService.name);

    constructor(
        private readonly teeService: TeeService,
        private readonly multiTeeProtocolService: MultiTeeProtocolService
    ) {}

    /**
    * 
    * Network Attestation Verification Cron Job
    * This scheduled task runs at the configured interval
    * to verify the attestation of the TEE environments in network.
    * 
    * Process:
    * 1. Fetches a TDX attestation quote from all TEE in network
    * 2. Stores the quote in a temporary hex file
    * 3. Verifies the quote using Intel's DCAP Quote Verification Library
    * 4. log the verification to Attestation Protocol
    * 
    * This verification ensures that the all remote TEEs are running in 
    * secure, trusted execution environment with the expected configuration.
    */
    @Cron(`${process.env.CRON_SECONDS || '15'} * * * * *`, {
        name: 'attestation-verification-job'
    })
    async handleNetworkAttestationVerification() {
        const networkTees = this.teeService.getNetworkTeeNodes();

        // Array to store verification results for all TEEs
        const verificationResults: Array<{
            verifierTeeId: string;
            verifiedTeeId: string;
            success: boolean;
        }> = [];

        for (const tee of networkTees) {
            try {
                if(tee.appId===process.env.APP_ID) {
                    console.log(`⏩ Skipping self-verification for ${process.env.APP_ID}`);
                    continue;
                }
                console.log('--------------------------------------------------'); 
                console.log(`🔥 Attestation Verification for TEE node: ${tee.appId}`); 
                console.log('--------------------------------------------------');
                
                // Fetch Attestation Quotes from the Remote TEEs
                const attestationUrl = `https://${tee.appId}-8080.dstack-prod5.phala.network/attestation`;  
                const response = await axios.get(attestationUrl, { timeout: 10000 });
                const quote = response.data.quote;
                const cleanedQuote = quote.replace(/^"(.*)"$/, '$1');
                
                // Create a temp file for verification
                fs.writeFileSync('quote.hex', cleanedQuote);
                await execPromise('xxd -r -p quote.hex quote.bin');

                // Verify the quote using dcap-qvl(Intel's DCAP Quote Verification Library)
                const { stdout, stderr } = await execPromise('dcap-qvl verify quote.bin');
                if (stdout) {
                    console.log(`Verification output :`);
                    console.log(`${stdout}`);
                }
                if (stderr) {
                    console.log(`Verification messages :`);
                    console.log(`${stderr}`);
                }
                
                // Log the verification result to Protocol
                const isVerified = stderr.includes('Quote verified');
                console.log('--------------------------------------------------'); 
                console.log(`🔥 Verification Result for TEE ${tee.appId}: ${isVerified ? 'Verified' : 'Not Verified'}`); 
                console.log('--------------------------------------------------\n\n');
                
                // Cleanup temp files
                fs.unlinkSync('quote.hex');
                fs.unlinkSync('quote.bin');

                // Add the verification result to the array in the expected format
                verificationResults.push({
                    verifierTeeId: `${process.env.APP_ID}`,
                    verifiedTeeId: tee.appId,
                    success: isVerified
                });   
            } catch (error) {
                console.error(`Error in attestation process: ${error.message}`);
                verificationResults.push({
                    verifierTeeId: `${process.env.APP_ID}`,
                    verifiedTeeId: tee.appId,
                    success: false
                });  
                try {
                    if (fs.existsSync('quote.hex')) fs.unlinkSync('quote.hex');
                    if (fs.existsSync('quote.bin')) fs.unlinkSync('quote.bin');
                } catch (cleanupError) {
                    console.error(`Error cleaning up files: ${cleanupError.message}`);
                }
            }
        }
        //Submit Verification to protocol
        if (verificationResults.length > 0) {
            this.multiTeeProtocolService.updateNodeVerificationStatus(verificationResults);
        } else {
            console.log('--------------------------------------------------'); 
            console.log(`🔥 Nothing to Verify`); 
            console.log('--------------------------------------------------\n\n');
        }
    }
}