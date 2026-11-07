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
import { ChartCard, EmptyChart, KpiCard } from '../components/ui';
import { AXIS_TICK, BLUE, GRID_STROKE, TEAL } from '../lib/chartTheme';
import { formatCompactUSD, formatInt, formatPercent, formatUSD } from '../lib/format';
import { computeKpi, groupByChannel, groupByCountry, groupByMonth } from '../lib/metrics';
import type { PageProps } from '../lib/types';

/** Stage 1 已验收的经营总览：计算逻辑与图表保持不变，仅改为消费全局筛选后的 rows */
export default function OverviewPage({ rows, isEmpty }: PageProps) {
  const kpi = useMemo(() => computeKpi(rows), [rows]);
  const monthly = useMemo(() => groupByMonth(rows), [rows]);
  const channels = useMemo(() => groupByChannel(rows), [rows]);
  const countries = useMemo(() => groupByCountry(rows), [rows]);

  return (
    <>
      <section className="kpi-grid">
        <KpiCard
          label="净销售额"
          value={formatUSD(isEmpty ? null : kpi.netSales)}
          hint="SUM(NetSalesUSD)"
        />
        <KpiCard
          label="毛利润"
          value={formatUSD(isEmpty ? null : kpi.grossProfit)}
          hint="SUM(GrossProfitUSD) · 已扣三项成本"
        />
        <KpiCard label="毛利率" value={formatPercent(kpi.grossMargin)} hint="毛利润 / 净销售额 · 0–1 底层值" />
        <KpiCard
          label="订单量"
          value={isEmpty ? '—' : formatInt(kpi.orders)}
          hint="DISTINCTCOUNT(OrderID)"
        />
        <KpiCard label="客单价" value={formatUSD(kpi.aov)} hint="净销售额 / 去重订单量" />
      </section>

      <section className="charts-grid">
        <ChartCard title="月度趋势｜净销售额与毛利润" subtitle="按 YearMonth 聚合，随筛选联动" wide>
          {isEmpty ? (
            <EmptyChart />
          ) : (
            <div className="chart-body">
              <ResponsiveContainer width="100%" height={290}>
                <ComposedChart data={monthly} margin={{ top: 8, right: 12, bottom: 4, left: 8 }}>
                  <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                  <XAxis dataKey="month" tick={AXIS_TICK} tickLine={false} axisLine={false} />
                  <YAxis
                    tickFormatter={formatCompactUSD}
                    tick={AXIS_TICK}
                    tickLine={false}
                    axisLine={false}
                    width={70}
                  />
                  <Tooltip formatter={(value) => formatUSD(Number(value))} labelFormatter={(label) => `月份 ${label}`} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="netSales" name="净销售额" fill={BLUE} radius={[3, 3, 0, 0]} maxBarSize={28} />
                  <Line
                    dataKey="grossProfit"
                    name="毛利润"
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

        <ChartCard title="渠道分析｜净销售额与毛利率" subtitle="毛利率 = 分组毛利润 / 分组净销售额，右轴为百分比">
          {isEmpty ? (
            <EmptyChart />
          ) : (
            <div className="chart-body">
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={channels} margin={{ top: 8, right: 8, bottom: 4, left: 8 }}>
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
                    tickFormatter={(value: number) => `${Math.round(value * 100)}%`}
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
                    dataKey="netSales"
                    name="净销售额"
                    fill={BLUE}
                    radius={[3, 3, 0, 0]}
                    maxBarSize={38}
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

        <ChartCard title="国家 / 地区分析｜净销售额" subtitle="按净销售额降序，随筛选联动">
          {isEmpty ? (
            <EmptyChart />
          ) : (
            <div className="chart-body">
              <ResponsiveContainer width="100%" height={280}>
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
                  <Bar dataKey="netSales" name="净销售额" fill={BLUE} radius={[0, 3, 3, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </section>
    </>
  );
}
