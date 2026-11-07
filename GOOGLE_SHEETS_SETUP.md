# Google Sheets 数据源设置

## 0. 数据源模式（V1 约定）

同一套虚构模拟数据只有两种读取位置，字段、指标计算、数据模型完全一致，口径唯一来源是 `Metric_Dictionary.csv`：

| 模式 | 读取对象 | 状态 |
|---|---|---|
| `local` | 项目目录下六个本地 CSV：FactSales / DimDate / DimProduct / DimChannel / DimCountry / Metric_Dictionary | **开发阶段默认**，可直接使用 |
| `online` | Google Sheets 发布到网络的 CSV URL | **待本地浏览器验证**后启用 |

配置模块：`src/config/dataSources.ts`（Stage 0.5 预留，纯配置、无依赖、无读取逻辑）。切换只改 `DATA_SOURCE_MODE`。V1 不引入 Supabase、后端、付费 API 或其他数据源；本地 CSV 与 Google Sheets 是同一套数据的两种读取位置，不是两套数据。

## 1. 建立主 Spreadsheet

新建一个 Google Spreadsheet，命名为 `CrossBorder BI - Demo Dataset`。将以下 CSV 分别导入为同名工作表：FactSales、DimDate、DimProduct、DimChannel、DimCountry、Metric_Dictionary。导入时选择“替换当前工作表”，不要把所有 CSV 合并到一个 Sheet。

## 2. 发布 CSV 与链接格式检查

对每个数据工作表分别使用“文件 → 分享 → 发布到网络”：选择「链接」→ 选中单个工作表 → 格式选「逗号分隔值 (.csv)」→ 发布，复制生成的链接，保存到 `src/config/dataSources.ts`（或项目根目录 `.env.local`）。

**可被 `fetch()` 读取的 CSV 链接格式**（每张表一个 gid）：

```
https://docs.google.com/spreadsheets/d/e/<发布ID>/pub?gid=<gid>&single=true&output=csv
```

**对现有 6 个链接的静态格式检查结论：**

- 6 个链接共用同一发布 ID，gid 各不相同，与「一个 Spreadsheet、六个工作表」一致；链接结构完整、无明显截断。
- 路径为 `pubhtml?...&single=true`，属于「发布到网络」的 HTML 网页预览，返回 HTML 表格，**不是** `output=csv` 的 CSV 端点。它们在浏览器中可正常打开（用户已在 Mac 浏览器确认），**不判定为失效**；但不能直接当作 CSV 被 `fetch()` 解析。
- 因此 `online` 模式需按 CSV 格式重新发布，或使用上面的 `pub?...&output=csv` 形式；推导后的 URL 已保留在 `src/config/dataSources.ts` 的 `SOURCES.online` 中，状态统一标为 `pending-verification`。
- 本阶段不发起任何 Google 网络请求：AI 执行环境的代理无法访问 `docs.google.com`（返回 502），这是执行环境的网络出口限制，**不代表链接失效**。在线连通性与 CORS 一律标记为「待本地浏览器验证」，不标记为通过或失败。

**原始链接（待验证配置，保留不删除）：**

| 工作表 | gid | 用户提供的 pubhtml 链接 |
|---|---|---|
| DimChannel | 1015215098 | https://docs.google.com/spreadsheets/d/e/2PACX-1vRrEG07YGDN389-MriWmkrOyzc_dGhR-6GhJvxMCsDXmC47vJLqrHcSHSmfIEnYxEDDzY_uKpnUDpsY/pubhtml?gid=1015215098&single=true |
| DimCountry | 1321883156 | https://docs.google.com/spreadsheets/d/e/2PACX-1vRrEG07YGDN389-MriWmkrOyzc_dGhR-6GhJvxMCsDXmC47vJLqrHcSHSmfIEnYxEDDzY_uKpnUDpsY/pubhtml?gid=1321883156&single=true |
| DimDate | 2038944963 | https://docs.google.com/spreadsheets/d/e/2PACX-1vRrEG07YGDN389-MriWmkrOyzc_dGhR-6GhJvxMCsDXmC47vJLqrHcSHSmfIEnYxEDDzY_uKpnUDpsY/pubhtml?gid=2038944963&single=true |
| DimProduct | 949396972 | https://docs.google.com/spreadsheets/d/e/2PACX-1vRrEG07YGDN389-MriWmkrOyzc_dGhR-6GhJvxMCsDXmC47vJLqrHcSHSmfIEnYxEDDzY_uKpnUDpsY/pubhtml?gid=949396972&single=true |
| FactSales | 1375678292 | https://docs.google.com/spreadsheets/d/e/2PACX-1vRrEG07YGDN389-MriWmkrOyzc_dGhR-6GhJvxMCsDXmC47vJLqrHcSHSmfIEnYxEDDzY_uKpnUDpsY/pubhtml?gid=1375678292&single=true |
| Metric_Dictionary | 506011943 | https://docs.google.com/spreadsheets/d/e/2PACX-1vRrEG07YGDN389-MriWmkrOyzc_dGhR-6GhJvxMCsDXmC47vJLqrHcSHSmfIEnYxEDDzY_uKpnUDpsY/pubhtml?gid=506011943&single=true |

