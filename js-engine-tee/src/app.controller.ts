import { Controller, Get, InternalServerErrorException } from '@nestjs/common';
import { TeeService } from './services/tee.service';

@Controller()
export class AppController {
  constructor(private readonly teeService: TeeService) {}

  @Get()
  getHello(): string {
    return this.teeService.getHello();
  }

  @Get('attestation')
  getAttestation() {
    try {
      return this.teeService.getAttestationReport();
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Get('toggle-anomaly')
  toggleAnomalyFlag() {
    return this.teeService.toggleAnomalyFlag();
  }
}