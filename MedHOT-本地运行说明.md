# MedHOT — 医学版行业热点站（每日医讯 2.0）

用 [AIHOT](https://github.com/KKKKhazix/AIHOT)（MIT）的开源框架改成医学行业的版本：
自动盯住全球医学信源 → 机械判重 → 模型预筛 → **同一份标准独立打两次分** → 过门槛进精选 → 写中文标题/摘要/推荐理由/标签 → **把同一件事的多篇报道归成一个事件** → 按独立来源算热度 → 每天早上 08:00 出日报。

## 在哪

| 位置 | 内容 |
|---|---|
| `/Users/Jin/Documents/GitProgram/AIHOT` | 原项目快照（未改动，留着对照） |
| `/Users/Jin/Documents/GitProgram/MedHOT` | 医学版（本项目） |

## 启停

```bash
cd /Users/Jin/Documents/GitProgram/MedHOT
./medhot.sh start      # 启动 postgres + api + worker + web
./medhot.sh status     # 看进程 / 已入库 / 精选条数
./medhot.sh logs worker 80   # 看某个进程日志
./medhot.sh stop       # 停三个进程（postgres 保持运行）
```

- 网站：<http://localhost:3000>　后台：<http://localhost:3000/admin>
- 后台密码在 `.env` 的 `ADMIN_PASSWORD`（`.env` 不进 Git）
- 端口：**3000** 网站 · **3001** API · **5433** PostgreSQL

## 运行环境（本机已装好）

- **PostgreSQL 16.2**：`/Users/Jin/pgsql/16/bin`（数据目录 `MedHOT/.pgdata`，只监听 127.0.0.1:5433）
  本机没有 Homebrew/Docker，这套 16.2 是从 `pgserver` 的预编译包里拆出来的（二进制要求 `.dylibs` 在 `bin` 的上两级，所以路径必须是 `/Users/Jin/pgsql/16` + `/Users/Jin/pgsql/.dylibs`，**不能带空格**）。
- **Node 26.8.1**：`/Users/Jin/.hermes/node/bin/node`
- **模型**：DeepSeek `deepseek-flash`（`.env` 的 `LLM_*`，key 取自 `~/.hermes/.env`）

为了让这套预编译 PostgreSQL 跑起来，做了两处**本地补丁**（换到 Docker 官方镜像后都不需要）：

1. `pg_trgm` 扩展缺失 → 用 PostgreSQL 16.2 源码 + 这套 PG 的 PGXS 现场编译安装（`PG_SYSROOT` 要指向本机 SDK，因为原包编译时的 Xcode SDK 路径已不存在）。
2. `database/migrations/0034_lz4_toast.sql` → 该 PG 未编译 lz4，迁移里加了对 `pglz` 的降级（功能不受影响，只是全文相关搜索慢一点）。

## 相对 AIHOT 示例改了什么

| 文件 | 改动 |
|---|---|
| `industry/site.ts` | 站名 **MedHOT**、行业词「医学」（页面上就是「医学日报」「全部医学动态」）、关于页文案、版权与下架说明 |
| `industry/taxonomy.ts` | 7 个类别：前沿研究 / 临床与药物 / 产业与商业 / 政策与监管 / 公共卫生与社会 / 观点与解读 / 科普与教育；8 种内容类型：试验结果 / 指南更新 / 审批决定 / 产业事件 / 政策法规 / 临床实践 / 观点 / 科普；标签白名单（27 个疾病与学科方向）、主体名录（FDA、EMA、NMPA、WHO、CDC、NEJM、柳叶刀、辉瑞、默沙东、诺和诺德、礼来、恒瑞、百济神州……共 33 家）、身份词典（防模型张冠李戴：同一款药不同授权方、仿制与原研） |
| `industry/topics.json` | 37 个主题页：机构与公司 14 个、疾病与方向 11 个、内容形态 12 个 |
| `industry/sources.json` | 30 个信源（见下），配好分级、抓取间隔、首次回补条数 |
| `industry/prompts/prefilter.md` | 医学相关性预筛：宽召回，只拦明显无关（保健品营销、考试培训广告等直接 BLOCK） |
| `industry/prompts/selection-score.md` | **核心**：五轴（实质份量/信息增量/**证据强度**/共振面/可用性）× 8 种内容类型的权重表 + 医学版「必须正常评价」与「必须压住的噪声」 |
| `industry/prompts/content-understanding.md` | 8 类内容类型、医学标签白名单、推荐理由禁用词（神药/攻克/奇迹……） |
| `industry/prompts/rules-domain.md` | 医学翻译规则：靶点与统计缩写保留英文；incidence 发病率 ≠ prevalence 患病率；**不允许 HR 0.72 → 「风险降低 28%」这类换算**；证据等级词不得升级（preprint 就是预印本） |
| `industry/prompts/rules-self-contained-title.md` | 标题动作词是硬边界：递交申请 ≠ 获批，trend toward improvement ≠ 有效，in mice ≠ 在患者中 |
| `industry/prompts/story-digest.md` | 事件综述要写清证据等级的变化链条、必须写安全性 |
| `industry/selection.ts` | 门槛沿用 AIHOT 默认（T1 60 / T1_5 65 / T2 76）——**这是医学版最需要你来校准的地方** |
| `industry/features.ts` | 模型榜、Codex 重置监控关闭（只对 AI 行业有意义） |
| 顺手修的两处 | 日报指标「个新模型」→「篇新研究」；v1 公开 API 里 AI 版遗留的 `tip` 类别残留 |

### 医学版的判据（写进评分提示词的部分）

**正常评价**：改变临床决策的试验结果（阴性结论同样有价值）、指南/共识推荐等级变化、监管决定（获批/驳回/撤回/黑框警告/优先审评）、公共卫生与医保政策变化、改变机制理解或打开新模态的关键证据、有规模和成本的真实世界研究、对医学生与科研人员可复用的方法与工具。

**压住**：药企新闻稿与卫星会推广（`sig ≤ 3`）、会议通知/征稿/招生/招聘/促销（`sig ≤ 2`）、泛健康养生与无出处的「某研究称」（`sig ≤ 3` 且 `cred ≤ 3`）、只有细胞或动物实验却给患者结论（`sig ≤ 3`）、只有会议摘要没有完整数据（`nov ≤ 3`）、多话题盘点（`sig ≤ 3`）、预印本（`cred ≤ 5` 且摘要必须点明未经同行评议）、无临床终点的器械装机与展会新闻。

## 页面

- 精选 `/` · 全部医学动态 `/all` · 热点榜 `/hot` · 医学日报 `/daily` · 主题 `/topics` · **预印本 `/preprints`** · 收藏 `/starred` · Agent 接入 `/agent` · 关于 `/about`
- **预印本单独成区**：medRxiv / bioRxiv 不进「全部动态」的混排，全部动态底部只显示「另有 N 条预印本更新 →」；预印本自己的页面在 `/preprints`（导航「更多」里也有入口），页面明确标注未经同行评议、不进精选/热点榜/日报。

## 信源（59 个，均已实测可抓）

- **期刊**（T1，官网一手）：Nature、Nature Medicine、Nature Biotechnology、Nature Reviews Cancer、NEJM、NEJM Evidence、The Lancet、The Lancet Oncology、The Lancet Infectious Diseases、JAMA、Cell、Science
- **期刊论文（Europe PMC，带 DOI）**（T1，共 29 个源）：走 Europe PMC 官方接口 `ISSN:<刊号> AND SRC:MED AND HAS_ABSTRACT:Y`，按**最早发表日期倒序**取最新论文，只收有摘要的（所以不会混进来信、勘误这类没摘要的条目）。每条都是 **DOI 链接**（`https://doi.org/10.xxxx`）+ 摘要正文，不需要再抓出版社页面：
  The BMJ、Annals of Internal Medicine、JAMA Internal Medicine、JAMA Oncology、JAMA Cardiology、PLOS Medicine、Circulation、European Heart Journal、JACC、Gut、Gastroenterology、Journal of Clinical Oncology、Blood、Diabetes Care、The Lancet Diabetes & Endocrinology、The Lancet Neurology、Clinical Infectious Diseases、Intensive Care Medicine、Radiology、Pediatrics、Brain、European Urology、Cancer Cell、Cell Research、Signal Transduction and Targeted Therapy、Chinese Medical Journal、Journal of Hepatology、The Lancet Global Health、Nature Reviews Clinical Oncology
  > 想加刊：在后台「信源 → 新建」选 `json_list`，照抄任意一个 `epmc-*` 源的配置，把 URL 里的 ISSN 换成目标刊的刊号即可（刊号在 PubMed 的期刊页能查到）。注意同一篇论文如果既有出版社 RSS 又有 Europe PMC 两个源，会以两个来源进来，最终在**事件层**合并成同一件事。
- **预印本**（T1_5）：medRxiv、bioRxiv
- **监管与公共卫生**（T1，官方一手）：FDA 新闻稿、CDC 新闻、WHO 新闻
- **行业媒体**（T2）：STAT News、Endpoints News、BioPharma Dive、Healthcare Dive、MedCity News、Health Affairs
- **临床媒体**（T2）：MedPage Today、Medscape
- **大众健康**（T2）：BBC Health、NPR Health、NYT Health、Guardian Health、ScienceDaily 健康医学

**中文信源怎么办**：国内医学媒体基本只发公众号，实测医脉通／健康界／生物谷／梅斯／澎湃健康都没有可用 RSS。两条路：
1. 后台新建 `mp_account` 信源（需要「极致了」Dajiala 的 key，按次计费，有预算熔断）；
2. 用 `external` 推送接口，把已有的「每日医讯」抓取脚本结果 POST 进来（配 `INGEST_TOKEN`）——**B站/小红书/抖音/视频号那部分内容走这条路最合适**。

## 花钱

- 每条新资料：预筛 1 次 + 评分 2 次 + 写作与结构化 1–2 次；首次导入 30 个源（每源回补 4–6 条）约 150 条 ≈ 900 次调用（官方文档量的量级），DeepSeek flash 很便宜。
- 后台「设置 → 预算」能设每分钟/小时/天的调用上限，超了自动暂停。
- 回补条数在后台「信源」里调（`initialBackfillLimit`）。

## 接下来该做的两件事

1. **校准门槛**（决定「选得准不准」）：挑 100–200 条稿件人工标「该选/不该选」，格式见 `industry/gold.example.jsonl`，然后
   ```bash
   node --env-file=.env scripts/eval-selection.ts --gold .data/gold.jsonl --label "第一版医学标准"
   ```
   看准确率与不同门槛下的表现，再回改 `selection-score.md`（先改标准，再动门槛）。
2. **中文信源接入**（见上）。另可配 `EMBEDDING_*`（或 `DASHSCOPE_API_KEY`）让事件归组多一路向量召回——不配也能跑，只是归组少一路线索。

## 自测（改过行业包后跑一遍）

```bash
# 测试要用一个干净的库；反复用同一个库跑会因为上一轮留下的日报数据而误报失败
PGBIN=/Users/Jin/pgsql/16/bin
$PGBIN/dropdb -h 127.0.0.1 -p 5433 -U postgres medhot_test; $PGBIN/createdb -h 127.0.0.1 -p 5433 -U postgres medhot_test
DATABASE_URL="postgres://postgres@127.0.0.1:5433/medhot_test" node scripts/migrate.ts
DATABASE_URL="postgres://postgres@127.0.0.1:5433/medhot_test" npm test    # 136 项，约 4 分钟
npm run typecheck
```

## 已知限制

- 事件归组目前只有词面/规则线索（没配向量模型），同一件事的跨语言报道可能归不到一起。
- 网页是开发模式跑的（`react-router dev`）；要长期当服务用，可以改成 `npm run build -w @aihot/web` + `node apps/web/server.ts`。
- 首次导入的条目按 AIHOT 的规则「发布超过 48 小时的按原文时间归档、不进今天」，所以首页只显示最近两天精选。
