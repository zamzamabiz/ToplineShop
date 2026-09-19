/**
 * Maps raw currency representations (text labels and ISO 4217 numeric codes)
 * to ISO 4217 alpha-3 codes.
 * Sources: real Pakistan customs data (IMPORT text labels, EXPORT numeric codes).
 * Unknown inputs: return undefined — caller sets currencyCode = null + issues warning.
 */

const TEXT_TO_ISO: Record<string, string> = {
  // Common textual aliases
  'US $': 'USD',
  'US$': 'USD',
  'USD': 'USD',
  'US DOLLAR': 'USD',
  'US DOLLARS': 'USD',
  'DOLLAR': 'USD',
  '$': 'USD',
  'Rs.': 'PKR',
  'RS.': 'PKR',
  'PKR': 'PKR',
  'RUPEE': 'PKR',
  'RUPEES': 'PKR',
  'EURO': 'EUR',
  'EUR': 'EUR',
  '€': 'EUR',
  'Dhm': 'AED',
  'DHM': 'AED',
  'AED': 'AED',
  'DIRHAM': 'AED',
  'DIRHAMS': 'AED',
  'Rmb': 'CNY',
  'RMB': 'CNY',
  'CNY': 'CNY',
  'YUAN': 'CNY',
  'RENMINBI': 'CNY',
  'YEN': 'JPY',
  'JPY': 'JPY',
  'STG': 'GBP',
  'GBP': 'GBP',
  'POUND': 'GBP',
  'POUNDS': 'GBP',
  'STERLING': 'GBP',
  '£': 'GBP',
  'S.Fr': 'CHF',
  'S.FR': 'CHF',
  'CHF': 'CHF',
  'FRANC': 'CHF',
  'FRANCS': 'CHF',
  'SAR': 'SAR',
  'RIYAL': 'SAR',
  'RIYALS': 'SAR',
  'INR': 'INR',
  'RUPIAH': 'IDR',
  'IDR': 'IDR',
  'KWD': 'KWD',
  'BHD': 'BHD',
  'QAR': 'QAR',
  'OMR': 'OMR',
  'TRY': 'TRY',
  'SGD': 'SGD',
  'MYR': 'MYR',
  'KRW': 'KRW',
  'HKD': 'HKD',
  'CAD': 'CAD',
  'AUD': 'AUD',
  'NZD': 'NZD',
  'SEK': 'SEK',
  'NOK': 'NOK',
  'DKK': 'DKK',
  'THB': 'THB',
  'BDT': 'BDT',
  'LKR': 'LKR',
  'NPR': 'NPR',
  'AFN': 'AFN',
  'IRR': 'IRR',
  'IQD': 'IQD',
  'EGP': 'EGP',
  'ZAR': 'ZAR',
  'BRL': 'BRL',
  'MXN': 'MXN',
};

const NUMERIC_TO_ISO: Record<string, string> = {
  '840': 'USD',
  '586': 'PKR',
  '978': 'EUR',
  '784': 'AED',
  '156': 'CNY',
  '392': 'JPY',
  '826': 'GBP',
  '756': 'CHF',
  '682': 'SAR',
  '356': 'INR',
  '360': 'IDR',
  '414': 'KWD',
  '048': 'BHD',
  '48': 'BHD',
  '634': 'QAR',
  '512': 'OMR',
  '949': 'TRY',
  '702': 'SGD',
  '458': 'MYR',
  '410': 'KRW',
  '344': 'HKD',
  '124': 'CAD',
  '036': 'AUD',
  '36': 'AUD',
  '554': 'NZD',
  '752': 'SEK',
  '578': 'NOK',
  '208': 'DKK',
  '764': 'THB',
  '050': 'BDT',
  '50': 'BDT',
  '144': 'LKR',
  '524': 'NPR',
  '971': 'AFN',
  '364': 'IRR',
  '368': 'IQD',
  '818': 'EGP',
  '710': 'ZAR',
  '986': 'BRL',
  '484': 'MXN',
  '998': 'XXX', // No currency / Not applicable
};

/**
 * Resolves a raw currency string to an ISO 4217 alpha-3 code.
 * Returns undefined if no mapping found.
 */
export function resolveCurrencyCode(raw: string): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  // Try text map (case-sensitive first, then case-insensitive upper)
  if (TEXT_TO_ISO[trimmed] !== undefined) return TEXT_TO_ISO[trimmed];
  const upper = trimmed.toUpperCase();
  if (TEXT_TO_ISO[upper] !== undefined) return TEXT_TO_ISO[upper];
  // Try numeric map (strip leading zeros for lookup)
  const numericKey = trimmed.replace(/^0+/, '') || '0';
  if (NUMERIC_TO_ISO[trimmed] !== undefined) return NUMERIC_TO_ISO[trimmed];
  if (NUMERIC_TO_ISO[numericKey] !== undefined) return NUMERIC_TO_ISO[numericKey];
  return undefined;
}
