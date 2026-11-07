import type {
  ChannelPoint,
  ChannelProfitPoint,
  ChannelSalesPoint,
  CostKpi,
  CountryPoint,
  DetailRecord,
  Filters,
  Kpi,
  MonthOrderPoint,
  MonthPoint,
  PreparedRow,
  ProductInfo,
  ProductPoint,
  SalesKpi,
} from './types';

/**
 * 全部指标口径来自 Metric_Dictionary.csv：
 * - 金额一律取 FactSales 行级字段的 SUM；按「分」累加避免浮点误差。
 * - 订单量 = DISTINCTCOUNT(OrderID)，绝不使用行数。
 * - 比率一律「先聚合再相除」，底层 0–1；分母为 0 时返回 null。
 * - 不使用 DimProduct.ListPriceUSD 重算收入；毛利润直接 SUM(GrossProfitUSD)，不重复扣减成本。
 */

type MoneyKey = 'grossSales' | 'discount' | 'netSales' | 'cogs' | 'shipping' | 'platformFee' | 'grossProfit';

function toNumber(value: string | undefined): number {
  const parsed = Number(value ?? '');
  return Number.isFinite(parsed) ? parsed : 0;
}

/** 金额按整数「分」累加后还原，保证与 CSV 独立汇总一致 */
function sumMoney(rows: PreparedRow[], key: MoneyKey): number {
  let cents = 0;
  for (const row of rows) cents += Math.round(row[key] * 100);
  return cents / 100;
}

export function safeDivide(numerator: number, denominator: number): number | null {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return null;
  const result = numerator / denominator;
  return Number.isFinite(result) ? result : null;
}

/** 把事实表行与维度表关联，得到筛选与分组所需的规范行（不改动原始 CSV） */
export function prepareRows(
  factRows: Record<string, string>[],
  dateMap: Map<string, string>,
  channelMap: Map<string, string>,
  countryMap: Map<string, string>,
): PreparedRow[] {
  return factRows.map((row) => {
    const dateKey = row.DateKey ?? '';
    const channelId = row.ChannelID ?? '';
    const countryId = row.CountryID ?? '';
    return {
      orderId: row.OrderID ?? '',
      dateKey,
      yearMonth: dateMap.get(dateKey) ?? '',
      channelId,
      channelName: channelMap.get(channelId) ?? channelId,
      countryId,
      countryName: countryMap.get(countryId) ?? countryId,
      productId: row.ProductID ?? '',
      quantity: toNumber(row.Quantity),
      grossSales: toNumber(row.GrossSalesUSD),
      discount: toNumber(row.DiscountUSD),
      netSales: toNumber(row.NetSalesUSD),
      cogs: toNumber(row.COGSUSD),
      shipping: toNumber(row.ShippingCostUSD),
      platformFee: toNumber(row.PlatformFeeUSD),
      grossProfit: toNumber(row.GrossProfitUSD),
    };
  });
}

export function filterRows(rows: PreparedRow[], filters: Filters): PreparedRow[] {
  return rows.filter(
    (row) =>
      (!filters.month || row.yearMonth === filters.month) &&
      (!filters.channel || row.channelId === filters.channel) &&
      (!filters.country || row.countryId === filters.country),
  );
}

export function computeKpi(rows: PreparedRow[]): Kpi {
  const netSales = sumMoney(rows, 'netSales');
  const grossProfit = sumMoney(rows, 'grossProfit');
  const orders = new Set(rows.map((row) => row.orderId)).size;
  return {
    netSales,
    grossProfit,
    grossMargin: safeDivide(grossProfit, netSales),
    orders,
    aov: safeDivide(netSales, orders),
  };
}

export function groupByMonth(rows: PreparedRow[]): MonthPoint[] {
  const buckets = new Map<string, { net: number; profit: number }>();
  for (const row of rows) {
    if (!row.yearMonth) continue;
    const bucket = buckets.get(row.yearMonth) ?? { net: 0, profit: 0 };
    bucket.net += Math.round(row.netSales * 100);
    bucket.profit += Math.round(row.grossProfit * 100);
    buckets.set(row.yearMonth, bucket);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({
      month,
      netSales: value.net / 100,
      grossProfit: value.profit / 100,
    }));
}

