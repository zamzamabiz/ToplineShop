/**
 * Maps raw quantity unit representations to canonical unit codes.
 * Sources: real Pakistan customs data observations.
 * Unknown inputs: return undefined — caller retains raw, sets quantityUnitCode = null.
 */

const UNIT_ALIASES: Record<string, string> = {
  'KG': 'KG',
  'KGS': 'KG',
  'KILOGRAM': 'KG',
  'KILOGRAMS': 'KG',
  'Kilo': 'KG',
  'kg': 'KG',
  'kgs': 'KG',

  'G': 'G',
  'GM': 'G',
  'GMS': 'G',
  'GRAM': 'G',
  'GRAMS': 'G',
  'g': 'G',

  'MT': 'MT',
  'TON': 'MT',
  'TONS': 'MT',
  'TONNE': 'MT',
  'TONNES': 'MT',
  'M/TON': 'MT',

  'u': 'PCS',
  'U': 'PCS',
  'PCS': 'PCS',
  'PC': 'PCS',
  'PIECE': 'PCS',
  'PIECES': 'PCS',
  'NO': 'PCS',
  'NOS': 'PCS',
  'UNIT': 'PCS',
  'UNITS': 'PCS',

  '2u': '2PCS',
  '2U': '2PCS',
  '2PCS': '2PCS',

  'L': 'L',
  'LTR': 'L',
  'LITER': 'L',
  'LITRE': 'L',
  'LITERS': 'L',
  'LITRES': 'L',

  'ML': 'ML',
  'milliliter': 'ML',

  'm²': 'M2',
  'm2': 'M2',
  'SQM': 'M2',
  'SQ.M': 'M2',
  'SQ M': 'M2',

  'm³': 'M3',
  'm3': 'M3',
  'CBM': 'M3',
  'CUM': 'M3',

  'PACK': 'PACK',
  'PKG': 'PACK',
  'PACKS': 'PACK',
  'PACKAGE': 'PACK',
  'PACKAGES': 'PACK',

  'MMBTU': 'MMBTU',
  'MMBtu': 'MMBTU',

  'carat': 'CARAT',
  'CARAT': 'CARAT',
  'CT': 'CARAT',

  '1000': '1000PCS',
  '1000u': '1000PCS',
  '1000U': '1000PCS',

  'SET': 'SET',
  'SETS': 'SET',
  'PAIR': 'PAIR',
  'PAIRS': 'PAIR',
  'PR': 'PAIR',
  'DOZ': 'DOZ',
  'DOZEN': 'DOZ',
  'DOZENS': 'DOZ',
  'ROLL': 'ROLL',
  'ROLLS': 'ROLL',
  'BOX': 'BOX',
  'BOXES': 'BOX',
  'CTN': 'CTN',
  'CARTON': 'CTN',
  'CARTONS': 'CTN',
  'BAG': 'BAG',
  'BAGS': 'BAG',
  'BALE': 'BALE',
  'BALES': 'BALE',
  'DRUM': 'DRUM',
  'DRUMS': 'DRUM',
  'MTR': 'M',
  'M': 'M',
  'METER': 'M',
  'METERS': 'M',
  'METRE': 'M',
  'METRES': 'M',
};

/**
 * Resolves a raw unit string to a canonical unit code.
 * Returns undefined if no mapping found.
 */
export function resolveUnitCode(raw: string): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (UNIT_ALIASES[trimmed] !== undefined) return UNIT_ALIASES[trimmed];
  const upper = trimmed.toUpperCase();
  if (UNIT_ALIASES[upper] !== undefined) return UNIT_ALIASES[upper];
  return undefined;
}
