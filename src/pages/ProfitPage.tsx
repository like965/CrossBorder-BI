import { useMemo } from 'react';
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartCard, EmptyChart, EmptyTable, KpiCard } from '../components/ui';
import { AMBER, AXIS_TICK, BLUE, GRID_STROKE, TEAL, VIOLET } from '../lib/chartTheme';
import {
  formatCompactUSD,
  formatPercent,
  formatPercentTick,
  formatUSD,
} from '../lib/format';
import { computeCostKpi, groupByChannelProfit, groupByMonth, safeDivide } from '../lib/metrics';
import type { PageProps } from '../lib/types';

export default function ProfitPage({ rows, isEmpty }: PageProps) {
  const cost = useMemo(() => computeCostKpi(rows), [rows]);
  const monthly = useMemo(() => groupByMonth(rows), [rows]);
  const channelProfit = useMemo(() => groupByChannelProfit(rows), [rows]);

  const monthlyMargin = useMemo(
    () =>
      monthly.map((point) => ({
        month: point.month,
        grossProfit: point.grossProfit,
        grossMargin: safeDivide(point.grossProfit, point.netSales),
      })),
    [monthly],
  );

  const costStructure = useMemo(
    () => [
      { name: '商品成本', value: cost.cogs },
      { name: '物流成本', value: cost.shipping },
      { name: '平台费用', value: cost.platformFee },
    ],
    [cost],
  );

  return (
    <>
      <section className="kpi-grid kpi-grid-roomy">
        <KpiCard label="毛利润" value={formatUSD(isEmpty ? null : cost.grossProfit)} hint="SUM(GrossProfitUSD)" />
        <KpiCard label="毛利率" value={formatPercent(cost.grossMargin)} hint="毛利润 / 净销售额 · 0–1 底层值" />
        <KpiCard label="总成本" value={formatUSD(isEmpty ? null : cost.totalCost)} hint="三项成本之和" />
        <KpiCard label="商品成本" value={formatUSD(isEmpty ? null : cost.cogs)} hint="SUM(COGSUSD)" />
        <KpiCard label="物流成本" value={formatUSD(isEmpty ? null : cost.shipping)} hint="SUM(ShippingCostUSD)" />
        <KpiCard label="平台费用" value={formatUSD(isEmpty ? null : cost.platformFee)} hint="SUM(PlatformFeeUSD)" />
      </section>

      <section className="charts-grid">
        <ChartCard
          title="月度趋势｜毛利润与毛利率"
          subtitle="左轴毛利润，右轴毛利率（聚合后相除，0–1 底层值）；随筛选联动"
          wide
        >
          {isEmpty ? (
            <EmptyChart />
          ) : (
            <div className="chart-body">
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={monthlyMargin} margin={{ top: 8, right: 8, bottom: 4, left: 8 }}>
                  <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                  <XAxis dataKey="month" tick={AXIS_TICK} tickLine={false} axisLine={false} />
                  <YAxis
                    yAxisId="left"
                    tickFormatter={formatCompactUSD}
                    tick={AXIS_TICK}
                    tickLine={false}
                    axisLine={false}
                    width={70}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 1]}
                    tickFormatter={formatPercentTick}
                    tick={AXIS_TICK}
                    tickLine={false}
                    axisLine={false}
                    width={48}
                  />
                  <Tooltip
                    formatter={(value, name) =>
                      name === '毛利率' ? formatPercent(Number(value)) : formatUSD(Number(value))
                    }
                    labelFormatter={(label) => `月份 ${label}`}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar
                    yAxisId="left"
                    dataKey="grossProfit"
                    name="毛利润"
                    fill={BLUE}
                    radius={[3, 3, 0, 0]}
                    maxBarSize={30}
                  />
                  <Line
                    yAxisId="right"
                    dataKey="grossMargin"
                    name="毛利率"
                    stroke={TEAL}
                    strokeWidth={2}
                    dot={{ r: 3, fill: TEAL }}
                    activeDot={{ r: 5 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="成本构成｜商品 / 物流 / 平台费用" subtitle="仅作结构展示；毛利润已扣除三项成本，不重复扣减">
          {isEmpty ? (
            <EmptyChart />
          ) : (
            <div className="chart-body">
              <ResponsiveContainer width="100%" height={270}>
                <PieChart>
                  <Pie
                    data={costStructure}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={92}
                    paddingAngle={2}
                  >
                    {costStructure.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={entry.name === '商品成本' ? BLUE : entry.name === '物流成本' ? TEAL : AMBER}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatUSD(Number(value))} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="渠道分析｜毛利润与毛利率" subtitle="毛利率 = 分组毛利润 / 分组净销售额，右轴为百分比">
          {isEmpty ? (
            <EmptyChart />
          ) : (
            <div className="chart-body">
              <ResponsiveContainer width="100%" height={270}>
                <ComposedChart data={channelProfit} margin={{ top: 8, right: 8, bottom: 4, left: 8 }}>
                  <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                  <XAxis dataKey="channel" tick={AXIS_TICK} tickLine={false} axisLine={false} />
                  <YAxis
                    yAxisId="left"
                    tickFormatter={formatCompactUSD}
                    tick={AXIS_TICK}
                    tickLine={false}
                    axisLine={false}
                    width={70}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 1]}
                    tickFormatter={formatPercentTick}
                    tick={AXIS_TICK}
                    tickLine={false}
                    axisLine={false}
                    width={48}
                  />
                  <Tooltip
                    formatter={(value, name) =>
                      name === '毛利率' ? formatPercent(Number(value)) : formatUSD(Number(value))
                    }
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar
                    yAxisId="left"
                    dataKey="grossProfit"
                    name="毛利润"
                    fill={VIOLET}
                    radius={[3, 3, 0, 0]}
                    maxBarSize={40}
                  />
                  <Line
                    yAxisId="right"
                    dataKey="grossMargin"
                    name="毛利率"
                    stroke={TEAL}
                    strokeWidth={2}
                    dot={{ r: 3, fill: TEAL }}
                    activeDot={{ r: 5 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="渠道利润汇总"
          subtitle="与上方图表使用同一份筛选后数据；总成本 = 商品成本 + 物流成本 + 平台费用"
          wide
        >
          {isEmpty ? (
            <EmptyTable />
          ) : (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>渠道</th>
                    <th className="num">净销售额</th>
                    <th className="num">毛利润</th>
                    <th className="num">毛利率</th>
                    <th className="num">总成本</th>
                  </tr>
                </thead>
                <tbody>
                  {channelProfit.map((item) => (
                    <tr key={item.channel}>
                      <td>{item.channel}</td>
                      <td className="num">{formatUSD(item.netSales)}</td>
                      <td className="num">{formatUSD(item.grossProfit)}</td>
                      <td className="num">{formatPercent(item.grossMargin)}</td>
                      <td className="num">{formatUSD(item.totalCost)}</td>
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td>合计（按筛选后事实表重算）</td>
                    <td className="num">{formatUSD(cost.netSales)}</td>
                    <td className="num">{formatUSD(cost.grossProfit)}</td>
                    <td className="num">{formatPercent(cost.grossMargin)}</td>
                    <td className="num">{formatUSD(cost.totalCost)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </ChartCard>
      </section>
    </>
  );
}
