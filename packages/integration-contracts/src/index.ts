/**
 * @vesta/integration-contracts
 *
 * The Canonical Data Model and the ports every external connector maps onto.
 * The core domain depends only on these contracts — never on a provider's
 * native model (Anti-Corruption Layer, see docs/adr/0007).
 */
export * from './canonical';
export * from './ports';
