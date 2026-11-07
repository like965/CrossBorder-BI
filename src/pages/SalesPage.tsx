import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartCard, EmptyChart, EmptyTable, KpiCard } from '../components/ui';
import { AXIS_TICK, BLUE, GRID_STROKE, TEAL } from '../lib/chartTheme';
import { formatCompactUSD, formatInt, formatUSD } from '../lib/format';
import {
  computeSalesKpi,
  groupByChannelSales,
  groupByCountry,
  groupByMonth,
  groupByMonthOrders,
} from '../lib/metrics';
import type { PageProps } from '../lib/types';

export default function SalesPage({ rows, isEmpty }: PageProps) {
  const kpi = useMemo(() => computeSalesKpi(rows), [rows]);
  const monthly = useMemo(() => groupByMonth(rows), [rows]);
  const monthlyOrders = useMemo(() => groupByMonthOrders(rows), [rows]);
  const channelSales = useMemo(() => groupByChannelSales(rows), [rows]);
  const countries = useMemo(() => groupByCountry(rows), [rows]);

  // 月度净销售额与去重订单量按月份对齐，合并为同一张双轴趋势图
  const trend = useMemo(
    () =>
      monthly.map((point) => ({
        month: point.month,
        netSales: point.netSales,
        orders: monthlyOrders.find((item) => item.month === point.month)?.orders ?? 0,
      })),
    [monthly, monthlyOrders],
  );

  return (
    <>
      <section className="kpi-grid kpi-grid-roomy">
        <KpiCard label="折前销售额" value={formatUSD(isEmpty ? null : kpi.grossSales)} hint="SUM(GrossSalesUSD)" />
        <KpiCard label="折扣" value={formatUSD(isEmpty ? null : kpi.discount)} hint="SUM(DiscountUSD)" />
        <KpiCard label="净销售额" value={formatUSD(isEmpty ? null : kpi.netSales)} hint="SUM(NetSalesUSD)" />
        <KpiCard label="订单量" value={isEmpty ? '—' : formatInt(kpi.orders)} hint="DISTINCTCOUNT(OrderID)" />
        <KpiCard label="客单价" value={formatUSD(kpi.aov)} hint="净销售额 / 去重订单量" />
        <KpiCard label="销售件数" value={isEmpty ? '—' : formatInt(kpi.unitsSold)} hint="SUM(Quantity)" />
      </section>

      <section className="charts-grid">
        <ChartCard
          title="月度趋势｜净销售额与订单量"
          subtitle="左轴净销售额，右轴按 OrderID 去重的订单量；随筛选联动"
          wide
        >
          {isEmpty ? (
            <EmptyChart />
          ) : (
            <div className="chart-body">
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={trend} margin={{ top: 8, right: 8, bottom: 4, left: 8 }}>
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
                    tick={AXIS_TICK}
                    tickLine={false}
                    axisLine={false}
                    width={48}
                  />
                  <Tooltip
                    formatter={(value, name) =>
                      name === '订单量' ? formatInt(Number(value)) : formatUSD(Number(value))
                    }
                    labelFormatter={(label) => `月份 ${label}`}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar
                    yAxisId="left"
                    dataKey="netSales"
                    name="净销售额"
                    fill={BLUE}
                    radius={[3, 3, 0, 0]}
                    maxBarSize={30}
                  />
                  <Line
                    yAxisId="right"
                    dataKey="orders"
                    name="订单量"
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

        <ChartCard title="渠道分析｜净销售额对比" subtitle="各渠道 SUM(NetSalesUSD)，随筛选联动">
          {isEmpty ? (
            <EmptyChart />
          ) : (
            <div className="chart-body">
              <ResponsiveContainer width="100%" height={270}>
                <BarChart data={channelSales} margin={{ top: 8, right: 12, bottom: 4, left: 8 }}>
                  <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                  <XAxis dataKey="channel" tick={AXIS_TICK} tickLine={false} axisLine={false} />
                  <YAxis
                    tickFormatter={formatCompactUSD}
                    tick={AXIS_TICK}
                    tickLine={false}
                    axisLine={false}
                    width={70}
                  />
                  <Tooltip formatter={(value) => formatUSD(Number(value))} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="netSales" name="净销售额" fill={BLUE} radius={[3, 3, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="国家 / 地区分析｜净销售额对比" subtitle="按净销售额降序，随筛选联动">
          {isEmpty ? (
            <EmptyChart />
          ) : (
            <div className="chart-body">
              <ResponsiveContainer width="100%" height={270}>
                <BarChart data={countries} layout="vertical" margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
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
                    dataKey="country"
                    width={110}
                    tick={AXIS_TICK}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip formatter={(value) => formatUSD(Number(value))} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="netSales" name="净销售额" fill={TEAL} radius={[0, 3, 3, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="渠道销售汇总"
          subtitle="与上方图表使用同一份筛选后数据；订单量按各渠道 DISTINCTCOUNT(OrderID)"
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
                    <th className="num">订单量</th>
                    <th className="num">销售件数</th>
                    <th className="num">客单价</th>
                  </tr>
                </thead>
                <tbody>
                  {channelSales.map((item) => (
                    <tr key={item.channel}>
                      <td>{item.channel}</td>
                      <td className="num">{formatUSD(item.netSales)}</td>
                      <td className="num">{formatInt(item.orders)}</td>
                      <td className="num">{formatInt(item.unitsSold)}</td>
                      <td className="num">{formatUSD(item.aov)}</td>
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td>合计（按筛选后事实表重算）</td>
                    <td className="num">{formatUSD(kpi.netSales)}</td>
                    <td className="num">{formatInt(kpi.orders)}</td>
                    <td className="num">{formatInt(kpi.unitsSold)}</td>
                    <td className="num">{formatUSD(kpi.aov)}</td>
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
