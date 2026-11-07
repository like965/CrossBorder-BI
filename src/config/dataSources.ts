/**
 * 数据源配置模块（Stage 0.5 预留，Stage 1 复用）
 *
 * - 纯配置：不含数据读取逻辑、不引入任何依赖、不发起网络请求。
 * - local  ：开发阶段默认，读取项目目录下六个本地 CSV。
 * - online ：读取 Google Sheets 发布到网络的 CSV，状态 pending-verification，
 *            在线连通性与 CORS 待本地浏览器验证后启用。
 * - 两种模式指向同一套虚构模拟数据：六张表、字段顺序、指标计算、数据模型完全一致。
 * - 指标口径唯一来源：Metric_Dictionary.csv；不引入 Supabase、后端、付费 API。
 * - 所有 Google 链接均为公开发布链接，不是私有安全数据源；不得写入任何凭据。
 */

export const DATA_SOURCE_MODE = 'local'; // 'local' | 'online'；开发阶段固定 local

export const ONLINE_STATUS = 'pending-verification'; // 待本地浏览器验证连通性与 CORS

export const SHEET_PUBLISHED_ID =
  '2PACX-1vRrEG07YGDN389-MriWmkrOyzc_dGhR-6GhJvxMCsDXmC47vJLqrHcSHSmfIEnYxEDDzY_uKpnUDpsY';

/** 可被 fetch() 读取的 CSV 发布链接格式；现有 pubhtml 链接为 HTML 预览，需按此格式重新发布 */
export const CSV_URL_FORMAT =
  'https://docs.google.com/spreadsheets/d/e/{publishedId}/pub?gid={gid}&single=true&output=csv';

/** 用户提供的原始发布链接：待验证配置，保留不删除 */
export const PUBLISHED_LINKS = {
  DimChannel:
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vRrEG07YGDN389-MriWmkrOyzc_dGhR-6GhJvxMCsDXmC47vJLqrHcSHSmfIEnYxEDDzY_uKpnUDpsY/pubhtml?gid=1015215098&single=true',
  DimCountry:
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vRrEG07YGDN389-MriWmkrOyzc_dGhR-6GhJvxMCsDXmC47vJLqrHcSHSmfIEnYxEDDzY_uKpnUDpsY/pubhtml?gid=1321883156&single=true',
  DimDate:
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vRrEG07YGDN389-MriWmkrOyzc_dGhR-6GhJvxMCsDXmC47vJLqrHcSHSmfIEnYxEDDzY_uKpnUDpsY/pubhtml?gid=2038944963&single=true',
  DimProduct:
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vRrEG07YGDN389-MriWmkrOyzc_dGhR-6GhJvxMCsDXmC47vJLqrHcSHSmfIEnYxEDDzY_uKpnUDpsY/pubhtml?gid=949396972&single=true',
  FactSales:
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vRrEG07YGDN389-MriWmkrOyzc_dGhR-6GhJvxMCsDXmC47vJLqrHcSHSmfIEnYxEDDzY_uKpnUDpsY/pubhtml?gid=1375678292&single=true',
  Metric_Dictionary:
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vRrEG07YGDN389-MriWmkrOyzc_dGhR-6GhJvxMCsDXmC47vJLqrHcSHSmfIEnYxEDDzY_uKpnUDpsY/pubhtml?gid=506011943&single=true',
};

/** 六张表的 gid、本地文件、行数与规范字段；local / online 共用这份字段定义 */
export const TABLES = {
  FactSales: {
    gid: '1375678292',
    local: 'FactSales.csv',
    rows: 6243,
    columns: [
      'OrderID', 'DateKey', 'ProductID', 'ChannelID', 'CountryID', 'Quantity',
      'GrossSalesUSD', 'DiscountUSD', 'NetSalesUSD', 'COGSUSD',
      'ShippingCostUSD', 'PlatformFeeUSD', 'GrossProfitUSD',
    ],
  },
  DimDate: {
    gid: '2038944963',
    local: 'DimDate.csv',
    rows: 365,
    columns: ['DateKey', 'Date', 'Year', 'Quarter', 'MonthNo', 'MonthName', 'YearMonth', 'WeekNo'],
  },
  DimProduct: {
    gid: '949396972',
    local: 'DimProduct.csv',
    rows: 12,
    columns: ['ProductID', 'ProductName', 'Category', 'ListPriceUSD', 'UnitCostUSD'],
  },
  DimChannel: {
    gid: '1015215098',
    local: 'DimChannel.csv',
    rows: 4,
    columns: ['ChannelID', 'ChannelName', 'ChannelType'],
  },
  DimCountry: {
    gid: '1321883156',
    local: 'DimCountry.csv',
    rows: 5,
    columns: ['CountryID', 'CountryName', 'Region'],
  },
  Metric_Dictionary: {
    gid: '506011943',
    local: 'Metric_Dictionary.csv',
    rows: 14,
    columns: ['指标名称', '计算逻辑', '业务定义', '单位'],
  },
};