**安全提醒：** 发布到网络意味着数据可被公开访问，这些是公开发布链接，不是私有安全数据源。这里只能发布虚构模拟数据；绝不能发布真实客户、公司、员工或个人数据。不要把 Google 账号密码、服务账号私钥或其他密钥写进前端代码。

> 注意：Stage 0.5 修改了 `Metric_Dictionary.csv`（现为 14 行指标/字段定义）。启用 `online` 模式前，需在 Spreadsheet 中对同名工作表用「替换当前工作表」重新导入该文件并重新发布，否则在线读到的仍是旧口径。

## 3. Web 读取方式与验证清单

V1 通过 `fetch()` 读取 CSV，每张表一个 URL；加入加载状态、错误提示、数据缓存和手动刷新按钮。`local` 与 `online` 共用同一套解析、字段映射与指标函数，不得按模式分叉计算逻辑。跨域或 Google 发布链接格式变化时，先验证浏览器能否直接访问 CSV；不要擅自加后端或付费服务。

**在线连通性与 CORS 验证：待本地浏览器验证**（本执行环境无法完成）。请在可正常访问 Google Sheets 的 Mac 浏览器逐项确认：

1. 新标签页打开每个 CSV URL：应显示/下载纯文本 CSV 而不是 HTML 表格，首行为表头。
2. F12 → Network → 刷新：请求 Status 200，`Content-Type` 为 `text/csv`；若发生重定向，检查**最终响应**的状态与响应头。
3. CORS：在最终部署源（如 `https://<用户名>.github.io`）打开页面，Network 中选中 CSV 请求，Response Headers 需含 `Access-Control-Allow-Origin`（`*` 或该部署源），Console 不得出现 CORS 报错。**地址栏能打开 ≠ `fetch()` 能读取**。
4. 表头比对：剥离 UTF-8 BOM 并 trim 后，与本地 CSV 表头逐字一致、列数一致（六个 CSV 首列均带 BOM）。
5. 行数核对：FactSales 6243 / DimDate 365 / DimProduct 12 / DimChannel 4 / DimCountry 5 / Metric_Dictionary 14（需先完成上节重新导入）。
6. 中文编码为 UTF-8 无乱码；金额列为纯数字，无 `$`、千分位或空格。
7. 六个 gid 与工作表名一一对应，未串表。
8. 六张表全部通过后，才把 `DATA_SOURCE_MODE` 切换为 `online`；未通过时保持 `local`。

## 4. Power BI 读取方式

开发阶段直接导入项目目录下六个本地 CSV（local 模式）；online 模式在链接验证通过后，使用 Power BI Desktop → 获取数据 → Web，粘贴相同的 CSV 发布链接。每个表单独导入，并按 POWER_BI_GUIDE.md 建立关系。Power BI Desktop 的本地刷新与 Power BI Service 的在线刷新/分享是不同能力，V1 只要求 Desktop 可刷新。

## 5. 建议的配置方式

- 本地开发：将发布链接放在 `.env.local`，并把该文件加入 `.gitignore`；配置统一由 `src/config/dataSources.ts` 管理。
- 公开 GitHub Pages：前端必须能访问数据，因此 CSV 发布链接最终会暴露给访问者；这对虚构公开数据是可接受的，但不得描述为安全私有数据源。
- V1 只使用本地 CSV 与 Google Sheets 发布 CSV 两种读取位置，不引入 Supabase、后端、数据库或付费 API。若未来数据不适合公开，需先重新评估数据源方案（本阶段不实施）。

## 6. 刷新策略

V1：页面加载时读取，提供手动刷新；可设置短时内存缓存。不要每几秒轮询。Google Sheets 不是高并发生产数据库。
