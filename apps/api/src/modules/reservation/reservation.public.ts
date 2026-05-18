import type { StayMutationResultDto } from '@vesta/api-contracts';

/**
 * Public surface of the reservation module. Other modules (e.g. front-desk)
 * orchestrate stay/reservation mutations through THIS port only — never by
 * deep-importing the service — so the aggregate stays owned by `reservation`
 * and the dependency-cruiser boundary rules hold.
 */
export const STAY_ASSIGNMENT_PORT = Symbol('STAY_ASSIGNMENT_PORT');

export interface StayAssignmentPort {
  /** Assign a stay to a room, or pass roomId=null to move it back to the rail.
   *  Rejects (409) if it would overlap another assigned stay on that room. */
  assignRoom(
    tenantId: string,
    stayId: string,
    roomId: string | null,
  ): Promise<StayMutationResultDto>;

  /** Extend / shorten a stay. Same overlap guard as assignRoom. */
  resizeStay(
    tenantId: string,
    stayId: string,
    checkIn: string,
    checkOut: string,
  ): Promise<StayMutationResultDto>;

  /** Reservation status transition confirmed → checked_in. */
  checkIn(tenantId: string, reservationId: string, stayId: string): Promise<StayMutationResultDto>;

  /** Reservation status transition checked_in → checked_out. */
  checkOut(tenantId: string, reservationId: string, stayId: string): Promise<StayMutationResultDto>;
}
