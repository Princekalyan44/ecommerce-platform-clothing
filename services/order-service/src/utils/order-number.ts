/**
 * Generate a unique order number
 * Format: ORD-YYYYMMDD-XXXX (e.g., ORD-20260216-0001)
 */
export const generateOrderNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');

  return `ORD-${year}${month}${day}-${random}`;
};
