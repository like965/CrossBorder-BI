import type { ReactNode } from 'react';

/** 与 Stage 1 首页完全一致的展示组件，五个页面共用 */
export function KpiCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="kpi-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-hint">{hint}</div>
    </div>
  );
}

export function ChartCard({
  title,
  subtitle,
  wide = false,
  children,
}: {
  title: string;
  subtitle: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={`chart-card${wide ? ' chart-card-wide' : ''}`}>
      <div className="chart-head">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

export function StatePanel({
  title,
  message,
  actionLabel,
  onAction,
  tone = 'info',
}: {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: 'info' | 'error';
}) {
  return (
    <div className={`state-panel state-panel-${tone}`}>
      <h2>{title}</h2>
      <p>{message}</p>
      {actionLabel && onAction && (
        <button type="button" className="action-btn" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function EmptyChart() {
  return <div className="empty-chart">当前筛选条件下没有数据</div>;
}

export function EmptyTable() {
  return <div className="empty-table">当前筛选或搜索条件下没有记录</div>;
}
