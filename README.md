# CrossBorder BI｜跨境电商经营分析平台

> 求职作品集项目。所有数据均为**虚构模拟数据（Fictional Demo Data）**，不代表任何真实企业、客户或业务成果。

一个面向桌面浏览器的跨境电商经营分析看板。前端以本地 CSV 为数据源，包含五个分析页面、全局联动筛选，并与 Power BI 共用同一套数据与指标口径。

- **在线演示**：待 GitHub Pages 部署完成后补充
- **数据周期**：2025-01-01 ~ 2025-12-31 ｜ **币种**：USD
- **数据量**：6,243 条订单商品行 / 4,200 笔去重订单 / 12 个 SKU / 4 个渠道 / 5 个国家地区

## 功能

| 页面 | 内容 |
|---|---|
| 经营总览 | 净销售额、毛利润、毛利率、订单量、客单价；月度销售/利润趋势、渠道与地区表现 |
| 销售分析 | 折前销售额、折扣、净销售额、订单量、客单价、销售件数；月度净销售额与订单量趋势、渠道/国家对比、渠道汇总表 |
| 利润分析 | 毛利润、毛利率、总成本及三项成本构成；月度毛利趋势、成本饼图、渠道毛利与毛利率、渠道利润表 |
| 产品分析 | SKU 销售额排名、销售额占比、毛利率对比；可点表头排序的产品汇总表（含销量、订单量、毛利、占比） |
| 经营明细 | 16 列订单商品行明细；产品/订单号搜索、按日期/销售额/毛利润排序、每页 20 行分页 |

月份、渠道、国家三个筛选器为全局状态，切换页面后保留；五个页面共用同一份筛选后数据与同一套指标函数。页面均有加载、读取失败、空数据状态。

## 技术栈

React 18 · TypeScript 5 · Vite 5 · Recharts 2 · 纯静态部署

无后端、无数据库、无认证、无付费 API；不依赖任何运行时服务。

## 数据说明

数据为一套虚构的星型模型 CSV：

| 文件 | 说明 |
|---|---|
| `FactSales.csv` | 订单商品行事实表，每行 = 一个订单中的一个 SKU 行 |
| `DimDate.csv` / `DimProduct.csv` / `DimChannel.csv` / `DimCountry.csv` | 日期、产品、渠道、国家地区维度 |
| `Metric_Dictionary.csv` | 统一指标口径（唯一口径来源） |

Web 构建读取 `public/data/` 下的六个 CSV（项目根目录原始文件的逐字节副本，不修改源数据）。页面固定标注「模拟数据 / Fictional Demo Data」。未模拟税费、退款、广告费、汇率、库存及退货。

## 指标口径

统一以 `Metric_Dictionary.csv` 为准，项目内「销售额」默认指净销售额。

| 指标 | 公式 |
|---|---|
| 折前销售额 / 折扣 / 净销售额 | `SUM(GrossSalesUSD)` / `SUM(DiscountUSD)` / `SUM(NetSalesUSD)` |
| 商品成本 / 物流成本 / 平台费用 | 对应字段的 `SUM`；总成本 = 三项之和 |
| 毛利润 | `SUM(GrossProfitUSD)`（已扣除全部成本，不重复扣减） |
| 毛利率 | `SUM(GrossProfitUSD) / SUM(NetSalesUSD)` |
| 订单量 | `DISTINCTCOUNT(OrderID)`，不可用商品行数 |
| 客单价 | `SUM(NetSalesUSD) / DISTINCTCOUNT(OrderID)` |
| 销售件数 | `SUM(Quantity)` |
| 折扣率 | `SUM(DiscountUSD) / SUM(GrossSalesUSD)` |

关键约定：金额按订单商品行级字段汇总；比率一律「先聚合再相除」，底层为 0–1 小数，仅在展示层格式化为百分比并保留 1 位小数；`ListPriceUSD` 仅为参考目录价，不用于重算实际销售收入；运费与平台费按商品行汇总。订单量在产品维度不可加，产品汇总表的合计按筛选后事实表独立去重计算。

## 数据模型

1 张事实表 + 4 张维度表的星型模型，单向一对多关联：

```
DimDate[DateKey] ─┐
DimProduct[ProductID] ─┤
DimChannel[ChannelID] ─┼─→ FactSales
DimCountry[CountryID] ─┘
```

Web 与 Power BI 使用相同字段、筛选范围和指标定义；Power BI 建模与 DAX 说明见 `POWER_BI_GUIDE.md`。只有 2025 单年数据，不展示同比；V1 仅做月度趋势。

## 本地运行

```bash
npm install       # 安装依赖
npm run dev       # 开发服务器 http://localhost:5173
npm run build     # TypeScript 检查 + 生产构建，输出到 dist/
npm run preview   # 预览 dist/ 构建产物
```

## 部署

`vite.config.ts` 使用 `base: './'`，构建产物中的 JS/CSS 与 CSV 均为相对路径，可直接部署到 GitHub Pages 项目子路径（应用用 state 切换页面，不使用 history 路由）。`dist/` 由 GitHub Actions 自动构建并上传；`node_modules/`、临时文件与本地缓存均不进入仓库。

线上站点只读取随构建一起发布的 `dist/data/*.csv`；`online`（Google Sheets 发布 CSV）模式是预留的待验证配置，当前未启用，生产产物中不包含任何外部数据链接。

## 项目结构

```
src/
  App.tsx                 应用外壳：导航、全局筛选、数据加载
  pages/                  五个分析页面
  components/ui.tsx       共享卡片与状态组件
  lib/                    CSV 解析、指标聚合、格式化
  config/dataSources.ts   数据源配置（local / online 双模式）
public/data/              六个 CSV 构建副本
```

本项目为演示用途，请勿将模拟数据用于真实业务决策。
