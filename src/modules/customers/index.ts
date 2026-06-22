// Public API of the customers module — server-side only.

export {
  createCustomer,
  getCustomerByEmail,
  getCustomerById,
  emailExists,
  updateCustomerProfile,
  touchLastLogin,
  recordConsent,
  getCurrentCustomer,
} from "./repository";
export type {
  CreateCustomerInput,
  UpdateProfileInput,
  RecordConsentInput,
} from "./repository";
export type { Customer, CustomerConsent } from "./db/schema";
