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
        this.logger.log('Starting attestation verification process');
        const networkTees = this.teeService.getNetworkTeeNodes();

        for (const tee of networkTees) {
            try {
                this.logger.log(`Verifying TEE node: ${tee.appId}`);
                
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
                    this.logger.log(`Verification output: ${stdout}`);
                }
                if (stderr) {
                    this.logger.log(`Verification messages: ${stderr}`);
                }
                
                // Log the verification result to Protocol
                const isVerified = stderr.includes('Quote verified');
                this.logger.log(`Quote verification result: ${isVerified ? 'Verified' : 'Not Verified'}`);
                
                // Cleanup temp files
                fs.unlinkSync('quote.hex');
                fs.unlinkSync('quote.bin');

                // Log the TEE status to protocol
                this.multiTeeProtocolService.updateNodeVerificationStatus(tee.appId, isVerified, new Date());
                
            } catch (error) {
                this.logger.error(`Error in attestation process: ${error.message}`);
                    try {
                        if (fs.existsSync('quote.hex')) fs.unlinkSync('quote.hex');
                        if (fs.existsSync('quote.bin')) fs.unlinkSync('quote.bin');
                    } catch (cleanupError) {
                        this.logger.error(`Error cleaning up files: ${cleanupError.message}`);
                    }
                }
        }
    }
}