# NORA SPACE 产品路线图

Phase 1 优先完成私人身份、真实数据保存和可扩展导航。以下优先级供下一阶段规划；**即将开放**的模块当前没有伪造统计或演示数据。

## Phase 1.5 状态（2026-10-26）

首页已使用紧凑 Spotify 播放卡片，Workspace / Personal / System 导航与卡片视觉已统一；2026-10-26 将全站视觉更新为蓝白浅灰与深蓝灰双模式，并完成代表性页面的四档视口检查。任务、灵感、收藏、日历和设置仍沿用 Phase 1 数据模型与操作流程。代码级安全检查、本地生产构建及匿名权限回归已完成；远程复核公开注册已关闭。本地 Git 已初始化，远程建仓和部署待用户确认。真实账户 CRUD、跨账户 RLS 隔离、私有 GitHub 仓库和 Vercel 实际部署仍需按 [上线指南](PRODUCTION_DEPLOYMENT.md) 完成。该阶段不新增数据库表，也不开发 Lark 聊天或 AI 功能。

| 模块 | 当前状态 | 下一步优先级 | 所需数据 / 第三方服务 |
| --- | --- | --- | --- |
| Dashboard | Phase 1 已实现 | 高 | 读取 tasks、ideas、bookmarks、user_preferences |
| AI Content Lab | 即将开放 | 高 | 内容项目/脚本表；选定 AI 模型 API，视频数据来源与授权 |
| Idea Studio | 基础 CRUD 已实现；AI 润色/导出未做 | 高 | ideas；AI 模型 API，Word 导出工具 |
| Lark Assistant | 即将开放 | 中 | 群消息摘要表；飞书应用授权、消息权限与审计 |
| Content Analytics | 即将开放 | 中 | 平台内容和指标表；抖音/小红书官方授权或合规导入 |
| Learning Tracker | 即将开放 | 高 | 学习计划、学习记录、复习提醒表；可先不接外部服务 |
| Resource Library | 网站收藏基础版已实现 | 中 | bookmarks；未来可选截图服务或对象存储 |
| Fitness Tracker | 即将开放 | 低 | 训练计划、训练记录、动作库表 |
| Smart Calendar | 基础月历已实现 | 中 | tasks.due_at；未来可增加日程/重复规则表和外部日历授权 |
| Quick Capture | Phase 1 已实现 | 中 | tasks、ideas、bookmarks；未来可扩展快捷键/移动分享入口 |
| AI Weekly Review | 即将开放 | 中 | 周报快照/生成记录表；AI 模型 API，读取已授权的站内数据 |
| Spotify Music | 官方歌单 Embed 已实现 | 低 | user_preferences.spotify_playlist_url；未来 Daily Song 需 Spotify OAuth 与相关权限 |

建议先完成真实环境验收、备份与错误监控，再开发新模块。每次新增私人数据表都应设置 RLS 和所有者策略。
