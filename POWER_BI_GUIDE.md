# Power BI 建模与 DAX 指南

## 导入
开发阶段（`local` 模式）：Power BI Desktop → 获取数据 → 文本/CSV，直接导入项目目录下六个本地 CSV。`online` 模式在 Google Sheets 发布 CSV 链接通过本地浏览器验证后，改用「获取数据 → Web」逐表输入 CSV URL。两种模式字段、指标计算、数据模型完全一致，配置见 `src/config/dataSources.ts`。

## 星型模型关系（单向）
- DimDate[DateKey] 1 → * FactSales[DateKey]
- DimProduct[ProductID] 1 → * FactSales[ProductID]
- DimChannel[ChannelID] 1 → * FactSales[ChannelID]
- DimCountry[CountryID] 1 → * FactSales[CountryID]

将 DimDate 标记为日期表，日期列选 DimDate[Date]。维度表单向过滤事实表。

## DAX 度量值
口径以 Metric_Dictionary.csv 为准；金额一律取 FactSales 行级字段的 SUM。

```DAX
Net Sales = SUM ( FactSales[NetSalesUSD] )
Gross Profit = SUM ( FactSales[GrossProfitUSD] )
Orders = DISTINCTCOUNT ( FactSales[OrderID] )
Units Sold = SUM ( FactSales[Quantity] )
AOV = DIVIDE ( [Net Sales], [Orders] )
Gross Sales = SUM ( FactSales[GrossSalesUSD] )
Discount = SUM ( FactSales[DiscountUSD] )
COGS = SUM ( FactSales[COGSUSD] )
Shipping Cost = SUM ( FactSales[ShippingCostUSD] )
Platform Fee = SUM ( FactSales[PlatformFeeUSD] )
Total Cost = [COGS] + [Shipping Cost] + [Platform Fee]

// 百分比类度量值返回 0–1 小数；在「格式 → 百分比、1 位小数」中格式化，不要在公式里乘 100
Gross Margin = DIVIDE ( [Gross Profit], [Net Sales] )
Discount Rate = DIVIDE ( [Discount], [Gross Sales] )
```

## 页面
1. 经营总览：KPI、月度销售/利润趋势、渠道贡献、地区表现。
2. 销售分析：趋势、渠道、国家、订单量、客单价。
3. 利润分析：毛利润、毛利率、成本结构、渠道盈利能力。
4. 产品分析：SKU 销售额、毛利润、毛利率排名。
5. 经营明细：订单行明细和日期/渠道/国家/SKU 筛选。

## 注意
- 口径以 Metric_Dictionary.csv 为唯一来源，Power BI 与 Web 必须一致；比率一律聚合后相除，禁止对行级比率求平均。
- Gross Margin、Discount Rate 由 DIVIDE 返回 0–1 小数，格式化为百分比并保留 1 位小数。
- Orders 用 DISTINCTCOUNT，不可用事实表行数，也不要对分组订单数求和。
- DimProduct[ListPriceUSD] 仅为参考目录价，不得用于计算任何实际销售收入；金额一律取 FactSales。
- 三项成本按商品行 SUM；[Gross Profit] 已扣完三项成本，[Total Cost] 仅用于成本结构展示，不得二次扣减。
- 导入 CSV 时显式设置字段类型，DimDate[Date] 设为日期并「标记为日期表」；V1 只做月度趋势（YearMonth），不使用 WeekNo。
- 数据只有 2025 年，不展示同比。Power BI Desktop 本地刷新与 Power BI Service 在线刷新/分享是不同能力。
