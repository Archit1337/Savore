/**
 * Formats a numeric or string price value into Indian Rupees (INR)
 * using the standard 'en-IN' locale format.
 * Example: 1199 -> ₹ 1,199
 */
export const formatPrice = (value) => {
  if (value === null || value === undefined) return '';
  
  // If it's a string, strip any non-numeric characters except decimals
  const numericValue = typeof value === 'string' 
    ? parseFloat(value.replace(/[^0-9.]/g, '')) 
    : value;
    
  if (isNaN(numericValue)) return value;
  
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(numericValue);
  
  // Ensure exactly one space after the rupee symbol
  return `₹ ${formatted}`;
};
