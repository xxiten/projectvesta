import { Module } from '@nestjs/common';
import { PropertyController, RoomController } from './property.controller';
import { PropertyService } from './property.service';

/** Property, room types and rooms configuration (supporting subdomain). */
@Module({
  controllers: [PropertyController, RoomController],
  providers: [PropertyService],
  exports: [PropertyService],
})
export class PropertySetupModule {}
