const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const intFormatter = new Intl.NumberFormat('en-US');

/** 金额展示：USD 两位小数；null 用于空数据，不显示 NaN / Infinity */
export function formatUSD(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—';
  return usdFormatter.format(value);
}

/** 图表坐标轴用紧凑金额 */
export function formatCompactUSD(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return `$${compactFormatter.format(value)}`;
}

/** 百分比底层为 0–1，仅在此处 ×100 格式化并保留 1 位小数 */
export function formatPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—';
  return `${(value * 100).toFixed(1)}%`;
}

export function formatInt(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return intFormatter.format(value);
}

/** 坐标轴刻度：底层 0–1 值直接显示为整数百分比 */
export function formatPercentTick(value: number): string {
  return Number.isFinite(value) ? `${Math.round(value * 100)}%` : '—';
}
