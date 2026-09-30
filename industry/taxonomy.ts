// 这个行业的分类体系：类别、标签词表、机构与公司名录，以及防止张冠李戴的身份词典。
// 模型按这里的词表打标签，主题页（topics.json）按标签归类，筛选栏按类别分组。
// 换行业时：类别的 key 会出现在网址里（/all?category=…），上线后就不要再改；标签和名录可以随时增减。

/**
 * 网页上的类别（筛选栏、卡片角标、RSS 分类订阅）。key 是网址和接口里的身份，上线后不要改。
 * section 是日报里的分节标题（几个类别可以共用一节，按这里的顺序排）；guide 告诉模型怎么归类。
 * 没归上类的资料在日报里放进第一个 key 为 industry 的类别所在的节。
 */
export const CATEGORIES = [
  { key: "research", label: "前沿研究", section: "论文与证据", guide: "研究论文、预印本、临床试验结果、会议摘要、系统综述与荟萃分析、基础机制研究" },
  { key: "clinical", label: "临床与药物", section: "临床与药物", guide: "药物与器械的审批和适应证变化、指南与专家共识、临床实践与诊疗经验、病例与安全性信号" },
  { key: "industry", label: "产业与商业", section: "产业动态", guide: "药企与器械公司的经营、融资并购、授权合作、人事、财报与市场、供应链与产能" },
  { key: "policy", label: "政策与监管", section: "政策与监管", guide: "药监决定与监管行动、医保与支付政策、法规与合规、伦理审查、科研诚信与学术治理" },
  { key: "public-health", label: "公共卫生与社会", section: "公共卫生与社会", guide: "疫情与流行病、公共卫生事件与防控、医疗社会舆情、医患关系、职业环境与医学教育议题" },
  { key: "opinion", label: "观点与解读", section: "观点与解读", guide: "人物观点、评论、深度分析、访谈、行业趋势与争议讨论" },
  { key: "explainer", label: "科普与教育", section: "观点与解读", guide: "面向大众或医学生的医学解读、患者教育、疾病科普、学习方法与工具介绍" },
] as const;

/**
 * 内容理解一步给每篇资料判的“内容类型”（写在 prompts/content-understanding.md 里，改了类型要同步改那份提示词）。
 * 评分提示词（prompts/selection-score.md）按类型给五个维度不同的权重。
 */
export const ITEM_TYPES = [
  "trial_result", "guideline_update", "drug_approval", "industry_event",
  "policy_regulation", "clinical_insight", "opinion_analysis", "health_explainer",
] as const;

// ── 标签词表 ────────────────────────────────────────────────────────────────────────────

/** 每篇资料的第一个标签必须是这些“分类标签”之一。 */
export const CATEGORY_TAGS = [
  "前沿研究", "临床试验", "指南/共识", "药物/器械审批", "产业动态", "政策/监管", "公共卫生",
  "临床实践", "病例报告", "安全性信号", "科普/教育", "患者故事", "观点/评论", "行业舆情",
  "医学教育", "科研诚信", "其他",
] as const;

/**
 * 信源分区：预印本（未经同行评议）单独收，不与新闻混排。
 * sources.json 里预印本源打的就是这个 tag（Europe PMC 之外的 medRxiv / bioRxiv）。
 * 全部动态默认排除，底部只提示「另有 N 条」；单独成页 /preprints。
 */
export const SOURCE_SECTIONS = [
  { tag: "预印本", path: "/preprints", label: "预印本" },
] as const;

/** 可选的主题标签（疾病领域与学科方向）。 */
export const TOPIC_TAGS = [
  "肿瘤", "心血管", "神经与精神", "感染与疫苗", "代谢与内分泌", "免疫与炎症", "呼吸", "消化与肝病",
  "肾脏与泌尿", "血液", "儿科", "妇产与生殖", "骨科与运动", "眼科", "耳鼻喉", "皮肤", "影像与诊断",
  "检验与病理", "AI与数字医疗", "基因与细胞治疗", "器械与设备", "药物研发", "临床试验方法",
  "真实世界研究", "医保与支付", "循证医学", "医学教育",
] as const;

/** 可选的实体标签（机构、药企、器械公司）。 */
export const ENTITY_TAGS = [
  "FDA", "EMA", "NMPA", "WHO", "CDC", "NIH", "NEJM", "The Lancet", "JAMA", "Nature Medicine", "BMJ",
  "Pfizer", "Merck", "Roche", "Novartis", "Novo Nordisk", "Eli Lilly", "AstraZeneca", "Moderna",
  "Medtronic", "恒瑞医药", "百济神州", "药明康德", "联影医疗",
] as const;

