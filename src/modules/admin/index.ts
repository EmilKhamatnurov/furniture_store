// Public API of the admin module — server-side only.

// Auth
export {
  isAdminConfigured,
  checkAdminCredentials,
  loginAdmin,
  getAdminEmail,
  requireAdmin,
} from "./auth";
export { clearAdminCookie, getAdminSession } from "./session";

// Orders
export {
  listOrders,
  getOrderDetail,
  allowedTransitions,
  updateOrderStatus,
  addOrderNote,
} from "./orders";
export type { ListOrdersParams } from "./orders";

// Catalog
export {
  listAllProductsAdmin,
  getProductAdmin,
  listCategoriesAdmin,
  createProductAdmin,
  updateProductAdmin,
  createVariantAdmin,
  updateVariantAdmin,
  addProductImageAdmin,
  deleteProductImageAdmin,
  makePrimaryProductImageAdmin,
  moveProductImageAdmin,
  updateProductImageAltAdmin,
} from "./catalog";
export type {
  CreateProductInput,
  UpdateProductInput,
  CreateVariantInput,
  UpdateVariantInput,
} from "./catalog";

// Payments
export { listPayments } from "./payments";

// Stats
export { getDashboardStats, getRecentOrders } from "./stats";

// Content (CMS)
export {
  listPagesAdmin,
  getPageAdmin,
  createPageAdmin,
  updatePageAdmin,
  listPostsAdmin,
  getPostAdmin,
  createPostAdmin,
  updatePostAdmin,
} from "./content";
export type { PageInput, PostInput } from "./content";
