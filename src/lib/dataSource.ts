import { DATA_SOURCE_MODE, SOURCES, TABLES } from '../config/dataSources';
import { parseCsv } from './csv';
import { prepareRows } from './metrics';
import type { PreparedRow, ProductInfo } from './types';

export interface Dataset {
  facts: PreparedRow[];
  months: string[];
  channels: { id: string; name: string }[];
  countries: { id: string; name: string }[];
  products: ProductInfo[];
}

type TableKey = keyof typeof SOURCES.local;

const mode = DATA_SOURCE_MODE as 'local' | 'online';

/**
 * local 为 Vite public 下的相对路径；online 为配置的 CSV URL（未启用、不测试）。
 * 写成显式分支而非 SOURCES[mode] 动态索引，使生产构建能 tree-shake 掉
 * 未启用的 online 分支，避免待验证的发布链接被打包进公开前端产物。
 */
function resolveUrl(name: TableKey): string {
  const location = mode === 'local' ? SOURCES.local[name] : SOURCES.online[name];
  return mode === 'local' ? `${import.meta.env.BASE_URL}${location}` : location;
}

async function fetchTable(name: TableKey, required: readonly string[]): Promise<Record<string, string>[]> {
  const response = await fetch(resolveUrl(name));
  if (!response.ok) {
    throw new Error(`${name}.csv 读取失败（HTTP ${response.status}）`);
  }
  const rows = parseCsv(await response.text());
  if (rows.length === 0) {
    throw new Error(`${name}.csv 为空或表头解析失败`);
  }
  const missing = required.filter((column) => !(column in rows[0]));
  if (missing.length > 0) {
    throw new Error(`${name}.csv 缺少字段：${missing.join('、')}`);
  }
  return rows;
}

/** 五个页面共用：事实表 + 日期/渠道/国家/产品四个维度；字段定义来自 TABLES 配置 */
export async function loadOverviewData(): Promise<Dataset> {
  const [factRows, dateRows, channelRows, countryRows, productRows] = await Promise.all([
    fetchTable('FactSales', TABLES.FactSales.columns),
    fetchTable('DimDate', TABLES.DimDate.columns),
    fetchTable('DimChannel', TABLES.DimChannel.columns),
    fetchTable('DimCountry', TABLES.DimCountry.columns),
    fetchTable('DimProduct', TABLES.DimProduct.columns),
  ]);

  const dateMap = new Map(dateRows.map((row) => [row.DateKey, row.YearMonth]));
  const channelMap = new Map(channelRows.map((row) => [row.ChannelID, row.ChannelName]));
  const countryMap = new Map(countryRows.map((row) => [row.CountryID, row.CountryName]));

  return {
    facts: prepareRows(factRows, dateMap, channelMap, countryMap),
    months: [...new Set(dateRows.map((row) => row.YearMonth))].sort(),
    channels: channelRows.map((row) => ({ id: row.ChannelID, name: row.ChannelName })),
    countries: countryRows.map((row) => ({ id: row.CountryID, name: row.CountryName })),
    products: productRows.map((row) => ({
      id: row.ProductID,
      name: row.ProductName,
      category: row.Category,
    })),
  };
}
