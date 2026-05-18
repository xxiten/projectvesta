import { Module } from '@nestjs/common';
import { ReservationModule } from '../reservation';
import { FrontDeskController } from './front-desk.controller';
import { RoomRackController } from './room-rack.controller';
import { RoomRackService } from './room-rack.service';

/**
 * Front desk operations: the room rack (read model), room assignment,
 * check-in/out and blocking. Stay/Reservation writes are delegated to the
 * reservation public port — front-desk never deep-imports the aggregate.
 */
@Module({
  imports: [ReservationModule],
  controllers: [RoomRackController, FrontDeskController],
  providers: [RoomRackService],
})
export class FrontDeskModule {}
