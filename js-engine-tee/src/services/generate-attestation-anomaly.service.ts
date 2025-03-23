import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class GenerateAttestationAnomalyService {

  private readonly logger = new Logger(GenerateAttestationAnomalyService.name);

  /**
   * Corrupts the attestation quote data by changing bytes. 
   * Purpose it to make TEE act as hacked/compromised/anomaly
   * 
   * @returns A corrupted version of the attestation report
   */
  async generateAttestationAnomaly() {    
    const corruptedAttestationReport = {
      quote: "CORRUPTED01234567890abcdefe0855a6384fa1c8a6ab36d0dcbfaa11a5753e5a070c08",
      event_log: "[{\"imr\":3,\"event_type\":134217729,\"digest\":\"CORRUPTED\",\"event\":\"app-id\",\"event_payload\":\"d3d457f80a1e5c9f51c27dcc7125ba21f2418e08\"}]",
      hash_algorithm: "sha256",
      prefix: "app-data"
    };
    return corruptedAttestationReport;
  }
}