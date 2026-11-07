import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartCard, EmptyChart, EmptyTable, KpiCard } from '../components/ui';
import { AXIS_TICK, BLUE, GRID_STROKE, PIE_COLORS, TEAL } from '../lib/chartTheme';
import {
  formatCompactUSD,
  formatInt,
  formatPercent,
  formatPercentTick,
  formatUSD,
} from '../lib/format';
import { computeKpi, groupByProduct, safeDivide } from '../lib/metrics';
import type { PageProps, ProductPoint } from '../lib/types';

type ProductSortKey = 'netSales' | 'grossProfit' | 'grossMargin' | 'unitsSold' | 'salesContribution';

export default function ProductPage({ rows, isEmpty, products }: PageProps) {
  const [sortKey, setSortKey] = useState<ProductSortKey>('netSales');
  const [desc, setDesc] = useState(true);

  const productPoints = useMemo(() => groupByProduct(rows, products), [rows, products]);

  const sorted = useMemo(() => {
    const copy = [...productPoints];
    copy.sort((a, b) => {
      const left = a[sortKey] ?? -Infinity;
      const right = b[sortKey] ?? -Infinity;
      return desc ? right - left : left - right;
    });
    return copy;
  }, [productPoints, sortKey, desc]);

  const totalNet = useMemo(
    () => productPoints.reduce((sum, item) => sum + item.netSales, 0),
    [productPoints],
  );
  const totalProfit = useMemo(
    () => productPoints.reduce((sum, item) => sum + item.grossProfit, 0),
    [productPoints],
  );
  const totalUnits = useMemo(
    () => productPoints.reduce((sum, item) => sum + item.unitsSold, 0),
    [productPoints],
  );
  // 订单量不可加：合计必须在筛选后的事实表上独立 DISTINCTCOUNT(OrderID)，不能累加各 SKU 的订单数
  const totalOrders = useMemo(() => computeKpi(rows).orders, [rows]);
  const productOrdersSum = useMemo(
    () => productPoints.reduce((sum, item) => sum + item.orders, 0),
    [productPoints],
  );

  const contributionData = useMemo(
    () => productPoints.map((item) => ({ name: item.name, value: item.netSales })),
    [productPoints],
  );

  const handleSort = (field: ProductSortKey) => {
    if (sortKey === field) setDesc((value) => !value);
    else {
      setSortKey(field);
      setDesc(true);
    }
  };

  const sortHeader = (label: string, field: ProductSortKey) => (
    <th className="num">
      <button type="button" className="sort-btn" onClick={() => handleSort(field)}>
        {label}
        {sortKey === field ? (desc ? ' ↓' : ' ↑') : ''}
      </button>
    </th>
  );

  return (
    <>
      <section className="kpi-grid">
        <KpiCard label="SKU 数" value={isEmpty ? '—' : formatInt(productPoints.length)} hint="筛选后有销售的 SKU" />
        <KpiCard label="净销售额" value={formatUSD(isEmpty ? null : totalNet)} hint="SUM(NetSalesUSD)" />
        <KpiCard label="毛利润" value={formatUSD(isEmpty ? null : totalProfit)} hint="SUM(GrossProfitUSD)" />
        <KpiCard label="销售件数" value={isEmpty ? '—' : formatInt(totalUnits)} hint="SUM(Quantity)" />
        <KpiCard
          label="整体毛利率"
          value={formatPercent(isEmpty ? null : safeDivide(totalProfit, totalNet))}
          hint="汇总毛利润 / 汇总净销售额"
        />
      </section>

      <section className="charts-grid">
        <ChartCard
          title="产品净销售额排名"
          subtitle="金额全部取自 FactSales，不使用 DimProduct.ListPriceUSD；随筛选联动"
          wide
        >
          {isEmpty ? (
            <EmptyChart />
          ) : (
            <div className="chart-body">
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={productPoints} layout="vertical" margin={{ top: 8, right: 24, bottom: 4, left: 8 }}>
                  <CartesianGrid stroke={GRID_STROKE} horizontal={false} />
                  <XAxis
                    type="number"
                    tickFormatter={formatCompactUSD}
                    tick={AXIS_TICK}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    tick={AXIS_TICK}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip formatter={(value) => formatUSD(Number(value))} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="netSales" name="净销售额" fill={BLUE} radius={[0, 3, 3, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="产品销售额占比" subtitle="各 SKU 净销售额占当前筛选净销售额的比例；悬停显示具体金额">
          {isEmpty ? (
            <EmptyChart />
          ) : (
            <div className="chart-body">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={contributionData}
                    dataKey="value"
                    nameKey="name"
                    cx="34%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={78}
                  >
                    {contributionData.map((entry, index) => (
                      <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatUSD(Number(value))} />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    wrapperStyle={{ fontSize: 10, lineHeight: '16px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="产品毛利率对比" subtitle="各 SKU 汇总毛利润 / 汇总净销售额；横轴为百分比刻度（0–1 底层值）">
          {isEmpty ? (
            <EmptyChart />
          ) : (
            <div className="chart-body">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={productPoints} layout="vertical" margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
                  <CartesianGrid stroke={GRID_STROKE} horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, 1]}
                    tickFormatter={formatPercentTick}
                    tick={AXIS_TICK}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    tick={AXIS_TICK}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip formatter={(value) => formatPercent(Number(value))} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="grossMargin" name="毛利率" fill={TEAL} radius={[0, 3, 3, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="产品维度汇总"
          subtitle="点击表头可切换排名维度；排名、占比、订单量均随筛选变化"
          wide
        >
          {isEmpty ? (
            <EmptyTable />
          ) : (
            <>
              <div className="table-meta">
                订单量为不可加指标：各 SKU「含该 SKU 的去重订单数」之和 = {formatInt(productOrdersSum)}，因同一订单含多个
                SKU 而重复计数；合计 {formatInt(totalOrders)} 按当前筛选后的事实表独立 DISTINCTCOUNT(OrderID) 重算。
              </div>
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="num">排名</th>
                      <th>产品名称</th>
                      <th>品类</th>
                      {sortHeader('销售件数', 'unitsSold')}
                      <th className="num">订单量</th>
                      {sortHeader('净销售额', 'netSales')}
                      {sortHeader('毛利润', 'grossProfit')}
                      {sortHeader('毛利率', 'grossMargin')}
                      {sortHeader('销售额占比', 'salesContribution')}
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((item: ProductPoint, index) => (
                      <tr key={item.productId}>
                        <td className="num">{index + 1}</td>
                        <td>{item.name}</td>
                        <td>{item.category}</td>
                        <td className="num">{formatInt(item.unitsSold)}</td>
                        <td className="num">{formatInt(item.orders)}</td>
                        <td className="num">{formatUSD(item.netSales)}</td>
                        <td className="num">{formatUSD(item.grossProfit)}</td>
                        <td className="num">{formatPercent(item.grossMargin)}</td>
                        <td className="num">{formatPercent(item.salesContribution)}</td>
                      </tr>
                    ))}
                    <tr className="total-row">
                      <td className="num">—</td>
                      <td>合计</td>
                      <td>—</td>
                      <td className="num">{formatInt(totalUnits)}</td>
                      <td
                        className="num"
                        title="按筛选后事实表独立去重；不等于各 SKU 订单量之和"
                      >
                        {formatInt(totalOrders)}
                      </td>
                      <td className="num">{formatUSD(totalNet)}</td>
                      <td className="num">{formatUSD(totalProfit)}</td>
                      <td className="num">{formatPercent(safeDivide(totalProfit, totalNet))}</td>
                      <td className="num">{formatPercent(safeDivide(totalNet, totalNet))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </ChartCard>
      </section>
    </>
  );
}
