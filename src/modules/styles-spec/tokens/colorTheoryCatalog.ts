/** 色彩规则页引用的专业术语与提出者（可检索、可溯源） */
export interface ColorTheoryRef {
  id: string
  /** 专业术语 — 主展示名，宜可直接检索 */
  term: string
  /** 英文术语 */
  termEn: string
  /** 提出者 / 制定机构（权威署名） */
  proponent: string
  /** 提出者英文或机构英文 */
  proponentEn?: string
  /** 年代 / 标准版本（可选） */
  era?: string
  /** 一句话定义 */
  summary: string
  /** 在本系统中的用法 */
  application: string
  /** 关联检测规则 id */
  ruleIds: string[]
}

export const COLOR_THEORY_CATALOG: ColorTheoryRef[] = [
  {
    id: 'cielab',
    term: 'CIE L*a*b* 均匀色彩空间',
    termEn: 'CIELAB uniform color space',
    proponent: '国际照明委员会 CIE',
    proponentEn: 'Commission Internationale de l\'Éclairage (CIE)',
    era: '1976',
    summary:
      '以 L*（明度）、a*、b*（色度）表征颜色；ΔE* 与人眼察觉更一致，优于 RGB 欧氏距离。',
    application: 'HEX → L*、C*、h；作为 ΔLp 与视错觉判定的几何基础（标准光源 D65）。',
    ruleIds: [
      'visual-separation',
      'illusion-hue-without-lightness',
      'illusion-complementary-vibration',
    ],
  },
  {
    id: 'helmholtz-kohlrausch',
    term: 'Helmholtz–Kohlrausch 效应',
    termEn: 'Helmholtz–Kohlrausch effect',
    proponent: 'Hermann von Helmholtz；Ludwig Kohlrausch',
    proponentEn: 'Helmholtz; Kohlrausch',
    era: '19 世纪',
    summary:
      '等光度下，高饱和有彩色比无彩色看起来更亮；黄系偏亮、蓝系偏沉（色度亮度）。',
    application: '感知亮度 Lp 对 h≈90° 加亮、h≈270° 减沉；视觉重量 W 之色相项。',
    ruleIds: ['visual-separation', 'illusion-heavy-bg-black-text', 'illusion-yellow-white'],
  },
  {
    id: 'itten-contrast',
    term: 'Itten 明度对比',
    termEn: 'Itten value contrast',
    proponent: 'Johannes Itten（约翰内斯·伊顿）',
    proponentEn: 'Johannes Itten',
    era: '1961《The Art of Color》',
    summary:
      '七大色彩对比之一：以 value（明度/明暗）建立形与底的关系；色轮上黄为最亮极。',
    application: '浅彩底深字、深彩底浅字；亮黄底禁用白字（黄为视觉最亮极）。',
    ruleIds: ['usage-deep-needs-light', 'usage-light-needs-dark', 'illusion-yellow-white'],
  },
  {
    id: 'chevreul-contrast',
    term: '同时对比',
    termEn: 'Simultaneous contrast',
    proponent: 'Michel Eugène Chevreul（米歇尔·欧仁·谢弗勒尔）',
    proponentEn: 'Michel Eugène Chevreul',
    era: '1839《De la loi du contraste simultané des couleurs》',
    summary: '相邻色域互相诱导：边界处明暗/色相被推拉，可夸大或伪造对比感。',
    application: '仅有色相差而 L* 接近；近似互补且 L* 接近 → 颤动或假对比。',
    ruleIds: ['illusion-hue-without-lightness', 'illusion-complementary-vibration'],
  },
  {
    id: 'munsell-value',
    term: 'Munsell 明度 Value',
    termEn: 'Munsell value (V)',
    proponent: 'Albert H. Munsell（阿尔伯特·蒙赛尔）',
    proponentEn: 'Albert Henry Munsell',
    era: 'Munsell Color System（1905 起）',
    summary: '独立维度 V 表明暗阶梯；与 H（Hue）、C（Chroma）构成三维色貌模型。',
    application: '同体系深浅配对；perceptualWeight 中 HSL 明度与饱和权重。',
    ruleIds: ['usage-deep-needs-light', 'usage-light-needs-dark', 'illusion-heavy-bg-black-text'],
  },
  {
    id: 'gestalt-weight',
    term: '格式塔视觉重量',
    termEn: 'Gestalt visual weight',
    proponent: 'Max Wertheimer；Rudolf Arnheim',
    proponentEn: 'Wertheimer; Arnheim',
    era: '《Art and Visual Perception》（1954）',
    summary: '即使物理明度相近，不同色相/面积/饱和亦产生轻重与锚定差异（固有色倾向）。',
    application: '功能色阶与中性色条：W 综合 L*、C*、色相决定深/浅字策略。',
    ruleIds: ['usage-deep-needs-light', 'usage-light-needs-dark', 'illusion-heavy-bg-black-text'],
  },
  {
    id: 'mach-bands',
    term: 'Mach 带',
    termEn: 'Mach bands',
    proponent: 'Ernst Mach（恩斯特·马赫）',
    proponentEn: 'Ernst Mach',
    era: '1865',
    summary: '侧抑制导致边界处出现假亮/假暗带；饱和底上的小字号暗笔画的混边与此同类。',
    application: '高 C* 深底 + 近黑字 → 边缘与底色混叠，对比感低于数值预测。',
    ruleIds: ['illusion-heavy-bg-black-text'],
  },
  {
    id: 'flow-semantic-roles',
    term: '语义色彩角色',
    termEn: 'Semantic color roles',
    proponent: 'Flow 设计系统',
    proponentEn: 'Flow Design System',
    summary: '组件层 token 分工：浅底深字、深底浅字、白底深彩块等，属产品语义而非物理定律。',
    application: '色阶 step 与 mainStep、策略标签（浅彩底黑字 / 深彩底白字）。',
    ruleIds: ['usage-deep-needs-light', 'usage-light-needs-dark'],
  },
  {
    id: 'wcag-relative-luminance',
    term: 'WCAG 相对亮度对比度',
    termEn: 'WCAG relative luminance contrast',
    proponent: 'W3C Web Accessibility Initiative（WAI）',
    proponentEn: 'W3C WAI',
    era: 'WCAG 2.x',
    summary: 'sRGB 线性化后的 (L_light+0.05)/(L_dark+0.05)；国际无障碍标准，不计色相感知差。',
    application: '检测结果 info 级「参考」；不参与本系统 pass/fail。',
    ruleIds: ['reference-wcag'],
  },
]

