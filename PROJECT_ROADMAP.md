# NORA SPACE 产品路线图

Phase 1 优先完成私人身份、真实数据保存和可扩展导航。Sprint A 已开发学习与健身功能，但远程迁移和真实账户验收尚未完成；未开发模块没有伪造统计或演示数据。

## Phase 1.5 状态（2026-10-26）

首页已使用紧凑 Spotify 播放卡片，Workspace / Personal / System 导航与卡片视觉已统一；2026-10-26 将全站视觉更新为蓝白浅灰与深蓝灰双模式，并完成代表性页面的四档视口检查。任务、灵感、收藏、日历和设置仍沿用 Phase 1 数据模型与操作流程。代码级安全检查、本地生产构建及匿名权限回归已完成；远程复核公开注册已关闭。本地 Git 已初始化，远程建仓和部署待用户确认。真实账户 CRUD、跨账户 RLS 隔离、私有 GitHub 仓库和 Vercel 实际部署仍需按 [上线指南](PRODUCTION_DEPLOYMENT.md) 完成。该阶段不新增数据库表，也不开发 Lark 聊天或 AI 功能。

| 模块 | 当前状态 | 下一步优先级 | 所需数据 / 第三方服务 |
| --- | --- | --- | --- |
| Dashboard | Phase 1 已实现 | 高 | 读取 tasks、ideas、bookmarks、user_preferences |
| AI Content Lab | 即将开放 | 高 | 内容项目/脚本表；选定 AI 模型 API，视频数据来源与授权 |
| Idea Studio | 基础 CRUD 已实现；AI 润色/导出未做 | 高 | ideas；AI 模型 API，Word 导出工具 |
| Lark Assistant | 即将开放 | 中 | 群消息摘要表；飞书应用授权、消息权限与审计 |
| Content Analytics | 即将开放 | 中 | 平台内容和指标表；抖音/小红书官方授权或合规导入 |
| Learning Tracker | Sprint A 本地代码完成；远程迁移与真实数据待验收 | 高 | learning_goals、learning_tasks、study_sessions |
| Resource Library | 网站收藏基础版已实现 | 中 | bookmarks；未来可选截图服务或对象存储 |
| Fitness Tracker | Sprint A 本地代码完成；远程迁移与真实数据待验收 | 高 | fitness_settings、fitness_plans、workout_sessions、fitness_video_bookmarks |
| Smart Calendar | 已接入任务、学习任务和训练计划；新表待迁移 | 中 | tasks.due_at 与 Sprint A 表；未来可增加日程/重复规则表 |
| Quick Capture | Phase 1 已实现 | 中 | tasks、ideas、bookmarks；未来可扩展快捷键/移动分享入口 |
| AI Weekly Review | 即将开放 | 中 | 周报快照/生成记录表；AI 模型 API，读取已授权的站内数据 |
| Spotify Music | 官方歌单 Embed 已实现 | 低 | user_preferences.spotify_playlist_url；未来 Daily Song 需 Spotify OAuth 与相关权限 |

建议先完成真实环境验收、备份与错误监控，再开发新模块。每次新增私人数据表都应设置 RLS 和所有者策略。

## Phase 2 顺序

Sprint A：学习与健身，当前本地代码已实现，远程迁移、真实 CRUD 和跨账户隔离待验收。Sprint B：AI 内容创作与灵感升级；Sprint C：内容数据和每周复盘；Sprint D：Lark 工作流、快速收集和资源库整合。后三项尚未开始。具体状态见 [Phase 2 清单](PHASE2_CHECKLIST.md)。

## Sprint B / C / D 依赖与迁移顺序（规划，尚未实现）

2026-10-26 已整理依赖；当前 Sprint A 七张表 API 返回 404/PGRST205，真实结构与迁移历史待只读核对。下列数据表名称为候选设计，不是现有 schema，不代表已创建迁移文件。

| Sprint | 开发依赖 | 建议的数据对象顺序 | 服务与验收门槛 |
| --- | --- | --- | --- |
| B：AI Content Lab + Idea Studio AI | Phase 1 登录、ideas 与设置；Sprint A 云端验收结束；确定内容项目/脚本/版本关系 | 先 content_projects，再引用它的 content_scripts；idea_versions 引用既有 ideas；需要的新字段使用兼容性增量迁移 | 先可人工编辑/保存；AI 供应商、模型、预算由用户确定；Key 只在服务端。未配置时提示未启用，不能生成伪造结果。参考内容先接受用户提供文本/链接，不假装已读取视频 |
| C：Content Analytics + Weekly Review | B 内容 ID 与状态稳定；Phase 1+A 的任务/学习/训练数据；明确统计时区、周起点、指标口径 | social_accounts → content_posts → post_metrics；再 weekly_reviews（可保存站内周汇总快照及来源时间范围） | 先支持手工录入/导入及可复算统计；平台自动同步需另获授权；AI 总结依赖 B 的服务端调用能力，未配置时只显示真实统计 |
| D：Lark Assistant + 工作流整合 | Phase 1 任务/灵感/收藏；A 日历；B AI 封装；C 汇总口径 | 先聊天导入批次/消息，再摘要与来源关系，最后确认后的任务/日历关联与去重记录；名称在设计评审时确定 | 可先手动粘贴或上传；直接接入 Lark 需应用、权限、回调和凭据。提取内容须由用户确认后才写入任务，重复导入不能重复创建 |

推荐迁移链：**Phase 1 结构与历史核对 → Sprint A 核对/必要时迁移/真实验收 → B 内容与版本 → C 指标与周报 → D 导入及工作流关联**。

- 每个 Sprint 单独审查新迁移；父表先于子表、所有 owner_id 关联与外键保持一致，RLS/授权/索引随新私人表一起交付，再发布依赖这些表的代码。
- 新增字段优先允许旧代码继续工作；确需历史数据转换时另写可审查步骤，先备份、确认后执行。不重写已经应用的迁移，也不通过 reset 对齐历史。
- A 验收结束前不执行正式数据库的 B 迁移；本轮只整理规划，没有创建 B/C/D SQL。
- AI 未配置只阻塞 AI 功能，不妨碍人工草稿/统计的设计；不得擅自启用付费 API、数据库分支或第三方同步资源。
- GitHub 仓库与 Actions 有助于后续交付；2026-10-27 用户已接受 Public，当前目标仓库只有初始 README，源码同步见 [指南](GITHUB_SYNC_GUIDE.md)。Vercel 账号审核本轮暂不处理，不作为本地规划的前置条件。

进入 B 的当前阻塞：A 远程 schema/历史及默认授权未核对、备份恢复能力待确认、必要迁移未获执行确认、普通账户 CRUD 与双账户 RLS 缺少实测证据。详见 [云端验收记录](SPRINT_A_CLOUD_ACCEPTANCE.md)。
