/** Maps TradeDirection enum values to 3-char filename type codes. */
const TRADE_TYPE_MAP: Record<string, string> = {
  IMPORT: 'IMP',
  EXPORT: 'EXP',
};

export function tradeTypeCode(tradeDirection: string): string {
  return TRADE_TYPE_MAP[tradeDirection] ?? 'GLB';
}

/**
 * Builds a standardized TDR filename from its component parts.
 *
 * Format: TDR_V1_<TYPE>_<YYYY>[_<MM>]_<SEQ>.<ext>
 * Examples:
 *   TDR_V1_IMP_2025_01_001.csv   (with month)
 *   TDR_V1_EXP_2025_003.xlsx     (no month)
 */
export function buildStandardizedFilename(
  tradeDirection: string,
  dataPeriodYear: number,
  dataPeriodMonth: number | null | undefined,
  seqNum: number,
  ext: string,
): string {
  const type = tradeTypeCode(tradeDirection);
  const year = String(dataPeriodYear);
  const month = dataPeriodMonth != null
    ? `_${String(dataPeriodMonth).padStart(2, '0')}`
    : '';
  const seq = String(seqNum).padStart(3, '0');
  const extension = ext.startsWith('.') ? ext : `.${ext}`;
  return `TDR_V1_${type}_${year}${month}_${seq}${extension}`;
}
