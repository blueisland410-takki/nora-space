# NORA SPACE：Render 免费个人使用部署

更新：2026-10-29。仓库代码、数据库结构检查和实际部署是不同的验收项。当前没有取得 Render 服务地址，不能据此宣称网站已经上线。

## 部署配置

`render.yaml` 明确使用 `plan: free`，不附加磁盘、Render 数据库或付费计算资源。它替换了本地未提交的 `0.5c-512mb` 付费草案。

| 项目 | 值 |
| --- | --- |
| 仓库 | blueisland410-takki/nora-space |
| 分支 | main |
| 类型 | Node Web Service |
| Root Directory | 仓库根目录，留空或 ./ |
| Node | package.json 的 24.x |
| 构建 | npm ci && npm run build |
| 启动 | npm run start -- --hostname 0.0.0.0 --port $PORT |
| 健康检查 | /login |
| 自动部署 | GitHub checksPass |

两个环境变量需在 Render 填入现有 Supabase 项目的值：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

只使用 Publishable Key。不要上传 `.env.local`。这些公开变量在构建时写入浏览器包，修改后需重新构建。

## 创建或复用服务

1. 在原来的 Hobby Workspace 查看是否已有 NORA SPACE 服务；有则先核对并复用，不重复创建。
2. 使用 Blueprint 时，Render 从所选分支读取 `render.yaml`。使用 New → Web Service 时，表单需要手动填写上述参数并选 Free；该表单不会自动套用本地 YAML。
3. 在提交前确认计算计划是 Free、没有磁盘或额外资源。Hobby 是 Workspace 套餐，Free 是服务计算套餐，二者分开设置。
4. 如果选 Free 后仍强制 Add Card，保存提示原文并联系 Render Dashboard 支持，核对账号或 Workspace 的验证要求。单凭 Hobby Current plan 或本地 YAML 不能判断该提示的确切原因。
5. 获得真实 HTTPS 地址后，在 Supabase Auth 配置实际 Site URL，保留本地开发回调地址。使用自己的账户完成登录、刷新、任务/学习/健身保存、退出和手机验收。

本项目使用 Next.js 动态页面、Server Actions、Proxy 和 cookie 登录，应运行 Node Web Service。当前没有配置静态导出。

## 免费服务限制

Render 官方将 Free 定位为个人项目和体验用途；闲置 15 分钟后休眠，再次访问约需一分钟唤醒。实例时间、构建和流量有用量限制，不提供常驻运行承诺。若需要全天常驻，另行评估费用后再选付费档。

## 数据库当前状态

2026-10-29 已在现有 Supabase 项目执行：

- `20261029104338`：原四表普通角色最小权限修正，保留 authenticated CRUD。
- `20261029104541`：学习、健身七张新表，28 条所有者策略、65 个字段和 10 个业务触发器。
- `20261029124530`：补齐学习任务、学习记录的两个复合外键索引。

十一张私人表均启用 RLS，anon 无读取权限，authenticated 无 TRUNCATE/REFERENCES/TRIGGER。数据库角色模拟已验证任务、灵感、收藏、学习和健身操作、学习重排、计划删除后保留训练记录，以及跨身份拒绝访问；测试事务已回滚。此检查不代替浏览器真实登录或第二个真实账户验收。

原 Phase 1 是手工建立，远程此前没有迁移历史。工具本次记录的 Sprint A 版本与旧本地文件名不同；执行任何未来 CLI db push/历史修复前先核对远程迁移列表，勿重跑已有 Phase 1 或 Sprint A。

## 官方参考

- [Render Blueprint 字段与计算套餐](https://render.com/docs/blueprint-spec)
- [Render Free 的范围和限制](https://render.com/docs/free)
- [Render 官方支持入口](https://render.com/contact)
