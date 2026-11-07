/** 订单商品行：金额单位 USD，已按维度表关联出月份与名称，未改变原始 CSV 数据 */
export interface PreparedRow {
  orderId: string;
  dateKey: string;
  yearMonth: string;
  channelId: string;
  channelName: string;
  countryId: string;
  countryName: string;
  productId: string;
  quantity: number;
  grossSales: number;
  discount: number;
  netSales: number;
  cogs: number;
  shipping: number;
  platformFee: number;
  grossProfit: number;
}

export interface ProductInfo {
  id: string;
  name: string;
  category: string;
}

export interface Filters {
  month: string;
  channel: string;
  country: string;
}

export type PageKey = 'overview' | 'sales' | 'profit' | 'product' | 'detail';

/** 五个页面共用同一份筛选后数据，禁止各页面自行过滤或改口径 */
export interface PageProps {
  rows: PreparedRow[];
  isEmpty: boolean;
  products: ProductInfo[];
}

/** 百分比类指标底层为 0–1；分母为 0 或空数据时为 null，交由展示层渲染「—」 */
export interface Kpi {
  netSales: number;
  grossProfit: number;
  grossMargin: number | null;
  orders: number;
  aov: number | null;
}

export interface SalesKpi {
  grossSales: number;
  discount: number;
  netSales: number;
  orders: number;
  unitsSold: number;
  aov: number | null;
}

export interface CostKpi {
  netSales: number;
  grossProfit: number;
  grossMargin: number | null;
  cogs: number;
  shipping: number;
  platformFee: number;
  totalCost: number;
}

export interface MonthPoint {
  month: string;
  netSales: number;
  grossProfit: number;
}

export interface MonthOrderPoint {
  month: string;
  orders: number;
}

export interface ChannelPoint {
  channel: string;
  netSales: number;
  grossProfit: number;
  grossMargin: number | null;
}

export interface CountryPoint {
  country: string;
  netSales: number;
}

export interface ChannelSalesPoint {
  channel: string;
  netSales: number;
  orders: number;
  unitsSold: number;
  aov: number | null;
}

export interface ChannelProfitPoint {
  channel: string;
  netSales: number;
  grossProfit: number;
  grossMargin: number | null;
  totalCost: number;
}

export interface ProductPoint {
  productId: string;
  name: string;
  category: string;
  unitsSold: number;
  orders: number;
  netSales: number;
  grossProfit: number;
  grossMargin: number | null;
  salesContribution: number | null;
}

/** 明细页展示行：每行代表订单中的一个产品明细，不代表一个独立订单 */
export interface DetailRecord {
  orderId: string;
  orderDate: string;
  yearMonth: string;
  channel: string;
  country: string;
  productName: string;
  category: string;
  quantity: number;
  grossSales: number;
  discount: number;
  netSales: number;
  cogs: number;
  shipping: number;
  platformFee: number;
  grossProfit: number;
  grossMargin: number | null;
}
