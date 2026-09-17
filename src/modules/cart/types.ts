// ---------------------------------------------------------------------------
// Cart types
// priceCopecks is a bigint snapshot taken at the moment of add-to-cart.
// The checkout always re-reads price and availability from the server.
// ---------------------------------------------------------------------------

export interface CartItem {
  variantId: string;
  productId: string;
  productName: string;
  variantLabel: string;
  sku: string;
  /** S3 key for the primary product image, or null if no image uploaded yet */
  imageS3Key: string | null;
  /** Price at the moment the item was added — bigint kopecks */
  priceCopecks: bigint;
  /** Stock snapshot for a helpful client-side quantity limit; server is authoritative. */
  stockQuantity?: number | undefined;
  quantity: number;
}