/** 模型常写的近义词，统一成词表里的写法。 */
export const TAG_SYNONYMS: Readonly<Record<string, string>> = {
  研究: "前沿研究", 论文: "前沿研究", paper: "前沿研究", 基础研究: "前沿研究", 机制研究: "前沿研究",
  "论文/研究": "前沿研究", 试验: "临床试验", "临床试验结果": "临床试验", RCT: "临床试验",
  指南: "指南/共识", 共识: "指南/共识", "专家共识": "指南/共识", guideline: "指南/共识",
  审批: "药物/器械审批", 获批: "药物/器械审批", 上市批准: "药物/器械审批", 适应证: "药物/器械审批",
  产业: "产业动态", 公司动态: "产业动态", 融资: "产业动态", 并购: "产业动态", 收购: "产业动态",
  财报: "产业动态", 商业合作: "产业动态", 授权: "产业动态", 人事: "产业动态",
  政策: "政策/监管", 监管: "政策/监管", 法规: "政策/监管", 合规: "政策/监管", 伦理: "政策/监管",
  医保: "政策/监管", 集采: "政策/监管", 支付: "政策/监管",
  疫情: "公共卫生", 流行病: "公共卫生", 防控: "公共卫生", 疾控: "公共卫生",
  诊疗: "临床实践", 临床: "临床实践", 实践: "临床实践", 病例: "病例报告", case: "病例报告",
  不良反应: "安全性信号", 安全性: "安全性信号", 药物警戒: "安全性信号", 召回: "安全性信号",
  科普: "科普/教育", 患者教育: "科普/教育", 大众健康: "科普/教育", 健康教育: "科普/教育",
  患者经历: "患者故事", 患者自述: "患者故事",
  观点: "观点/评论", 评论: "观点/评论", 解读: "观点/评论", 深度分析: "观点/评论", 访谈: "观点/评论",
  舆情: "行业舆情", 社会争议: "行业舆情", 医患: "行业舆情",
  教育: "医学教育", 规培: "医学教育", 住培: "医学教育", 考研: "医学教育", 学术不端: "科研诚信",
  撤稿: "科研诚信", 重复发表: "科研诚信",
};

/** 模型漏了分类标签时，按内容类型补一个。 */
export const CATEGORY_BY_ITEM_TYPE: Readonly<Record<string, string>> = {
  trial_result: "前沿研究", guideline_update: "指南/共识", drug_approval: "药物/器械审批",
  industry_event: "产业动态", policy_regulation: "政策/监管", clinical_insight: "临床实践",
  opinion_analysis: "观点/评论", health_explainer: "科普/教育",
};

// ── 机构与公司（主体） ──────────────────────────────────────────────────────────────────

