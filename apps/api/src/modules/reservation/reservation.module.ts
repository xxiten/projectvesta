import { Module } from '@nestjs/common';
import { ReservationController } from './reservation.controller';
import { ReservationService } from './reservation.service';
import { STAY_ASSIGNMENT_PORT } from './reservation.public';

/** CORE: reservations, stays, status machine. Holds inventory atomically.
 *  Exposes StayAssignmentPort so front-desk can orchestrate assign/check-in
 *  without depending on the service implementation. */
@Module({
  controllers: [ReservationController],
  providers: [
    ReservationService,
    { provide: STAY_ASSIGNMENT_PORT, useExisting: ReservationService },
  ],
  exports: [ReservationService, STAY_ASSIGNMENT_PORT],
})
export class ReservationModule {}
