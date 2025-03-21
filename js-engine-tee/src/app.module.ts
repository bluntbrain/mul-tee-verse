import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { TeeService } from './services/tee.service';
import { ScheduleModule } from '@nestjs/schedule';
import { AttestationVerificationService } from './services/attestation-verification.service';
import { MultiTeeProtocolService } from './services/multi-tee-protocol.service';
import { GenerateAttestationAnomalyService } from './services/generate-attestation-anomaly.service';

@Module({
  imports: [
    ScheduleModule.forRoot()
  ],
  controllers: [AppController],
  providers: [
    TeeService, 
    AttestationVerificationService, 
    MultiTeeProtocolService,
    GenerateAttestationAnomalyService
  ],
})
export class AppModule {}