/** 检测规则 id → 中文规则名（卡片脚注用） */
export const COLOR_RULE_LABELS: Record<string, string> = {
  'visual-separation': '感知明度差 ΔLp',
  'usage-deep-needs-light': '深彩底应浅字',
  'usage-light-needs-dark': '浅彩底应深字',
  'illusion-heavy-bg-black-text': '重色饱和底 + 黑字',
  'illusion-yellow-white': '亮黄底 + 白字',
  'illusion-hue-without-lightness': '仅有色相差',
  'illusion-complementary-vibration': '互补色振动',
  'reference-wcag': 'WCAG 参考对照',
}

export function theoriesForRule(ruleId: string): ColorTheoryRef[] {
  return COLOR_THEORY_CATALOG.filter((t) => t.ruleIds.includes(ruleId))
}

export function theoryById(id: string): ColorTheoryRef | undefined {
  return COLOR_THEORY_CATALOG.find((t) => t.id === id)
}

/** 专业术语标签（用于表格 / 角标） */
export function ruleTheoryLabels(ruleId: string): string[] {
  return theoriesForRule(ruleId).map((t) => t.term)
}

/** 术语 + 提出者（用于检测结果详述） */
export function ruleTheoryCitations(ruleId: string): string[] {
  return theoriesForRule(ruleId).map((t) => {
    const era = t.era ? `，${t.era}` : ''
    return `${t.term}（${t.proponent}${era}）`
  })
}

export function colorRuleLabel(ruleId: string): string {
  return COLOR_RULE_LABELS[ruleId] ?? ruleId
}
