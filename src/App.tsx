import { useEffect, useMemo, useState } from 'react';
import { StatePanel } from './components/ui';
import { DATA_SOURCE_MODE } from './config/dataSources';
import { loadOverviewData, type Dataset } from './lib/dataSource';
import { filterRows } from './lib/metrics';
import type { Filters, PageKey, PageProps } from './lib/types';
import DetailPage from './pages/DetailPage';
import OverviewPage from './pages/OverviewPage';
import ProductPage from './pages/ProductPage';
import ProfitPage from './pages/ProfitPage';
import SalesPage from './pages/SalesPage';

const EMPTY_FILTERS: Filters = { month: '', channel: '', country: '' };

const NAV_ITEMS: { key: PageKey; label: string }[] = [
  { key: 'overview', label: '经营总览' },
  { key: 'sales', label: '销售分析' },
  { key: 'profit', label: '利润分析' },
  { key: 'product', label: '产品分析' },
  { key: 'detail', label: '经营明细' },
];

type Status = 'loading' | 'ready' | 'error';

export default function App() {
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState('');
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [activePage, setActivePage] = useState<PageKey>('overview');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setError('');
    loadOverviewData()
      .then((data) => {
        if (cancelled) return;
        setDataset(data);
        setStatus('ready');
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setError(cause instanceof Error ? cause.message : String(cause));
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  // 全局唯一筛选结果：五个页面共用，页面切换不重置筛选
  const filtered = useMemo(
    () => (dataset ? filterRows(dataset.facts, filters) : []),
    [dataset, filters],
  );
  const isEmpty = filtered.length === 0;
  const hasFilter = Boolean(filters.month || filters.channel || filters.country);
  const pageLabel = NAV_ITEMS.find((item) => item.key === activePage)?.label ?? '经营总览';

  const pageProps: PageProps = {
    rows: filtered,
    isEmpty,
    products: dataset?.products ?? [],
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark">CB</div>
          <div>
            <h1>CrossBorder BI｜跨境电商经营分析平台</h1>
            <p>{pageLabel} · 数据周期 2025-01-01 ~ 2025-12-31 · 币种 USD</p>
          </div>
        </div>
        <div className="badges">
          <span className="badge badge-demo">模拟数据 / Fictional Demo Data</span>
          <span className="badge">USD</span>
          <span className="badge">数据源：本地 CSV（{DATA_SOURCE_MODE}）</span>
        </div>
      </header>

      <div className="app-layout">
        <nav className="sidebar" aria-label="页面导航">
          <div className="sidebar-title">分析页面</div>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`nav-item${activePage === item.key ? ' nav-item-active' : ''}`}
              aria-current={activePage === item.key ? 'page' : undefined}
              onClick={() => setActivePage(item.key)}
            >
              <span className="nav-dot" />
              {item.label}
            </button>
          ))}
        </nav>

        <main className="main-area">
          {status === 'loading' && (
            <StatePanel title="正在加载数据" message="正在读取本地 CSV 并计算指标，请稍候…" />
          )}

          {status === 'error' && (
            <StatePanel
              title="数据读取失败"
              message={`${error}。请确认 public/data/ 下的 CSV 文件存在且字段完整。`}
              tone="error"
              actionLabel="重新加载"
              onAction={() => setReloadKey((value) => value + 1)}
            />
          )}

          {status === 'ready' && dataset && (
            <>
              <section className="filter-bar">
                <label className="filter-item">
                  <span>月份</span>
                  <select
                    value={filters.month}
                    onChange={(event) => setFilters((prev) => ({ ...prev, month: event.target.value }))}
                  >
                    <option value="">全部月份</option>
                    {dataset.months.map((month) => (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="filter-item">
                  <span>渠道</span>
                  <select
                    value={filters.channel}
                    onChange={(event) => setFilters((prev) => ({ ...prev, channel: event.target.value }))}
                  >
                    <option value="">全部渠道</option>
                    {dataset.channels.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="filter-item">
                  <span>国家 / 地区</span>
                  <select
                    value={filters.country}
                    onChange={(event) => setFilters((prev) => ({ ...prev, country: event.target.value }))}
                  >
                    <option value="">全部国家 / 地区</option>
                    {dataset.countries.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  className="reset-btn"
                  onClick={() => setFilters(EMPTY_FILTERS)}
                  disabled={!hasFilter}
                >
                  清除筛选
                </button>

                <div className="filter-summary">
                  {hasFilter ? '已应用筛选 · 五个页面 KPI 与图表同步联动' : '未筛选 · 展示全量数据'}
                </div>
              </section>

              {isEmpty && (
                <div className="empty-banner">
                  当前筛选条件下没有数据。请调整筛选条件，或点击「清除筛选」查看全量数据。
                </div>
              )}

              {activePage === 'overview' && <OverviewPage {...pageProps} />}
              {activePage === 'sales' && <SalesPage {...pageProps} />}
              {activePage === 'profit' && <ProfitPage {...pageProps} />}
              {activePage === 'product' && <ProductPage {...pageProps} />}
              {activePage === 'detail' && <DetailPage {...pageProps} />}
            </>
          )}
        </main>
      </div>

      <footer className="app-footer">
        模拟数据 / Fictional Demo Data · 币种 USD · 指标口径以 Metric_Dictionary.csv 为准 ·
        订单量按 DISTINCTCOUNT(OrderID) · 毛利率与折扣率底层 0–1、展示保留 1 位小数
      </footer>
    </div>
  );
}
