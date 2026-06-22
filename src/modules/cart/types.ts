// ---------------------------------------------------------------------------
// Cart types
// priceCopecks is a bigint snapshot taken at the moment of add-to-cart.
// We never re-read the product price after that — price locks at add time.
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
  quantity: number;
}