/**
 * 两种模式的读取位置，键名与 TABLES 一致。
 * online 值为按 CSV_URL_FORMAT 从原始发布链接推导的 CSV 端点，尚未验证：
 * 待本地浏览器确认可用后，用实际发布链接替换对应项。
 */
export const SOURCES = {
  // local 路径相对 Vite public 目录（public/data/），内容为项目根目录六个 CSV 的逐字节副本
  local: {
    FactSales: 'data/FactSales.csv',
    DimDate: 'data/DimDate.csv',
    DimProduct: 'data/DimProduct.csv',
    DimChannel: 'data/DimChannel.csv',
    DimCountry: 'data/DimCountry.csv',
    Metric_Dictionary: 'data/Metric_Dictionary.csv',
  },
  online: {
    FactSales:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vRrEG07YGDN389-MriWmkrOyzc_dGhR-6GhJvxMCsDXmC47vJLqrHcSHSmfIEnYxEDDzY_uKpnUDpsY/pub?gid=1375678292&single=true&output=csv',
    DimDate:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vRrEG07YGDN389-MriWmkrOyzc_dGhR-6GhJvxMCsDXmC47vJLqrHcSHSmfIEnYxEDDzY_uKpnUDpsY/pub?gid=2038944963&single=true&output=csv',
    DimProduct:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vRrEG07YGDN389-MriWmkrOyzc_dGhR-6GhJvxMCsDXmC47vJLqrHcSHSmfIEnYxEDDzY_uKpnUDpsY/pub?gid=949396972&single=true&output=csv',
    DimChannel:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vRrEG07YGDN389-MriWmkrOyzc_dGhR-6GhJvxMCsDXmC47vJLqrHcSHSmfIEnYxEDDzY_uKpnUDpsY/pub?gid=1015215098&single=true&output=csv',
    DimCountry:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vRrEG07YGDN389-MriWmkrOyzc_dGhR-6GhJvxMCsDXmC47vJLqrHcSHSmfIEnYxEDDzY_uKpnUDpsY/pub?gid=1321883156&single=true&output=csv',
    Metric_Dictionary:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vRrEG07YGDN389-MriWmkrOyzc_dGhR-6GhJvxMCsDXmC47vJLqrHcSHSmfIEnYxEDDzY_uKpnUDpsY/pub?gid=506011943&single=true&output=csv',
  },
};

/** 两种模式共用的计算与模型约定；不得按模式分叉 */
export const CONTRACT = {
  currency: 'USD',
  metricDictionary: 'Metric_Dictionary.csv',
  fact: 'FactSales',
  grain: 'OrderID + ProductID',
  dimensions: ['DimDate', 'DimProduct', 'DimChannel', 'DimCountry'],
  relationships: [
    'DimDate[DateKey] 1 -> * FactSales[DateKey]',
    'DimProduct[ProductID] 1 -> * FactSales[ProductID]',
    'DimChannel[ChannelID] 1 -> * FactSales[ChannelID]',
    'DimCountry[CountryID] 1 -> * FactSales[CountryID]',
  ],
  orders: 'DISTINCTCOUNT(OrderID)',
  ratioScale: '0-1', // 百分比类指标底层 0–1，展示层格式化为百分比并保留 1 位小数
  ratioDisplayDecimals: 1,
  trendGrain: 'YearMonth', // V1 只做月度趋势；不使用 WeekNo，不增加 YearWeek
  catalogPriceIsReferenceOnly: true, // DimProduct.ListPriceUSD 不得用于重算实际销售收入
  costsAreLineLevel: true, // ShippingCostUSD / PlatformFeeUSD 按商品行汇总，毛利润已扣除，不得重复扣减
};
