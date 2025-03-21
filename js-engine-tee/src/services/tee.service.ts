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
    { appId: 'd3d457f80a1e5c9f51c27dcc7125ba21f2418e08', status: true}
  ];

  async onModuleInit() {
    try {
      await this.generateAttestationReport();
      this.logger.log('Attestation report generated successfully');
    } catch (error) {
      this.logger.error('Failed to generate attestation report:', error);
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
    const client = new TappdClient();
    await client.info();
    const quoteResult = await client.tdxQuote('user-data', 'sha256');
    this.logger.log('Report generated successfully');
    this.attestationReport = quoteResult;
    this.logger.log(quoteResult.quote);
    const rtmrs = quoteResult.replayRtmrs();
    this.logger.log(rtmrs);
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
    this.logger.log(`TEE has been Marked As Anamoly: ${this.anamolyTEE}`);
    return { status: this.anamolyTEE };
  }

  async getAttestationReport() {
    if (!this.attestationReport) {
      throw new Error('Attestation report not generated yet');
    }
    if (this.anamolyTEE) {
      this.logger.log('TEE is marked as anomaly, returning corrupted attestation');
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