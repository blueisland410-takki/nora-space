# NORA SPACE 当前上线状态

更新：2026-10-29。当前可确认的是代码与数据库检查完成；尚未取得正式网站地址，不能标为正式上线成功。

## 已完成

- 现有 Supabase 项目健康，已有一个确认完成的账户，公开注册关闭。
- 学习/健身七张表已创建：65 个字段、28 条 owner 策略和 10 个业务触发器。
- 全部十一张私人表均启用 RLS；anon 无读取权限；authenticated 仅保留 CRUD，移除 TRUNCATE、REFERENCES 和 TRIGGER 等额外权限。
- 补齐两个复合外键索引；性能顾问已不再报告缺少外键索引。新索引尚未被正式流量使用的 INFO 提醒属于初期状态。
- 数据库回滚测试通过：任务完成、灵感/收藏编辑、学习日程生成和重排、训练记录、计划删除后保留训练历史、跨身份读取/更新/删除被拒绝、禁止改换 owner。测试数据未持久保存。
- 真实 REST 匿名请求对十一张表均返回 401/42501。此结果不代替真实登录或第二个真实账户测试。
- 现有 lint、Next 类型生成、typecheck、四项单元测试、生产 build、十四条匿名路由 smoke 均通过。
- npm 生产依赖审计未报告已知漏洞。本轮未更改应用依赖。
- Render 配置从本地未提交的付费草案改为明确 Free；使用 Node 24.x、显式监听 0.0.0.0/$PORT、/login 健康检查和 CI 通过后自动部署。

## 当前仍需完成

1. 连接 Computer Use/Chrome 或 Render 集成，核对已登录 Render Workspace 中 Free 实例仍要求 Add Card 的具体提示。旧本地付费 YAML 尚未推送，不能据它解释用户手动创建 Free 服务时的全部行为。
2. 创建或复用实际 Free Web Service，配置两个现有公共 Supabase 变量，记录真实 HTTPS 地址。当前没有验证过的部署地址。
3. 根据真实域名配置 Supabase Auth Site URL；使用自己的账户验证登录、刷新、CRUD、退出和手机显示。密码只在官方页面或自己的站点输入。
4. 核实本机 Node 网络差异：Node 直接请求 Supabase 返回 ECONNRESET，Windows HTTP 同样请求成功，使用系统证书和 IPv4 顺序也未解决。不要通过关闭 TLS 校验处理；Render 节点联通性需部署后实测。
5. Supabase 安全顾问仍提醒泄露密码保护未开启。通过 Dashboard 核对现有套餐能否启用；没有自动升级或启用付费资源。
6. 数据恢复备份及恢复演练未取得证据。本轮保存的是结构/权限快照，不是完整数据备份。

## 数据库执行记录

| 远程版本 | 内容 | 本地来源 |
| --- | --- | --- |
| 20261029104338 | 原四表最小权限 | 同版本 SQL；原 proposals 文件保留作历史参考 |
| 20261029104541 | 学习/健身七表 | 202610260001_sprint_a.sql，工具应用时省略外围事务并增加对象冲突检查 |
| 20261029124530 | 复合外键索引 | 同版本 SQL |

Phase 1 原来手工建表，远程此前没有迁移历史。旧本地 Phase 1/Sprint A 版本与工具实际登记版本未完全对齐。本轮未修改历史标记；后续运行 CLI db push、migration repair 或恢复前需先按实际结构与上表审查，不得重复创建已有表。

## 功能范围

当前已有功能为任务、灵感、收藏、设置、日历、学习、健身及 Spotify Embed。AI 内容实验室、内容分析、Lark 助手和智能周报仍是路线图里的后续模块，不能计为已实现。本轮没有创建 AI 付费服务或第三方账号授权。

## 官方依据

- [Render Blueprint 计划与字段](https://render.com/docs/blueprint-spec)
- [Render Free 限制](https://render.com/docs/free)
- [Computer Use 连接设置](https://learn.chatgpt.com/docs/computer-use)
- [Supabase 密码保护](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)