/** 主体主题：id → 显示名、卡片上显示的标签（null 表示只用 entity:<id> 归类）、别名。 */
export const ENTITIES: Record<string, { name: string; displayTag: string | null; aliases: string[] }> = {
  // 监管与公共卫生机构
  fda: { name: "FDA", displayTag: "FDA", aliases: ["FDA", "美国食品药品监督管理局", "Food and Drug Administration"] },
  ema: { name: "EMA", displayTag: "EMA", aliases: ["EMA", "European Medicines Agency", "欧洲药品管理局"] },
  nmpa: { name: "NMPA 国家药监局", displayTag: "NMPA", aliases: ["NMPA", "国家药监局", "国家药品监督管理局", "CDE", "药审中心"] },
  who: { name: "WHO", displayTag: "WHO", aliases: ["WHO", "世界卫生组织", "World Health Organization"] },
  cdc: { name: "CDC", displayTag: "CDC", aliases: ["CDC", "美国疾控中心", "中国疾控中心", "疾控中心"] },
  nih: { name: "NIH", displayTag: null, aliases: ["NIH", "美国国立卫生研究院", "National Institutes of Health"] },
  nci: { name: "NCI", displayTag: null, aliases: ["NCI", "美国国家癌症研究所"] },
  nice: { name: "NICE", displayTag: null, aliases: ["NICE", "英国国家卫生与临床优化研究所"] },
  // 顶级期刊（发在自家官网的稿子）
  nejm: { name: "NEJM", displayTag: null, aliases: ["NEJM", "New England Journal of Medicine", "新英格兰医学杂志"] },
  lancet: { name: "The Lancet", displayTag: "The Lancet", aliases: ["The Lancet", "Lancet", "柳叶刀"] },
  jama: { name: "JAMA", displayTag: "JAMA", aliases: ["JAMA", "美国医学会杂志"] },
  bmj: { name: "BMJ", displayTag: null, aliases: ["BMJ", "英国医学杂志"] },
  // 跨国药企
  pfizer: { name: "Pfizer", displayTag: null, aliases: ["Pfizer", "辉瑞"] },
  merck: { name: "Merck / MSD", displayTag: null, aliases: ["Merck", "MSD", "默沙东", "默克"] },
  roche: { name: "Roche", displayTag: null, aliases: ["Roche", "罗氏", "Genentech", "基因泰克"] },
  novartis: { name: "Novartis", displayTag: null, aliases: ["Novartis", "诺华"] },
  novo: { name: "Novo Nordisk", displayTag: null, aliases: ["Novo Nordisk", "诺和诺德", "Wegovy", "维戈维", "Ozempic", "诺和泰"] },
  lilly: { name: "Eli Lilly", displayTag: null, aliases: ["Eli Lilly", "Lilly", "礼来", "Mounjaro", "Zepbound", "替尔泊肽"] },
  astrazeneca: { name: "AstraZeneca", displayTag: null, aliases: ["AstraZeneca", "阿斯利康"] },
  sanofi: { name: "Sanofi", displayTag: null, aliases: ["Sanofi", "赛诺菲"] },
  gsk: { name: "GSK", displayTag: null, aliases: ["GSK", "葛兰素史克"] },
  bms: { name: "Bristol Myers Squibb", displayTag: null, aliases: ["Bristol Myers Squibb", "BMS", "百时美施贵宝"] },
  abbvie: { name: "AbbVie", displayTag: null, aliases: ["AbbVie", "艾伯维"] },
  amgen: { name: "Amgen", displayTag: null, aliases: ["Amgen", "安进"] },
  jnj: { name: "Johnson & Johnson", displayTag: null, aliases: ["Johnson & Johnson", "J&J", "强生", "Janssen", "杨森"] },
  bayer: { name: "Bayer", displayTag: null, aliases: ["Bayer", "拜耳"] },
  takeda: { name: "Takeda", displayTag: null, aliases: ["Takeda", "武田"] },
  moderna: { name: "Moderna", displayTag: null, aliases: ["Moderna", "莫德纳"] },
  biogen: { name: "Biogen", displayTag: null, aliases: ["Biogen", "渤健"] },
  // 器械与诊断
  medtronic: { name: "Medtronic", displayTag: null, aliases: ["Medtronic", "美敦力"] },
  ge: { name: "GE HealthCare", displayTag: null, aliases: ["GE HealthCare", "GE 医疗", "通用电气医疗"] },
  siemens: { name: "Siemens Healthineers", displayTag: null, aliases: ["Siemens Healthineers", "西门子医疗"] },
  philips: { name: "Philips", displayTag: null, aliases: ["Philips", "飞利浦"] },
  illumina: { name: "Illumina", displayTag: null, aliases: ["Illumina", "因美纳"] },
  // 中国药企与器械
  hengrui: { name: "恒瑞医药", displayTag: null, aliases: ["恒瑞", "恒瑞医药", "Hengrui"] },
  beigene: { name: "百济神州", displayTag: null, aliases: ["百济神州", "BeiGene"] },
  wuxi: { name: "药明康德", displayTag: null, aliases: ["药明康德", "WuXi", "药明生物"] },
  innovent: { name: "信达生物", displayTag: null, aliases: ["信达生物", "Innovent"] },
  cspc: { name: "石药集团", displayTag: null, aliases: ["石药", "石药集团", "CSPC"] },
  unitedimaging: { name: "联影医疗", displayTag: null, aliases: ["联影", "联影医疗", "United Imaging"] },
};

/**
 * 身份词典：摘要和标题里出现的机构或公司，必须在原文里也出现过，否则退回原标题、丢掉摘要（防止模型张冠李戴）。
 * 医学稿里最容易认错的是药名与公司（同一款药多家授权、仿制药与原研厂），所以这一层保留。
 */
