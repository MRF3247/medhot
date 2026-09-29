// 精选的门槛。评分标准本身写在 prompts/selection-score.md；这里只决定“多少分算入选”。
// 每篇资料由评分模型独立打两次分（0–100），两次之和 ≥ 2 × 门槛才进精选，卡片上显示两次的平均分。
// 门槛按信源分级区分：官方一手信源的门槛低一些，媒体和个人的高一些。改了门槛或评分提示词，
// 用 scripts/eval-selection.ts 在你自己标注的样本上重跑一遍，再决定上线（见 docs/selection.md）。
//
// ⚠️ 下面这组数是 AIHOT 在 AI 领域校准出来的，**不是**医学领域校准的结果，现在只当起点用。
// 医学信源里药企软文、会议通知、课程推广很多，媒体端的泛健康新闻也很多；
// 真正该校准的是“这条值不值得一个医生/医学生花两分钟读”。
// 校准办法：从现有稿件里挑 100–200 条人工标“该选/不该选”（格式见 industry/gold.example.jsonl），
// 跑 node --env-file=.env scripts/eval-selection.ts --gold .data/gold.jsonl 看准确率，再回来调。

export const SELECTION = {
  /**
   * 信源分级 → 入选门槛（平均分）。分级在后台“信源”里给每个源设置：
   *   T1 官方一手（期刊官网、FDA/WHO/CDC 这类机构） · T1_5 预印本平台、准官方账号 · T2 媒体与个人
   * 分级 EXCLUDE_MP 以及这里没有列出的分级，不参与精选评分（只进“全部动态”）。
   */
  thresholds: { T1: 60, T1_5: 65, T2: 76 } as Record<string, number>,
  /**
   * 没入选、但平均分高于这个数的资料，也用精选的写法（内容理解：标题、摘要、推荐理由、标签）来写，
   * 其余用更便宜的“标题摘要翻译”。
   */
  understandFloor: 50,
} as const;
