import { useEffect, useMemo, useState } from 'react';
import { ChartCard, EmptyTable } from '../components/ui';
import { formatInt, formatPercent, formatUSD } from '../lib/format';
import { buildDetailRows } from '../lib/metrics';
import type { DetailRecord, PageProps } from '../lib/types';

type SortField = 'orderDate' | 'netSales' | 'grossProfit';
const PAGE_SIZE = 20;

export default function DetailPage({ rows, isEmpty, products }: PageProps) {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('orderDate');
  const [desc, setDesc] = useState(true);
  const [page, setPage] = useState(1);

  const detailRows = useMemo(() => buildDetailRows(rows, products), [rows, products]);

  const searched = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return detailRows;
    return detailRows.filter(
      (item) =>
        item.orderId.toLowerCase().includes(query) || item.productName.toLowerCase().includes(query),
    );
  }, [detailRows, search]);

  const sorted = useMemo(() => {
    const copy = [...searched];
    copy.sort((a: DetailRecord, b: DetailRecord) => {
      let comparison: number;
      if (sortField === 'orderDate') comparison = a.orderDate.localeCompare(b.orderDate);
      else comparison = a[sortField] - b[sortField];
      if (comparison === 0) comparison = a.orderId.localeCompare(b.orderId);
      return desc ? -comparison : comparison;
    });
    return copy;
  }, [searched, sortField, desc]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // 全局筛选、搜索、排序变化后回到第一页；这些操作不改变 KPI 汇总口径
  useEffect(() => {
    setPage(1);
  }, [rows, search, sortField, desc]);

  return (
    <ChartCard
      title="经营明细｜订单商品行"
      subtitle="搜索、排序、分页只影响展示范围；所有金额与口径直接取自筛选后的事实表"
      wide
    >
      <div className="table-toolbar">
        <input
          type="search"
          value={search}
          placeholder="搜索产品名或订单号"
          onChange={(event) => setSearch(event.target.value)}
        />
        <select value={sortField} onChange={(event) => setSortField(event.target.value as SortField)}>
          <option value="orderDate">按订单日期排序</option>
          <option value="netSales">按净销售额排序</option>
          <option value="grossProfit">按毛利润排序</option>
        </select>
        <button type="button" className="reset-btn" onClick={() => setDesc((value) => !value)}>
          {desc ? '降序 ↓' : '升序 ↑'}
        </button>
        <span className="table-meta">
          筛选后 {formatInt(detailRows.length)} 行 · 搜索命中 {formatInt(sorted.length)} 行
        </span>
      </div>

      {isEmpty || sorted.length === 0 ? (
        <EmptyTable />
      ) : (
        <>
          <div className="table-meta">
            每行代表一个订单中的一个产品明细，不代表一个独立订单；毛利率为该明细行自身的毛利润 / 净销售额。
          </div>
          <div className="table-scroll">
            <table className="data-table detail-table">
              <thead>
                <tr>
                  <th>订单号</th>
                  <th>订单日期</th>
                  <th>月份</th>
                  <th>渠道</th>
                  <th>国家 / 地区</th>
                  <th>产品名称</th>
                  <th>品类</th>
                  <th className="num">数量</th>
                  <th className="num">折前销售额</th>
                  <th className="num">折扣</th>
                  <th className="num">净销售额</th>
                  <th className="num">商品成本</th>
                  <th className="num">物流成本</th>
                  <th className="num">平台费用</th>
                  <th className="num">毛利润</th>
                  <th className="num">毛利率</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((item, index) => (
                  <tr key={`${item.orderId}-${item.productName}-${index}`}>
                    <td>{item.orderId}</td>
                    <td>{item.orderDate}</td>
                    <td>{item.yearMonth}</td>
                    <td>{item.channel}</td>
                    <td>{item.country}</td>
                    <td>{item.productName}</td>
                    <td>{item.category}</td>
                    <td className="num">{formatInt(item.quantity)}</td>
                    <td className="num">{formatUSD(item.grossSales)}</td>
                    <td className="num">{formatUSD(item.discount)}</td>
                    <td className="num">{formatUSD(item.netSales)}</td>
                    <td className="num">{formatUSD(item.cogs)}</td>
                    <td className="num">{formatUSD(item.shipping)}</td>
                    <td className="num">{formatUSD(item.platformFee)}</td>
                    <td className="num">{formatUSD(item.grossProfit)}</td>
                    <td className="num">{formatPercent(item.grossMargin)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pager">
            <span>
              第 {currentPage} / {totalPages} 页 · 每页 {PAGE_SIZE} 行 · 共 {formatInt(sorted.length)} 行
            </span>
            <span className="pager-controls">
              <button
                type="button"
                className="reset-btn"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={currentPage <= 1}
              >
                上一页
              </button>
              <button
                type="button"
                className="reset-btn"
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                disabled={currentPage >= totalPages}
              >
                下一页
              </button>
            </span>
          </div>
        </>
      )}
    </ChartCard>
  );
}
