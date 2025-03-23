import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { TappdClient } from '@phala/dstack-sdk';
import { GenerateAttestationAnomalyService } from './generate-attestation-anomaly.service';

@Injectable()
export class TeeService implements OnModuleInit {
  private attestationReport: any = null;
  private readonly logger = new Logger(TeeService.name);
  private anamolyTEE : boolean = false;

  constructor(private readonly generateAttestationAnomalyService: GenerateAttestationAnomalyService) {}

  // TEE network data structure
  private networkTeeNodes = [
    { appId: 'd3d457f80a1e5c9f51c27dcc7125ba21f2418e08', status: true},
    { appId: '14109e263ae195921751a1c77898b3b8a493e8cf', status: true},
    { appId: 'f47544606771cb9a3175b51bb21a7d941c1b67e3', status: true},
    { appId: 'dee7769dc1cb0a28ce15dee7595d72601e51369e', status: true},
    { appId: 'eff32080ad6be2fa3a4b0136c66b808164d1f08d', status: true}
  ];

  async onModuleInit() {
    try {
      await this.generateAttestationReport();
    } catch (error) {
      console.error('Failed to generate attestation report:', error);
    }
  }

  /**
   * Generates an attestation report of the TEE
   * TappdClient generates an attestation report with proof
   * that the application is running in a secure enclave.
   * 
   * Process:
   * 1. Connects to the local TEE environment using TappdClient
   * 2. Generates a TDX quote
   * 
   * @returns The complete quote result that can be used for remote attestation
   */
  async generateAttestationReport() {
    console.log('--------------------------------------------------');
    console.log('🚀 Starting attestation report generation process...');
    console.log('--------------------------------------------------');
    const client = new TappdClient();
    await client.info();
    const quoteResult = await client.tdxQuote('user-data', 'sha256');
    console.log('ATTESTATION REPORT GENERATED SUCCESSFULLY');
    console.log('ATTESTATION QUOTE :');
    this.attestationReport = quoteResult;
    console.log(quoteResult.quote);
    const rtmrs = quoteResult.replayRtmrs();
    console.log('ATTESTATION RTMRS :');
    console.log(rtmrs);
    console.log('--------------------------------------------------');
    console.log('🔒 System integrity verified and attestation complete');
    console.log('--------------------------------------------------\n\n');
    return quoteResult;
  }

  /**
   * Toggles the anomaly flag to make this TEE act as an Anamoly
   * And starts sending corrupted Attestation
   * 
   * @returns The new state of the anomaly flag
   */
  toggleAnomalyFlag(): { status: boolean } {
    this.anamolyTEE = !this.anamolyTEE;
    console.log('--------------------------------------------------');
    console.log(`⚠️ This TEE has been Marked As Anamoly: ${this.anamolyTEE}`);
    console.log('--------------------------------------------------\n\n');
    return { status: this.anamolyTEE };
  }

  async getAttestationReport() {
    if (!this.attestationReport) {
      throw new Error('Attestation report not generated yet');
    }
    if (this.anamolyTEE) {
      return await this.generateAttestationAnomalyService.generateAttestationAnomaly();
    }
    return this.attestationReport;
  }

  getNetworkTeeNodes() {
    return this.networkTeeNodes;
  }

  getHello(): string {
    return 'Hello World!';
  }

}