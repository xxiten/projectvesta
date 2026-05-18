import { Module } from '@nestjs/common';

/**
 * STRATEGIC: localization & compliance. Jurisdiction profiles select adapter
 * sets (SDI/FatturaPA, Alloggiati Web, ASTAT, Aufenthaltsabgabe). The core is
 * jurisdiction-agnostic and never imports this module (see docs/adr/0007).
 */
@Module({})
export class ComplianceModule {}