export function groupByChannel(rows: PreparedRow[]): ChannelPoint[] {
  const buckets = new Map<string, { name: string; net: number; profit: number }>();
  for (const row of rows) {
    if (!row.channelId) continue;
    const bucket = buckets.get(row.channelId) ?? { name: row.channelName, net: 0, profit: 0 };
    bucket.net += Math.round(row.netSales * 100);
    bucket.profit += Math.round(row.grossProfit * 100);
    buckets.set(row.channelId, bucket);
  }
  return [...buckets.values()]
    .map((value) => {
      const netSales = value.net / 100;
      const grossProfit = value.profit / 100;
      return {
        channel: value.name,
        netSales,
        grossProfit,
        grossMargin: safeDivide(grossProfit, netSales),
      };
    })
    .sort((a, b) => b.netSales - a.netSales);
}

export function groupByCountry(rows: PreparedRow[]): CountryPoint[] {
  const buckets = new Map<string, { name: string; net: number }>();
  for (const row of rows) {
    if (!row.countryId) continue;
    const bucket = buckets.get(row.countryId) ?? { name: row.countryName, net: 0 };
    bucket.net += Math.round(row.netSales * 100);
    buckets.set(row.countryId, bucket);
  }
  return [...buckets.values()]
    .map((value) => ({ country: value.name, netSales: value.net / 100 }))
    .sort((a, b) => b.netSales - a.netSales);
}

/* ---------- Stage 2 新增：全部沿用上面的 SUM / DISTINCTCOUNT / 先聚合再相除口径 ---------- */

export function computeSalesKpi(rows: PreparedRow[]): SalesKpi {
  const orders = new Set(rows.map((row) => row.orderId)).size;
  return {
    grossSales: sumMoney(rows, 'grossSales'),
    discount: sumMoney(rows, 'discount'),
    netSales: sumMoney(rows, 'netSales'),
    orders,
    unitsSold: rows.reduce((sum, row) => sum + row.quantity, 0),
    aov: safeDivide(sumMoney(rows, 'netSales'), orders),
  };
}

export function computeCostKpi(rows: PreparedRow[]): CostKpi {
  const cogs = sumMoney(rows, 'cogs');
  const shipping = sumMoney(rows, 'shipping');
  const platformFee = sumMoney(rows, 'platformFee');
  const netSales = sumMoney(rows, 'netSales');
  const grossProfit = sumMoney(rows, 'grossProfit');
  const totalCost =
    (Math.round(cogs * 100) + Math.round(shipping * 100) + Math.round(platformFee * 100)) / 100;
  return {
    netSales,
    grossProfit,
    grossMargin: safeDivide(grossProfit, netSales),
    cogs,
    shipping,
    platformFee,
    totalCost,
  };
}

/** 月度订单量：每月内按 OrderID 去重；各月之间不互相相加作为全局总计 */
export function groupByMonthOrders(rows: PreparedRow[]): MonthOrderPoint[] {
  const buckets = new Map<string, Set<string>>();
  for (const row of rows) {
    if (!row.yearMonth) continue;
    const ids = buckets.get(row.yearMonth) ?? new Set<string>();
    ids.add(row.orderId);
    buckets.set(row.yearMonth, ids);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, ids]) => ({ month, orders: ids.size }));
}

export function groupByChannelSales(rows: PreparedRow[]): ChannelSalesPoint[] {
  const buckets = new Map<string, { name: string; net: number; ids: Set<string>; units: number }>();
  for (const row of rows) {
    if (!row.channelId) continue;
    const bucket = buckets.get(row.channelId) ?? {
      name: row.channelName,
      net: 0,
      ids: new Set<string>(),
      units: 0,
    };
    bucket.net += Math.round(row.netSales * 100);
    bucket.ids.add(row.orderId);
    bucket.units += row.quantity;
    buckets.set(row.channelId, bucket);
  }
  return [...buckets.values()]
    .map((value) => {
      const netSales = value.net / 100;
      return {
        channel: value.name,
        netSales,
        orders: value.ids.size,
        unitsSold: value.units,
        aov: safeDivide(netSales, value.ids.size),
      };
    })
    .sort((a, b) => b.netSales - a.netSales);
}

