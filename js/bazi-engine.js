(() => {
  "use strict";

  /*
   * BaZi calculation engine
   * -----------------------
   * This file is migrated from the original single-page Chinese tool.
   * The calendar lookup, pillar calculation, Ten Gods derivation,
   * Five Elements counting, and Twelve Life Stages logic are preserved.
   */

  const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  const ELEMENTS = ["木", "火", "土", "金", "水"];

  const STEM_META = {
    "甲": { element: "木", polarity: "阳" },
    "乙": { element: "木", polarity: "阴" },
    "丙": { element: "火", polarity: "阳" },
    "丁": { element: "火", polarity: "阴" },
    "戊": { element: "土", polarity: "阳" },
    "己": { element: "土", polarity: "阴" },
    "庚": { element: "金", polarity: "阳" },
    "辛": { element: "金", polarity: "阴" },
    "壬": { element: "水", polarity: "阳" },
    "癸": { element: "水", polarity: "阴" }
  };

  const BRANCH_ELEMENT = {
    "子": "水",
    "丑": "土",
    "寅": "木",
    "卯": "木",
    "辰": "土",
    "巳": "火",
    "午": "火",
    "未": "土",
    "申": "金",
    "酉": "金",
    "戌": "土",
    "亥": "水"
  };

  const HIDDEN_STEMS = {
    "子": ["癸"],
    "丑": ["癸", "辛", "己"],
    "寅": ["甲", "丙", "戊"],
    "卯": ["乙"],
    "辰": ["乙", "戊", "癸"],
    "巳": ["丙", "戊", "庚"],
    "午": ["丁", "己"],
    "未": ["乙", "己", "丁"],
    "申": ["戊", "庚", "壬"],
    "酉": ["辛"],
    "戌": ["辛", "丁", "戊"],
    "亥": ["壬", "甲"]
  };

  const GENERATES = { "木": "火", "火": "土", "土": "金", "金": "水", "水": "木" };
  const CONTROLS = { "木": "土", "土": "水", "水": "火", "火": "金", "金": "木" };

  const TEN_GOD_BRIEF = {
    "正官": "responsible, principled, and naturally drawn to order",
    "七杀": "decisive, competitive, and built for pressure",
    "正印": "thoughtful, protective, and knowledge-oriented",
    "偏印": "intuitive, unconventional, and quietly inventive",
    "正财": "practical, consistent, and careful with resources",
    "偏财": "enterprising, generous, and alert to opportunity",
    "食神": "expressive, tasteful, and gifted at creating ease",
    "伤官": "sharp, original, and resistant to stale rules",
    "比肩": "self-directed, steady, and loyal to personal truth",
    "劫财": "bold, social, and energized by shared momentum"
  };

  const TEN_ARCHETYPE_EN = {
    "正官": "The Judge",
    "七杀": "The Warrior",
    "正印": "The Scholar",
    "偏印": "The Mystic",
    "正财": "The Steward",
    "偏财": "The Merchant",
    "食神": "The Artist",
    "伤官": "The Rebel",
    "比肩": "The Individualist",
    "劫财": "The Comrade",
    "日主": "Day Master"
  };

  const TEN_ARCHETYPE_LONG = {
    "正官": "The Judge prefers clean rules, earned trust, and decisions that can stand in public.",
    "七杀": "The Warrior turns tension into courage, speed, and tactical action.",
    "正印": "The Scholar absorbs guidance, protects meaning, and grows through disciplined learning.",
    "偏印": "The Mystic reads between systems and is comfortable with unusual ideas.",
    "正财": "The Steward builds security through patience, precision, and material responsibility.",
    "偏财": "The Merchant spots movement in the market and knows how to turn exchange into value.",
    "食神": "The Artist creates comfort, beauty, taste, and a gentler way to be seen.",
    "伤官": "The Rebel questions stale authority and turns raw insight into original expression.",
    "比肩": "The Individualist strengthens identity, independence, and peer-level resilience.",
    "劫财": "The Comrade gathers allies, takes risks with others, and moves through shared force."
  };

  const MONTH_START_STEM = {
    "甲": "丙",
    "己": "丙",
    "乙": "戊",
    "庚": "戊",
    "丙": "庚",
    "辛": "庚",
    "丁": "壬",
    "壬": "壬",
    "戊": "甲",
    "癸": "甲"
  };

  const HOUR_START_STEM = {
    "甲": "甲",
    "己": "甲",
    "乙": "丙",
    "庚": "丙",
    "丙": "戊",
    "辛": "戊",
    "丁": "庚",
    "壬": "庚",
    "戊": "壬",
    "癸": "壬"
  };

  const NAYIN_NAMES = [
    "海中金", "海中金", "炉中火", "炉中火", "大林木", "大林木", "路旁土", "路旁土", "剑锋金", "剑锋金",
    "山头火", "山头火", "涧下水", "涧下水", "城头土", "城头土", "白蜡金", "白蜡金", "杨柳木", "杨柳木",
    "泉中水", "泉中水", "屋上土", "屋上土", "霹雳火", "霹雳火", "松柏木", "松柏木", "长流水", "长流水",
    "沙中金", "沙中金", "山下火", "山下火", "平地木", "平地木", "壁上土", "壁上土", "金箔金", "金箔金",
    "覆灯火", "覆灯火", "天河水", "天河水", "大驿土", "大驿土", "钗钏金", "钗钏金", "桑柘木", "桑柘木",
    "大溪水", "大溪水", "沙中土", "沙中土", "天上火", "天上火", "石榴木", "石榴木", "大海水", "大海水"
  ];

  const LIFE_START = { "木": "亥", "火": "寅", "金": "巳", "水": "申", "土": "申" };
  const LIFE_STAGES = ["长生", "沐浴", "冠带", "临官", "帝旺", "衰", "病", "死", "墓", "绝", "胎", "养"];
  const MONTH_BRANCHES = ["寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑"];
  const POSITION_NAMES = ["年柱", "月柱", "日柱", "时柱"];

  const STEM_EN = {
    "甲": "Jiǎ (Yang Wood)",
    "乙": "Yǐ (Yin Wood)",
    "丙": "Bǐng (Yang Fire)",
    "丁": "Dīng (Yin Fire)",
    "戊": "Wù (Yang Earth)",
    "己": "Jǐ (Yin Earth)",
    "庚": "Gēng (Yang Metal)",
    "辛": "Xīn (Yin Metal)",
    "壬": "Rén (Yang Water)",
    "癸": "Guǐ (Yin Water)"
  };

  const BRANCH_EN = {
    "子": "Zǐ (Rat)",
    "丑": "Chǒu (Ox)",
    "寅": "Yín (Tiger)",
    "卯": "Mǎo (Rabbit)",
    "辰": "Chén (Dragon)",
    "巳": "Sì (Snake)",
    "午": "Wǔ (Horse)",
    "未": "Wèi (Goat)",
    "申": "Shēn (Monkey)",
    "酉": "Yǒu (Rooster)",
    "戌": "Xū (Dog)",
    "亥": "Hài (Pig)"
  };

  const ELEMENT_EN = {
    "木": "Wood",
    "火": "Fire",
    "土": "Earth",
    "金": "Metal",
    "水": "Water"
  };

  const LIFE_STAGE_EN = {
    "长生": "Birth",
    "沐浴": "Bath",
    "冠带": "Coming of Age",
    "临官": "Career",
    "帝旺": "Peak",
    "衰": "Decline",
    "病": "Sickness",
    "死": "Death",
    "墓": "Tomb",
    "绝": "Dissolution",
    "胎": "Conception",
    "养": "Gestation"
  };

  const POSITION_EN = {
    "年柱": "Year Pillar",
    "月柱": "Month Pillar",
    "日柱": "Day Pillar",
    "时柱": "Hour Pillar"
  };

  const NAYIN_EN = {
    "海中金": "Hǎi Zhōng Jīn (Gold in the Sea)",
    "炉中火": "Lú Zhōng Huǒ (Fire in the Furnace)",
    "大林木": "Dà Lín Mù (Great Forest Wood)",
    "路旁土": "Lù Páng Tǔ (Roadside Earth)",
    "剑锋金": "Jiàn Fēng Jīn (Sword-Edge Metal)",
    "山头火": "Shān Tóu Huǒ (Mountain-Top Fire)",
    "涧下水": "Jiàn Xià Shuǐ (Stream Water)",
    "城头土": "Chéng Tóu Tǔ (City Wall Earth)",
    "白蜡金": "Bái Là Jīn (White Wax Metal)",
    "杨柳木": "Yáng Liǔ Mù (Willow Wood)",
    "泉中水": "Quán Zhōng Shuǐ (Spring Water)",
    "屋上土": "Wū Shàng Tǔ (Roof Earth)",
    "霹雳火": "Pī Lì Huǒ (Thunderbolt Fire)",
    "松柏木": "Sōng Bǎi Mù (Pine and Cypress Wood)",
    "长流水": "Cháng Liú Shuǐ (Long Flowing Water)",
    "沙中金": "Shā Zhōng Jīn (Sand Metal)",
    "山下火": "Shān Xià Huǒ (Fire Under the Mountain)",
    "平地木": "Píng Dì Mù (Flatland Wood)",
    "壁上土": "Bì Shàng Tǔ (Wall Earth)",
    "金箔金": "Jīn Bó Jīn (Gold Leaf Metal)",
    "覆灯火": "Fù Dēng Huǒ (Lamp Fire)",
    "天河水": "Tiān Hé Shuǐ (Celestial River Water)",
    "大驿土": "Dà Yì Tǔ (Great Post Road Earth)",
    "钗钏金": "Chāi Chuàn Jīn (Hairpin Metal)",
    "桑柘木": "Sāng Zhè Mù (Mulberry Wood)",
    "大溪水": "Dà Xī Shuǐ (Great Creek Water)",
    "沙中土": "Shā Zhōng Tǔ (Sand Earth)",
    "天上火": "Tiān Shàng Huǒ (Heavenly Fire)",
    "石榴木": "Shí Liú Mù (Pomegranate Wood)",
    "大海水": "Dà Hǎi Shuǐ (Great Ocean Water)"
  };

  const HOUR_RANGES = [
    { val: 23, branch: "子", label: "23:00-00:59" },
    { val: 1, branch: "丑", label: "01:00-02:59" },
    { val: 3, branch: "寅", label: "03:00-04:59" },
    { val: 5, branch: "卯", label: "05:00-06:59" },
    { val: 7, branch: "辰", label: "07:00-08:59" },
    { val: 9, branch: "巳", label: "09:00-10:59" },
    { val: 11, branch: "午", label: "11:00-12:59" },
    { val: 13, branch: "未", label: "13:00-14:59" },
    { val: 15, branch: "申", label: "15:00-16:59" },
    { val: 17, branch: "酉", label: "17:00-18:59" },
    { val: 19, branch: "戌", label: "19:00-20:59" },
    { val: 21, branch: "亥", label: "21:00-22:59" }
  ];

  const LUNAR_INFO = [
    0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
    0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
    0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
    0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
    0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
    0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5d0, 0x14573, 0x052d0, 0x0a9a8, 0x0e950, 0x06aa0,
    0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
    0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,
    0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
    0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x05ac0, 0x0ab60, 0x096d5, 0x092e0,
    0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
    0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
    0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
    0x05aa0
  ];

  const ganzhi60 = Array.from({ length: 60 }, (_, i) => STEMS[i % 10] + BRANCHES[i % 12]);
  const nayinMap = Object.fromEntries(ganzhi60.map((item, index) => [item, NAYIN_NAMES[index]]));

  const pad2 = value => String(value).padStart(2, "0");
  const mod = (value, base) => ((value % base) + base) % base;
  const stemIndex = stem => STEMS.indexOf(stem);
  const branchIndex = branch => BRANCHES.indexOf(branch);
  const ganzhiAt = index => ganzhi60[mod(index, 60)];
  const splitGanzhi = item => ({ stem: item[0], branch: item[1] });
  const utcDate = (year, month, day) => new Date(Date.UTC(year, month - 1, day));
  const daysBetween = (from, to) => Math.floor((to.getTime() - from.getTime()) / 86400000);

  function lunarYearDays(year) {
    const info = LUNAR_INFO[year - 1900];
    let total = 348;
    for (let mask = 0x8000; mask > 0x8; mask >>= 1) {
      total += info & mask ? 1 : 0;
    }
    return total + leapDays(year);
  }

  function leapMonth(year) {
    return LUNAR_INFO[year - 1900] & 0xf;
  }

  function leapDays(year) {
    const leap = leapMonth(year);
    if (!leap) return 0;
    return LUNAR_INFO[year - 1900] & 0x10000 ? 30 : 29;
  }

  function monthDays(year, month) {
    return LUNAR_INFO[year - 1900] & (0x10000 >> month) ? 30 : 29;
  }

  function solarToLunar(date) {
    const base = utcDate(1900, 1, 31);
    let offset = daysBetween(base, date);
    if (offset < 0) {
      throw new Error("The lunar lookup table starts on 1900-01-31. Choose a later date.");
    }

    let year = 1900;
    let daysOfYear = lunarYearDays(year);
    while (year < 2030 && offset >= daysOfYear) {
      offset -= daysOfYear;
      year += 1;
      daysOfYear = lunarYearDays(year);
    }

    const leap = leapMonth(year);
    let isLeap = false;
    let month = 1;
    let daysOfMonth = 0;

    while (month <= 12) {
      if (leap && month === leap + 1 && !isLeap) {
        month -= 1;
        isLeap = true;
        daysOfMonth = leapDays(year);
      } else {
        daysOfMonth = monthDays(year, month);
      }

      if (offset < daysOfMonth) break;

      offset -= daysOfMonth;
      if (isLeap && month === leap) {
        isLeap = false;
      }
      month += 1;
    }

    return { year, month, day: offset + 1, isLeap };
  }

  function getYearPillar(lunarYear) {
    return ganzhiAt(lunarYear - 4);
  }

  function getMonthPillar(yearStem, lunarMonth) {
    const startStem = MONTH_START_STEM[yearStem];
    const stem = STEMS[mod(stemIndex(startStem) + lunarMonth - 1, 10)];
    const branch = MONTH_BRANCHES[lunarMonth - 1];
    return stem + branch;
  }

  function getDayPillar(date) {
    const base = utcDate(1900, 1, 1);
    const offset = daysBetween(base, date);
    return ganzhiAt(offset + 10);
  }

  function getHourBranch(hour) {
    if (hour === 23) return "子";
    return BRANCHES[Math.floor((hour + 1) / 2) % 12];
  }

  function getHourPillar(dayStem, hour) {
    const startStem = HOUR_START_STEM[dayStem];
    const branch = getHourBranch(hour);
    const stem = STEMS[mod(stemIndex(startStem) + branchIndex(branch), 10)];
    return stem + branch;
  }

  function tenGod(dayStem, targetStem) {
    const day = STEM_META[dayStem];
    const target = STEM_META[targetStem];
    const samePolarity = day.polarity === target.polarity;

    if (target.element === day.element) return samePolarity ? "比肩" : "劫财";
    if (CONTROLS[target.element] === day.element) return samePolarity ? "七杀" : "正官";
    if (GENERATES[target.element] === day.element) return samePolarity ? "偏印" : "正印";
    if (CONTROLS[day.element] === target.element) return samePolarity ? "偏财" : "正财";
    if (GENERATES[day.element] === target.element) return samePolarity ? "食神" : "伤官";
    return "";
  }

  function lifeStage(dayStem, branch) {
    const element = STEM_META[dayStem].element;
    const start = branchIndex(LIFE_START[element]);
    return LIFE_STAGES[mod(branchIndex(branch) - start, 12)];
  }

  function careerByHourGod(hourGod) {
    if (["正财", "偏财"].includes(hourGod)) {
      return "Your Hour Stem emphasizes wealth work: building assets, negotiating value, and choosing practical opportunities.";
    }
    if (["正官", "七杀"].includes(hourGod)) {
      return "Your Hour Stem emphasizes authority work: leadership, strategy, standards, and the ability to hold pressure.";
    }
    if (["食神", "伤官"].includes(hourGod)) {
      return "Your Hour Stem emphasizes freedom work: creativity, communication, craft, product thinking, or independent expertise.";
    }
    if (["正印", "偏印"].includes(hourGod)) {
      return "Your Hour Stem emphasizes knowledge work: research, advising, education, healing, or pattern recognition.";
    }
    return "Your Hour Stem emphasizes belonging work: collaboration, founder energy, peer networks, and resilient self-direction.";
  }

  function elementCounts(pillars) {
    const counts = Object.fromEntries(ELEMENTS.map(item => [item, 0]));
    pillars.forEach(pillar => {
      counts[STEM_META[pillar.stem].element] += 1;
      HIDDEN_STEMS[pillar.branch].forEach(stem => {
        counts[STEM_META[stem].element] += 1;
      });
    });
    return counts;
  }

  function detectCombos(gods) {
    const has = name => gods.includes(name);
    const combos = [];
    if ((has("食神") || has("伤官")) && (has("正财") || has("偏财"))) {
      combos.push("Output generates Wealth: talent becomes practical value.");
    }
    if (has("七杀") && (has("正印") || has("偏印"))) {
      combos.push("Power supported by Resource: pressure is refined through learning and structure.");
    }
    if (has("伤官") && (has("正印") || has("偏印"))) {
      combos.push("Rebel paired with Resource: originality gains discipline and legitimacy.");
    }
    return combos.length ? combos : ["No major classic pattern stands out from these three starter combinations."];
  }

  function parseDateInput(value) {
    if (value instanceof Date) {
      return utcDate(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate());
    }
    const [year, month, day] = String(value).split("-").map(Number);
    if (!year || !month || !day) {
      throw new Error("Use a valid birth date.");
    }
    return utcDate(year, month, day);
  }

  function buildChart(date, hour) {
    const workingDate = parseDateInput(date);
    const lunar = solarToLunar(workingDate);
    const yearPillar = splitGanzhi(getYearPillar(lunar.year));
    const monthPillar = splitGanzhi(getMonthPillar(yearPillar.stem, lunar.month));
    const dayPillar = splitGanzhi(getDayPillar(workingDate));
    const hourPillar = splitGanzhi(getHourPillar(dayPillar.stem, hour));
    const pillars = [yearPillar, monthPillar, dayPillar, hourPillar].map((pillar, index) => ({
      ...pillar,
      name: POSITION_NAMES[index],
      nameEnglish: POSITION_EN[POSITION_NAMES[index]],
      ganzhi: pillar.stem + pillar.branch
    }));

    pillars.forEach(pillar => {
      pillar.stemGod = pillar.name === "日柱" ? "日主" : tenGod(dayPillar.stem, pillar.stem);
      pillar.stemGodEnglish = TEN_ARCHETYPE_EN[pillar.stemGod];
      pillar.hidden = HIDDEN_STEMS[pillar.branch].map(stem => ({
        stem,
        stemEnglish: STEM_EN[stem],
        god: tenGod(dayPillar.stem, stem),
        godEnglish: TEN_ARCHETYPE_EN[tenGod(dayPillar.stem, stem)],
        element: STEM_META[stem].element,
        elementEnglish: ELEMENT_EN[STEM_META[stem].element]
      }));
      pillar.nayin = nayinMap[pillar.ganzhi];
      pillar.nayinEnglish = NAYIN_EN[pillar.nayin];
      pillar.stemEnglish = STEM_EN[pillar.stem];
      pillar.branchEnglish = BRANCH_EN[pillar.branch];
      pillar.elements = `${STEM_META[pillar.stem].element} / ${BRANCH_ELEMENT[pillar.branch]}`;
      pillar.elementsEnglish = `${ELEMENT_EN[STEM_META[pillar.stem].element]} / ${ELEMENT_EN[BRANCH_ELEMENT[pillar.branch]]}`;
      pillar.lifeStage = lifeStage(dayPillar.stem, pillar.branch);
      pillar.lifeStageEnglish = LIFE_STAGE_EN[pillar.lifeStage];
    });

    return { lunar, pillars, dayStem: dayPillar.stem, dayStemEnglish: STEM_EN[dayPillar.stem] };
  }

  function formatStem(stem) {
    return `${stem} ${STEM_EN[stem]}`;
  }

  function formatBranch(branch) {
    return `${branch} ${BRANCH_EN[branch]}`;
  }

  function formatGod(god) {
    return god === "日主" ? "Day Master" : `${TEN_ARCHETYPE_EN[god]} (${god})`;
  }

  function formatElement(element) {
    return ELEMENT_EN[element] || element;
  }

  function formatLifeStage(stage) {
    return `${LIFE_STAGE_EN[stage]} (${stage})`;
  }

  function formatNayin(nayin) {
    return `${NAYIN_EN[nayin]} (${nayin})`;
  }

  function collectGods(chart) {
    const allGods = [];
    chart.pillars.forEach(pillar => {
      if (pillar.stemGod !== "日主") allGods.push(pillar.stemGod);
      pillar.hidden.forEach(item => allGods.push(item.god));
    });
    return allGods;
  }

  function dominantGod(gods) {
    const counts = new Map();
    gods.forEach(god => {
      if (!god || god === "日主") return;
      counts.set(god, (counts.get(god) || 0) + 1);
    });

    let topGod = "";
    let topCount = 0;
    counts.forEach((count, god) => {
      if (count > topCount) {
        topGod = god;
        topCount = count;
      }
    });

    return topGod || gods.find(god => god && god !== "日主") || "比肩";
  }

  function calculatorUrl() {
    if (window.location.protocol === "file:") {
      return "https://mystic-east.example/calculator.html";
    }

    const url = new URL(window.location.href);
    url.hash = "";
    url.search = "";
    return url.toString();
  }

  function shareCopy(archetype) {
    return `My BaZi chart reveals I'm ${archetype} - discover yours at ${calculatorUrl()}`;
  }

  function updateResultCta(god) {
    const archetype = TEN_ARCHETYPE_EN[god] || "your dominant archetype";
    const title = document.getElementById("readingHookTitle");
    const text = document.getElementById("readingHookText");

    if (title) {
      title.textContent = `Your chart shows ${archetype} as dominant`;
    }

    if (text) {
      text.textContent = `Want to understand how that shapes your career path, relationships, and next season?`;
    }
  }

  function updateSharePanel(god) {
    const archetype = TEN_ARCHETYPE_EN[god] || "your BaZi archetype";
    const copy = shareCopy(archetype);
    const encodedCopy = encodeURIComponent(copy);
    const encodedUrl = encodeURIComponent(calculatorUrl());
    const shareTextPreview = document.getElementById("shareTextPreview");
    const shareX = document.getElementById("shareX");
    const shareReddit = document.getElementById("shareReddit");
    const copyShare = document.getElementById("copyShare");
    const copyShareStatus = document.getElementById("copyShareStatus");

    if (shareTextPreview) shareTextPreview.textContent = copy;
    if (shareX) shareX.href = `https://twitter.com/intent/tweet?text=${encodedCopy}`;
    if (shareReddit) shareReddit.href = `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedCopy}`;

    if (copyShare) {
      copyShare.onclick = async () => {
        if (copyShareStatus) copyShareStatus.textContent = "";

        try {
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(copy);
          } else {
            const textArea = document.createElement("textarea");
            textArea.value = copy;
            textArea.setAttribute("readonly", "");
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand("copy");
            document.body.removeChild(textArea);
          }

          if (copyShareStatus) copyShareStatus.textContent = "Copied share text.";
        } catch (err) {
          if (copyShareStatus) copyShareStatus.textContent = "Copy failed. Select the text above instead.";
        }
      };
    }
  }

  function renderChart(chart, source = {}) {
    const resultTitle = document.getElementById("resultTitle");
    const lunarLine = document.getElementById("lunarLine");
    const pillarsEl = document.getElementById("pillars");
    const detailRows = document.getElementById("detailRows");
    const elementBars = document.getElementById("elementBars");
    const personality = document.getElementById("personality");
    const career = document.getElementById("career");
    const comboTags = document.getElementById("comboTags");
    const displayName = source.name ? `${source.name}'s Cosmic Blueprint` : "Your Cosmic Blueprint";

    if (!resultTitle || !lunarLine || !pillarsEl || !detailRows || !elementBars || !personality || !career || !comboTags) {
      return;
    }

    resultTitle.textContent = displayName;
    lunarLine.textContent = `Solar birth: ${source.dateText || ""} ${pad2(source.hour || 0)}:00 · Lunar date: ${chart.lunar.year}, ${chart.lunar.isLeap ? "leap " : ""}month ${chart.lunar.month}, day ${chart.lunar.day} · Day Master: ${chart.dayStemEnglish}`;

    pillarsEl.innerHTML = chart.pillars.map(pillar => `
      <article class="pillar-card">
        <p>${pillar.nameEnglish}</p>
        <strong>${pillar.ganzhi}</strong>
        <span>${pillar.stemEnglish.split(" ")[0]} ${pillar.branchEnglish.split(" ")[0]}</span>
        <small>${formatGod(pillar.stemGod)} · ${pillar.nayinEnglish}</small>
      </article>
    `).join("");

    detailRows.innerHTML = chart.pillars.map(pillar => `
      <tr>
        <td>${pillar.nameEnglish}</td>
        <td><strong>${formatStem(pillar.stem)}</strong><span>${formatGod(pillar.stemGod)}</span></td>
        <td><strong>${formatBranch(pillar.branch)}</strong></td>
        <td>${pillar.hidden.map(item => `${item.stem} ${item.stemEnglish}`).join("<br>")}</td>
        <td>${pillar.name === "日柱" ? "Day Master; " : ""}${pillar.hidden.map(item => formatGod(item.god)).join("<br>")}</td>
        <td>${pillar.elementsEnglish}</td>
        <td>${formatNayin(pillar.nayin)}</td>
        <td>${formatLifeStage(pillar.lifeStage)}</td>
      </tr>
    `).join("");

    const counts = elementCounts(chart.pillars);
    const maxCount = Math.max(...Object.values(counts), 1);
    elementBars.innerHTML = ELEMENTS.map(element => `
      <div class="bar-row element-${ELEMENT_EN[element].toLowerCase()}">
        <span>${ELEMENT_EN[element]}</span>
        <div class="bar"><span style="width:${Math.max(8, counts[element] / maxCount * 100)}%"></span></div>
        <b>${counts[element]}</b>
      </div>
    `).join("");

    const allGods = collectGods(chart);
    const uniqueGods = [...new Set(allGods)].slice(0, 6);
    const topGod = dominantGod(allGods);
    personality.innerHTML = uniqueGods.map(god => `
      <article class="archetype-chip">
        <strong>${TEN_ARCHETYPE_EN[god]}</strong>
        <span>${TEN_GOD_BRIEF[god]}</span>
      </article>
    `).join("");

    const hourGod = chart.pillars[3].stemGod;
    career.textContent = careerByHourGod(hourGod);
    comboTags.innerHTML = detectCombos(allGods).map(item => `<span class="tag">${item}</span>`).join("");
    updateResultCta(topGod);
    updateSharePanel(topGod);

    const emptyState = document.getElementById("emptyState");
    const results = document.getElementById("results");
    if (emptyState) emptyState.hidden = true;
    if (results) results.hidden = false;
  }

  function initHourOptions(selectId = "birthHour") {
    const hourSelect = document.getElementById(selectId);
    if (!hourSelect) return;

    hourSelect.innerHTML = HOUR_RANGES.map(range => (
      `<option value="${range.val}">${range.label} · ${range.branch} ${BRANCH_EN[range.branch]}</option>`
    )).join("");
    hourSelect.value = "7";
  }

  function initSixtyGrid(containerId = "sixtyGrid") {
    const grid = document.getElementById(containerId);
    if (!grid) return;

    grid.innerHTML = ganzhi60
      .map((item, index) => `<span>${pad2(index + 1)} ${item}<br>${formatNayin(nayinMap[item])}</span>`)
      .join("");
  }

  function initForm() {
    const form = document.getElementById("birthForm");
    const error = document.getElementById("formError");
    const dateInput = document.getElementById("birthDate");
    if (!form || !dateInput) return;

    dateInput.value = dateInput.value || "1990-01-01";

    form.addEventListener("submit", event => {
      event.preventDefault();
      if (error) error.textContent = "";

      const dateText = dateInput.value;
      const hour = Number(document.getElementById("birthHour").value);
      const name = document.getElementById("birthName").value.trim();

      if (!dateText) {
        if (error) error.textContent = "Choose your solar birth date first.";
        return;
      }

      const [year, month, day] = dateText.split("-").map(Number);
      if (year < 1900 || year > 2030 || !month || !day) {
        if (error) error.textContent = "This browser edition supports the lunar lookup range 1900-2030.";
        return;
      }

      try {
        const date = utcDate(year, month, day);
        const chart = buildChart(date, hour);
        renderChart(chart, { dateText, hour, name });
      } catch (err) {
        if (error) error.textContent = err.message;
      }
    });
  }

  function initYearShortcuts() {
    const yearBack = document.getElementById("yearBack");
    const yearFwd = document.getElementById("yearFwd");
    const dateInput = document.getElementById("birthDate");
    if (!yearBack || !yearFwd || !dateInput) return;

    yearBack.addEventListener("click", () => {
      const [year, month, day] = dateInput.value.split("-").map(Number);
      dateInput.value = `${year - 1}-${pad2(month)}-${pad2(day)}`;
    });

    yearFwd.addEventListener("click", () => {
      const [year, month, day] = dateInput.value.split("-").map(Number);
      dateInput.value = `${year + 1}-${pad2(month)}-${pad2(day)}`;
    });
  }

  function initReadingModal() {
    const modal = document.getElementById("readingModal");
    const modalClose = document.getElementById("readingModalClose");
    if (!modal || !modalClose) return;

    document.querySelectorAll("[data-reading-tier]").forEach(button => {
      button.addEventListener("click", () => {
        modal.hidden = false;
      });
    });

    modalClose.addEventListener("click", () => {
      modal.hidden = true;
    });

    modal.addEventListener("click", event => {
      if (event.target === modal) modal.hidden = true;
    });
  }

  function initCalculatorPage() {
    initHourOptions();
    initSixtyGrid();
    initForm();
    initYearShortcuts();
  }

  function init() {
    initCalculatorPage();
    initReadingModal();
  }

  window.BaZiEngine = {
    STEMS,
    BRANCHES,
    ELEMENTS,
    STEM_META,
    BRANCH_ELEMENT,
    HIDDEN_STEMS,
    TEN_ARCHETYPE_EN,
    TEN_GOD_BRIEF,
    TEN_ARCHETYPE_LONG,
    STEM_EN,
    BRANCH_EN,
    ELEMENT_EN,
    LIFE_STAGE_EN,
    POSITION_EN,
    NAYIN_EN,
    HOUR_RANGES,
    ganzhi60,
    nayinMap,
    pad2,
    utcDate,
    solarToLunar,
    getYearPillar,
    getMonthPillar,
    getDayPillar,
    getHourBranch,
    getHourPillar,
    tenGod,
    lifeStage,
    careerByHourGod,
    elementCounts,
    detectCombos,
    buildChart,
    renderChart,
    formatStem,
    formatBranch,
    formatGod,
    formatElement,
    formatLifeStage,
    formatNayin,
    collectGods,
    dominantGod,
    calculatorUrl,
    shareCopy,
    updateResultCta,
    updateSharePanel,
    initHourOptions,
    initSixtyGrid,
    initForm,
    initYearShortcuts,
    initReadingModal,
    initCalculatorPage,
    init
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
