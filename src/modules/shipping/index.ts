// Public API of the shipping module — server-side only.

export {
  getActiveZonesWithTariffs,
  getZoneWithTariffs,
  getVolumetricDivisor,
  listAllZonesWithTariffs,
  createZone,
  updateZone,
  addTariff,
  updateTariff,
  deleteTariff,
  setVolumetricDivisor,
} from "./repository";
export type { ZoneWithTariffs } from "./repository";

export { quoteShipping } from "./quote";
export type { QuoteInput, ShippingQuote } from "./quote";

export type { ShippingZone, ShippingTariff } from "./db/schema";