export function groupByChannelProfit(rows: PreparedRow[]): ChannelProfitPoint[] {
  const buckets = new Map<string, { name: string; net: number; profit: number; cost: number }>();
  for (const row of rows) {
    if (!row.channelId) continue;
    const bucket = buckets.get(row.channelId) ?? { name: row.channelName, net: 0, profit: 0, cost: 0 };
    bucket.net += Math.round(row.netSales * 100);
    bucket.profit += Math.round(row.grossProfit * 100);
    bucket.cost +=
      Math.round(row.cogs * 100) + Math.round(row.shipping * 100) + Math.round(row.platformFee * 100);
    buckets.set(row.channelId, bucket);
  }
  return [...buckets.values()]
    .map((value) => {
      const netSales = value.net / 100;
      const grossProfit = value.profit / 100;
      return {
        channel: value.name,
        netSales,
        grossProfit,
        grossMargin: safeDivide(grossProfit, netSales),
        totalCost: value.cost / 100,
      };
    })
    .sort((a, b) => b.grossProfit - a.grossProfit);
}

/**
 * 产品维度汇总：金额一律取 FactSales，不使用 ListPriceUSD。
 * 毛利率 = 该产品汇总毛利润 / 该产品汇总净销售额；占比 = 该产品净销售额 / 全量筛选后净销售额。
 * 每个产品的订单量是「包含该产品的去重订单数」，不可相加作为总计。
 */
export function groupByProduct(
  rows: PreparedRow[],
  products: readonly ProductInfo[],
): ProductPoint[] {
  const productMap = new Map(products.map((item) => [item.id, item]));
  const totalNet = sumMoney(rows, 'netSales');
  const buckets = new Map<
    string,
    { net: number; profit: number; units: number; ids: Set<string> }
  >();
  for (const row of rows) {
    if (!row.productId) continue;
    const bucket = buckets.get(row.productId) ?? {
      net: 0,
      profit: 0,
      units: 0,
      ids: new Set<string>(),
    };
    bucket.net += Math.round(row.netSales * 100);
    bucket.profit += Math.round(row.grossProfit * 100);
    bucket.units += row.quantity;
    bucket.ids.add(row.orderId);
    buckets.set(row.productId, bucket);
  }
  return [...buckets.entries()]
    .map(([productId, value]) => {
      const info = productMap.get(productId);
      const netSales = value.net / 100;
      const grossProfit = value.profit / 100;
      return {
        productId,
        name: info?.name ?? productId,
        category: info?.category ?? '—',
        unitsSold: value.units,
        orders: value.ids.size,
        netSales,
        grossProfit,
        grossMargin: safeDivide(grossProfit, netSales),
        salesContribution: safeDivide(netSales, totalNet),
      };
    })
    .sort((a, b) => b.netSales - a.netSales);
}

/** 明细展示行：仅做维度名称关联与日期格式化，不改变任何金额口径 */
export function buildDetailRows(
  rows: PreparedRow[],
  products: readonly ProductInfo[],
): DetailRecord[] {
  const productMap = new Map(products.map((item) => [item.id, item]));
  return rows.map((row) => {
    const info = productMap.get(row.productId);
    const orderDate = /^\d{8}$/.test(row.dateKey)
      ? `${row.dateKey.slice(0, 4)}-${row.dateKey.slice(4, 6)}-${row.dateKey.slice(6, 8)}`
      : row.dateKey;
    return {
      orderId: row.orderId,
      orderDate,
      yearMonth: row.yearMonth,
      channel: row.channelName,
      country: row.countryName,
      productName: info?.name ?? row.productId,
      category: info?.category ?? '—',
      quantity: row.quantity,
      grossSales: row.grossSales,
      discount: row.discount,
      netSales: row.netSales,
      cogs: row.cogs,
      shipping: row.shipping,
      platformFee: row.platformFee,
      grossProfit: row.grossProfit,
      grossMargin: safeDivide(row.grossProfit, row.netSales),
    };
  });
}