export const IDENTITY_LEXICON: ReadonlyArray<{ id: string; name: string; patterns: RegExp[] }> = [
  { id: "fda", name: "FDA", patterns: [/\bFDA\b/, /美国食品药品监督管理局/] },
  { id: "ema", name: "EMA", patterns: [/\bEMA\b/, /欧洲药品管理局/] },
  { id: "nmpa", name: "NMPA", patterns: [/\bNMPA\b|国家药监局|CDE|药审中心/] },
  { id: "who", name: "WHO", patterns: [/\bWHO\b|世界卫生组织/] },
  { id: "cdc", name: "CDC", patterns: [/\bCDC\b|疾控中心/] },
  { id: "nih", name: "NIH", patterns: [/\bNIH\b|美国国立卫生研究院/] },
  { id: "pfizer", name: "Pfizer", patterns: [/pfizer|辉瑞/i] },
  { id: "merck", name: "Merck / MSD", patterns: [/merck|\bMSD\b|默沙东|默克/i] },
  { id: "roche", name: "Roche", patterns: [/roche|罗氏|genentech|基因泰克/i] },
  { id: "novartis", name: "Novartis", patterns: [/novartis|诺华/i] },
  { id: "novo", name: "Novo Nordisk", patterns: [/novo\s?nordisk|诺和诺德|semaglutide|司美格鲁肽|wegovy|ozempic|诺和泰/i] },
  { id: "lilly", name: "Eli Lilly", patterns: [/eli\s?lilly|礼来|tirzepatide|替尔泊肽|mounjaro|zepbound/i] },
  { id: "astrazeneca", name: "AstraZeneca", patterns: [/astra\s?zeneca|阿斯利康/i] },
  { id: "sanofi", name: "Sanofi", patterns: [/sanofi|赛诺菲/i] },
  { id: "gsk", name: "GSK", patterns: [/\bGSK\b|葛兰素史克/i] },
  { id: "bms", name: "Bristol Myers Squibb", patterns: [/bristol\s?myers|百时美施贵宝|\bBMS\b/i] },
  { id: "abbvie", name: "AbbVie", patterns: [/abbvie|艾伯维/i] },
  { id: "amgen", name: "Amgen", patterns: [/amgen|安进/i] },
  { id: "jnj", name: "Johnson & Johnson", patterns: [/johnson\s?&?\s?johnson|\bJ&J\b|强生|janssen|杨森/i] },
  { id: "bayer", name: "Bayer", patterns: [/bayer|拜耳/i] },
  { id: "takeda", name: "Takeda", patterns: [/takeda|武田/i] },
  { id: "moderna", name: "Moderna", patterns: [/moderna|莫德纳/i] },
  { id: "biogen", name: "Biogen", patterns: [/biogen|渤健/i] },
  { id: "medtronic", name: "Medtronic", patterns: [/medtronic|美敦力/i] },
  { id: "ge", name: "GE HealthCare", patterns: [/\bGE\s?HealthCare\b|GE 医疗/i] },
  { id: "siemens", name: "Siemens Healthineers", patterns: [/siemens|西门子/i] },
  { id: "philips", name: "Philips", patterns: [/philips|飞利浦/i] },
  { id: "illumina", name: "Illumina", patterns: [/illumina|因美纳/i] },
  { id: "hengrui", name: "恒瑞医药", patterns: [/恒瑞/i] },
  { id: "beigene", name: "百济神州", patterns: [/百济神州|beigene/i] },
  { id: "wuxi", name: "药明康德", patterns: [/药明/i] },
  { id: "innovent", name: "信达生物", patterns: [/信达生物|innovent/i] },
  { id: "cspc", name: "石药集团", patterns: [/石药|\bCSPC\b/i] },
  { id: "unitedimaging", name: "联影医疗", patterns: [/联影|united\s?imaging/i] },
];

/** 这些域名上的文章，发布方就是对应的机构或公司（期刊官网、机构官网）。 */
export const PUBLISHER_DOMAINS: ReadonlyArray<{ entityId: string; domains: readonly string[] }> = [
  { entityId: "fda", domains: ["fda.gov"] },
  { entityId: "ema", domains: ["ema.europa.eu"] },
  { entityId: "nmpa", domains: ["nmpa.gov.cn"] },
  { entityId: "who", domains: ["who.int"] },
  { entityId: "cdc", domains: ["cdc.gov"] },
  { entityId: "nih", domains: ["nih.gov"] },
  { entityId: "nci", domains: ["cancer.gov"] },
  { entityId: "nejm", domains: ["nejm.org"] },
  { entityId: "lancet", domains: ["thelancet.com"] },
  { entityId: "jama", domains: ["jamanetwork.com"] },
  { entityId: "bmj", domains: ["bmj.com"] },
  { entityId: "pfizer", domains: ["pfizer.com"] },
  { entityId: "merck", domains: ["merck.com", "msd.com"] },
  { entityId: "roche", domains: ["roche.com", "gene.com"] },
  { entityId: "novartis", domains: ["novartis.com"] },
  { entityId: "novo", domains: ["novonordisk.com"] },
  { entityId: "lilly", domains: ["lilly.com"] },
  { entityId: "astrazeneca", domains: ["astrazeneca.com"] },
  { entityId: "moderna", domains: ["modernatx.com"] },
  { entityId: "medtronic", domains: ["medtronic.com"] },
];

/** 原文里的这些写法也算提到了对应机构。 */
export const IDENTITY_CONTEXT_ALIASES: ReadonlyArray<{ entityId: string; pattern: RegExp }> = [
  { entityId: "nmpa", pattern: /(国家药品监督管理局|国家药监局)/ },
  { entityId: "cdc", pattern: /(中国疾病预防控制中心|中国疾控中心)/ },
  { entityId: "who", pattern: /(WHO\s*[（(]?世界卫生组织|世界卫生组织\s*[（(]?WHO)/ },
];
