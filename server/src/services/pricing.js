export function calculateTotals(items, coupon) {
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  let discount = 0;
  const minimum = coupon?.minOrder ?? coupon?.minimumSubtotal ?? 0;
  const active = coupon?.isActive ?? coupon?.active;
  if (active && subtotal >= minimum) discount = coupon.type === 'percent' ? subtotal * coupon.value / 100 : coupon.value;
  if (coupon?.maxDiscount != null) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.min(subtotal, Math.round(discount * 100) / 100);
  const taxable = subtotal - discount;
  const tax = Math.round(taxable * 0.05 * 100) / 100;
  const shipping = subtotal > 999 || subtotal === 0 ? 0 : 49;
  return { subtotal, discount, tax, shipping, total: Math.round((taxable + tax + shipping) * 100) / 100 };
}
