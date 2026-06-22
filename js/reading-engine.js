(() => {
  "use strict";

  const TIERS = {
    essential: {
      label: "Essential",
      price: "9.99",
      target: "about 500-700 words"
    },
    deep: {
      label: "Deep",
      price: "19.99",
      target: "about 1000-1500 words"
    },
    master: {
      label: "Master",
      price: "39.99",
      target: "about 2000-2500 words"
    }
  };

  const LAST_READING_KEY = "mysticEastLastReading";

  const ORDERED_GODS = ["正官", "七杀", "正印", "偏印", "正财", "偏财", "食神", "伤官", "比肩", "劫财"];

  const GOD_FAMILIES = [
    {
      label: "Authority and pressure",
      gods: ["正官", "七杀"],
      prompt: "standards, responsibility, pressure, leadership, and the way a person meets external demands"
    },
    {
      label: "Resource and learning",
      gods: ["正印", "偏印"],
      prompt: "support, study, inner protection, mentors, intuition, and the way a person receives guidance"
    },
    {
      label: "Wealth and material handling",
      gods: ["正财", "偏财"],
      prompt: "resources, exchange, practical responsibility, opportunity, and the way a person handles value"
    },
    {
      label: "Output and expression",
      gods: ["食神", "伤官"],
      prompt: "creativity, taste, speech, production, originality, and the way a person sends talent outward"
    },
    {
      label: "Peer and self-strength",
      gods: ["比肩", "劫财"],
      prompt: "identity, peers, allies, competition, independence, and the way a person stands among equals"
    }
  ];

  const PILLAR_CONTEXT = {
    "年柱": "ancestral field and early environment",
    "月柱": "seasonal rhythm, public role, and work atmosphere",
    "日柱": "the Day Master center and intimate self-reference",
    "时柱": "future direction, craft, children, projects, and late-stage expression"
  };

  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[char]);

  function engine() {
    return window.BaZiEngine || null;
  }

  function loadStoredChart() {
    try {
      const raw = localStorage.getItem("baziChart");
      if (!raw) return null;
      const chart = JSON.parse(raw);
      if (!chart || !Array.isArray(chart.pillars) || !chart.dayStem) return null;
      return chart;
    } catch (err) {
      return null;
    }
  }

  function safeFilePart(value, fallback) {
    return String(value || fallback)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || fallback;
  }

  function readingFilename(data) {
    const tier = safeFilePart(data?.tier, "reading");
    const name = safeFilePart(data?.source?.name, "chart");
    const stamp = safeFilePart((data?.generatedAt || "").slice(0, 10), "backup");
    return `mystic-east-${tier}-${name}-${stamp}.html`;
  }

  function saveReadingBackup(payload) {
    try {
      localStorage.setItem(LAST_READING_KEY, JSON.stringify(payload));
      return true;
    } catch (err) {
      return false;
    }
  }

  function loadReadingBackup() {
    try {
      const raw = localStorage.getItem(LAST_READING_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.html || !parsed.tier) return null;
      return parsed;
    } catch (err) {
      return null;
    }
  }

  function clearReadingBackup() {
    try {
      localStorage.removeItem(LAST_READING_KEY);
    } catch (err) {
      // Ignore local storage failures; clearing is best effort only.
    }
  }

  function backupMetaText(data) {
    if (!data) return "";

    const source = data.source || {};
    const tier = TIERS[data.tier]?.label || data.tier;
    const pieces = [
      `${tier} reading`,
      source.name ? `for ${source.name}` : null,
      source.dateText ? `chart date ${source.dateText}` : null,
      data.generatedAt ? `saved ${new Date(data.generatedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}` : null
    ].filter(Boolean);

    return pieces.join(" · ");
  }

  function downloadBackup(data) {
    if (!data || !data.html) return;

    const documentHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Mystic East ${escapeHtml(TIERS[data.tier]?.label || "Reading")} Backup</title>
</head>
<body>
${data.html}
</body>
</html>`;
    const blob = new Blob([documentHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = readingFilename(data);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function section(title, body) {
    return `
      <section class="reading-section">
        <h3>${escapeHtml(title)}</h3>
        ${body}
      </section>
    `;
  }

  function godStats(chart) {
    const bazi = engine();
    const counts = new Map();
    ORDERED_GODS.forEach(god => counts.set(god, 0));
    bazi.collectGods(chart).forEach(god => {
      if (!god || god === "日主") return;
      counts.set(god, (counts.get(god) || 0) + 1);
    });

    return [...counts.entries()]
      .map(([god, count]) => ({
        god,
        count,
        archetype: bazi.TEN_ARCHETYPE_EN[god],
        brief: bazi.TEN_GOD_BRIEF[god],
        long: bazi.TEN_ARCHETYPE_LONG[god]
      }))
      .sort((a, b) => b.count - a.count || ORDERED_GODS.indexOf(a.god) - ORDERED_GODS.indexOf(b.god));
  }

  function elementStats(chart) {
    const bazi = engine();
    const counts = bazi.elementCounts(chart.pillars);
    const visible = Object.fromEntries(bazi.ELEMENTS.map(element => [element, 0]));
    const hidden = Object.fromEntries(bazi.ELEMENTS.map(element => [element, 0]));

    chart.pillars.forEach(pillar => {
      visible[bazi.STEM_META[pillar.stem].element] += 1;
      pillar.hidden.forEach(item => {
        hidden[item.element] += 1;
      });
    });

    const sorted = bazi.ELEMENTS
      .map(element => ({
        element,
        elementEnglish: bazi.ELEMENT_EN[element],
        count: counts[element],
        visible: visible[element],
        hidden: hidden[element]
      }))
      .sort((a, b) => b.count - a.count || b.visible - a.visible);

    const maxCount = Math.max(...sorted.map(item => item.count), 1);
    const minCount = Math.min(...sorted.map(item => item.count));
    const strongest = sorted.filter(item => item.count === sorted[0].count);
    const least = sorted.filter(item => item.count === minCount);

    return { counts, sorted, maxCount, strongest, least };
  }

  function familyStats(stats) {
    return GOD_FAMILIES.map(family => {
      const count = family.gods.reduce((sum, god) => {
        const match = stats.find(item => item.god === god);
        return sum + (match ? match.count : 0);
      }, 0);

      return { ...family, count };
    }).sort((a, b) => b.count - a.count);
  }

  function formatGod(god) {
    const bazi = engine();
    return `${bazi.TEN_ARCHETYPE_EN[god]} (${god})`;
  }

  function hiddenStemText(pillar) {
    return pillar.hidden
      .map(item => `${escapeHtml(item.stem)} ${escapeHtml(item.stemEnglish)} · ${escapeHtml(formatGod(item.god))}`)
      .join("<br>");
  }

  function sourceMeta(chart) {
    return chart.source || {};
  }

  function buildIntro(tier, chart) {
    const bazi = engine();
    const source = sourceMeta(chart);
    const name = source.name ? `${escapeHtml(source.name)}'s` : "Your";
    const dayElement = bazi.STEM_META[chart.dayStem].element;
    const dayElementEnglish = bazi.ELEMENT_EN[dayElement];
    const lunar = chart.lunar || {};
    const hour = Number.isFinite(Number(source.hour)) ? `${bazi.pad2(Number(source.hour))}:00` : "from stored chart";
    const birthDate = source.dateText || "stored calculator date";
    const target = TIERS[tier].target;

    return `
      <article class="reading-paper" data-reading-tier="${escapeHtml(tier)}">
        <span class="eyebrow">${escapeHtml(TIERS[tier].label)} instant reading</span>
        <h2>${name} BaZi Reading</h2>
        <p class="reading-lede">
          Your ${escapeHtml(TIERS[tier].label)} report is ready. It is generated in your browser from the chart saved by the free calculator.
          The interpretation uses the Four Pillars, Ten Archetypes, Five Elements, Twelve Life Stages, classic combinations, and Nayin labels exposed by the Mystic East BaZi engine.
        </p>
        <div class="reading-actions">
          <button class="btn" type="button" data-print-reading>Save as PDF</button>
          <a class="btn secondary" href="calculator.html">Open Calculator</a>
        </div>
        <div class="reading-meta" aria-label="Reading metadata">
          <span><strong>Tier</strong>${escapeHtml(TIERS[tier].label)} · ${escapeHtml(target)}</span>
          <span><strong>Birth data</strong>${escapeHtml(birthDate)} · ${escapeHtml(hour)}</span>
          <span><strong>Lunar date</strong>${escapeHtml(lunar.year || "")}, month ${escapeHtml(lunar.month || "")}, day ${escapeHtml(lunar.day || "")}</span>
          <span><strong>Day Master</strong><span lang="zh-Hans">${escapeHtml(chart.dayStem)}</span> ${escapeHtml(chart.dayStemEnglish)}</span>
          <span><strong>Day element</strong>${escapeHtml(dayElementEnglish)} (<span lang="zh-Hans">${escapeHtml(dayElement)}</span>)</span>
          <span><strong>Method</strong>Local chart data translated into a browser-generated report</span>
        </div>
    `;
  }

  function buildOutro() {
    return `
        <p class="fulfillment-note">Use the Save as PDF button above to keep a copy of this reading.</p>
      </article>
    `;
  }

  function buildDayMasterSection(chart) {
    const bazi = engine();
    const dayElement = bazi.STEM_META[chart.dayStem].element;
    const dayElementEnglish = bazi.ELEMENT_EN[dayElement];
    const dayMasterLabel = bazi.TEN_ARCHETYPE_EN["日主"];

    return section("Day Master", `
      <p>
        Your Day Master is <strong><span lang="zh-Hans">${escapeHtml(chart.dayStem)}</span> ${escapeHtml(chart.dayStemEnglish)}</strong>.
        In this engine, the Day Master is the reference point for every Ten Archetype. Each visible Heavenly Stem and each Hidden Stem is translated by how it relates to this center.
      </p>
      <p>
        The Day Master label is <strong>${escapeHtml(dayMasterLabel)}</strong>, and its element is <strong>${escapeHtml(dayElementEnglish)}</strong>
        (<span lang="zh-Hans">${escapeHtml(dayElement)}</span>). This does not make the chart good or bad. It simply names the lens through which the surrounding pillars are read.
      </p>
    `);
  }

  function buildPillarOverview(chart) {
    return section("Four Pillars Overview", `
      <p>
        The table keeps the original Chinese stem-branch text and adds pinyin labels. The Day Pillar is the center of the reading; the other pillars show the symbolic material around it.
      </p>
      <div class="reading-table">
        <table>
          <thead>
            <tr>
              <th>Pillar</th>
              <th>GanZhi</th>
              <th>Stem Archetype</th>
              <th>Hidden Stems</th>
              <th>Elements</th>
              <th>Life Stage</th>
              <th>Nayin</th>
            </tr>
          </thead>
          <tbody>
            ${chart.pillars.map(pillar => `
              <tr>
                <td>
                  <strong>${escapeHtml(pillar.nameEnglish)}</strong>
                  <small><span lang="zh-Hans">${escapeHtml(pillar.name)}</span> · ${escapeHtml(PILLAR_CONTEXT[pillar.name] || "")}</small>
                </td>
                <td>
                  <span class="hanzi" lang="zh-Hans">${escapeHtml(pillar.ganzhi)}</span>
                  <small>${escapeHtml(pillar.stemEnglish)} + ${escapeHtml(pillar.branchEnglish)}</small>
                </td>
                <td>${escapeHtml(pillar.name === "日柱" ? "Day Master" : formatGod(pillar.stemGod))}</td>
                <td>${hiddenStemText(pillar)}</td>
                <td>${escapeHtml(pillar.elementsEnglish)}</td>
                <td>${escapeHtml(pillar.lifeStageEnglish)} <small><span lang="zh-Hans">${escapeHtml(pillar.lifeStage)}</span></small></td>
                <td>${escapeHtml(pillar.nayinEnglish)} <small><span lang="zh-Hans">${escapeHtml(pillar.nayin)}</span></small></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `);
  }

  function buildTopArchetypes(chart) {
    const top = godStats(chart).filter(item => item.count > 0).slice(0, 3);

    return section("Main Ten Archetypes", `
      <p>
        The strongest archetypes below are counted from visible Heavenly Stems and Hidden Stems. They are not personality boxes; they are repeated symbolic relationships around the Day Master.
      </p>
      <ul class="reading-list">
        ${top.map(item => `
          <li>
            <strong>${escapeHtml(item.archetype)} (<span lang="zh-Hans">${escapeHtml(item.god)}</span>) · ${escapeHtml(item.count)} appearance${item.count === 1 ? "" : "s"}</strong>
            <br>${escapeHtml(item.brief)}.
          </li>
        `).join("")}
      </ul>
    `);
  }

  function buildElementSnapshot(chart) {
    const stats = elementStats(chart);
    const strongest = stats.strongest.map(item => `${item.elementEnglish} (${item.element})`).join(", ");
    const least = stats.least.map(item => `${item.elementEnglish} (${item.element})`).join(", ");

    return section("Five Elements Snapshot", `
      <p>
        This count follows the calculator method: visible Heavenly Stems plus Hidden Stems inside the Earthly Branches.
        The most repeated element is <strong>${escapeHtml(strongest)}</strong>; the least represented element is <strong>${escapeHtml(least)}</strong>.
      </p>
      <div class="element-grid">
        ${stats.sorted.map(item => `
          <div class="element-meter element-${escapeHtml(item.elementEnglish.toLowerCase())}">
            <span>${escapeHtml(item.elementEnglish)}</span>
            <div class="bar"><span style="width:${Math.max(8, item.count / stats.maxCount * 100)}%"></span></div>
            <b>${escapeHtml(item.count)}</b>
          </div>
        `).join("")}
      </div>
    `);
  }

  function buildCareerOneLine(chart) {
    const bazi = engine();
    const hourPillar = chart.pillars[3];
    const hourGod = hourPillar.stemGod;
    const career = bazi.careerByHourGod(hourGod);

    return section("Career Direction", `
      <p>
        The Hour Stem is <strong>${escapeHtml(formatGod(hourGod))}</strong> on <span lang="zh-Hans">${escapeHtml(hourPillar.ganzhi)}</span>
        ${escapeHtml(hourPillar.stemEnglish)} + ${escapeHtml(hourPillar.branchEnglish)}.
      </p>
      <p><strong>${escapeHtml(career)}</strong></p>
    `);
  }

  function buildAllArchetypes(chart) {
    const stats = godStats(chart);

    return section("All Ten Archetypes in Detail", `
      <p>
        Deep and Master readings show every Ten Archetype so you can see what is present, repeated, or quiet in this chart.
        The descriptions come from the BaZi engine's English archetype map.
      </p>
      <ul class="reading-list">
        ${stats.map(item => `
          <li>
            <strong>${escapeHtml(item.archetype)} (<span lang="zh-Hans">${escapeHtml(item.god)}</span>) · count ${escapeHtml(item.count)}</strong>
            <br>${escapeHtml(item.long)}
            <br><small>${escapeHtml(item.count > 0 ? "Present in the chart count." : "Not directly present in the visible or hidden stem count.")}</small>
          </li>
        `).join("")}
      </ul>
    `);
  }

  function buildElementDepth(chart) {
    const stats = elementStats(chart);
    const strongest = stats.strongest.map(item => item.elementEnglish).join(", ");
    const least = stats.least.map(item => item.elementEnglish).join(", ");

    return section("Five Elements Depth", `
      <p>
        The chart's element profile is not a verdict. It is a distribution map. A repeated element shows material the calculator sees again and again in the pillars.
        A quieter element shows material that appears less often in this specific stem-and-hidden-stem count.
      </p>
      <p>
        Here, <strong>${escapeHtml(strongest)}</strong> carries the strongest visible-and-hidden repetition, while <strong>${escapeHtml(least)}</strong>
        is the quietest direction. In practical reflection, repeated material can become familiar, overused, or reliable; quieter material can become a balancing prompt.
      </p>
      <div class="reading-table">
        <table>
          <thead>
            <tr>
              <th>Element</th>
              <th>Total</th>
              <th>Visible Stems</th>
              <th>Hidden Stems</th>
            </tr>
          </thead>
          <tbody>
            ${stats.sorted.map(item => `
              <tr>
                <td><strong>${escapeHtml(item.elementEnglish)}</strong> <small><span lang="zh-Hans">${escapeHtml(item.element)}</span></small></td>
                <td>${escapeHtml(item.count)}</td>
                <td>${escapeHtml(item.visible)}</td>
                <td>${escapeHtml(item.hidden)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `);
  }

  function buildLifeStages(chart) {
    return section("Twelve Life Stages by Pillar", `
      <p>
        The Twelve Life Stages are calculated from the Day Master against each Earthly Branch. This page uses them as symbolic texture for each pillar, not as a fixed event prediction.
      </p>
      <ul class="reading-list">
        ${chart.pillars.map(pillar => `
          <li>
            <strong>${escapeHtml(pillar.nameEnglish)} · <span lang="zh-Hans">${escapeHtml(pillar.ganzhi)}</span> · ${escapeHtml(pillar.lifeStageEnglish)} (<span lang="zh-Hans">${escapeHtml(pillar.lifeStage)}</span>)</strong>
            <br>The ${escapeHtml(PILLAR_CONTEXT[pillar.name] || "pillar field")} carries this life-stage texture in the chart.
          </li>
        `).join("")}
      </ul>
    `);
  }

  function buildCombos(chart) {
    const bazi = engine();
    const combos = bazi.detectCombos(bazi.collectGods(chart));

    return section("Classic Combination Notes", `
      <p>
        Mystic East checks a small starter set of classic combinations from the Ten Archetype list. These are pattern notes, not a complete classical audit.
      </p>
      <div class="reading-tags">
        ${combos.map(combo => `<span class="tag">${escapeHtml(combo)}</span>`).join("")}
      </div>
    `);
  }

  function buildThreeYearPrompts(chart) {
    const currentYear = new Date().getFullYear();
    const month = chart.pillars[1];
    const hour = chart.pillars[3];
    const dominant = godStats(chart).find(item => item.count > 0);

    const years = [
      {
        year: currentYear + 1,
        text: `Use the Month Pillar ${month.ganzhi} as the public rhythm: ${month.stemEnglish} meets ${month.branchEnglish}, with ${month.lifeStageEnglish} as its life-stage texture.`
      },
      {
        year: currentYear + 2,
        text: `Bridge the Month and Hour Pillars through the dominant archetype ${dominant ? `${dominant.archetype} (${dominant.god})` : "shown by the chart count"}. Let repeated chart material become deliberate rather than automatic.`
      },
      {
        year: currentYear + 3,
        text: `Use the Hour Pillar ${hour.ganzhi} as the project-and-future signal: ${hour.stemEnglish} meets ${hour.branchEnglish}, with ${formatGod(hour.stemGod)} leading the career prompt.`
      }
    ];

    return section("Three-Year Symbolic Prompts", `
      <p>
        This is a simplified browser-only prompt set based on the Month and Hour Pillars. It does not calculate formal luck pillars or annual Tai Sui interactions.
      </p>
      <ul class="reading-list">
        ${years.map(item => `
          <li><strong>${escapeHtml(item.year)}</strong><br>${escapeHtml(item.text)}</li>
        `).join("")}
      </ul>
    `);
  }

  function buildStructure(chart) {
    const stats = godStats(chart);
    const families = familyStats(stats);
    const lead = families[0];

    return section("Starter Structure Judgment", `
      <p>
        A formal BaZi structure judgment requires more than this static browser engine. This Master reading gives a starter structure by grouping counted Ten Archetypes into five families.
      </p>
      <p>
        The leading family is <strong>${escapeHtml(lead.label)}</strong> with count <strong>${escapeHtml(lead.count)}</strong>.
        This points the reading toward ${escapeHtml(lead.prompt)}.
      </p>
      <div class="reading-table">
        <table>
          <thead>
            <tr>
              <th>Family</th>
              <th>Gods</th>
              <th>Count</th>
              <th>Prompt</th>
            </tr>
          </thead>
          <tbody>
            ${families.map(family => `
              <tr>
                <td><strong>${escapeHtml(family.label)}</strong></td>
                <td>${family.gods.map(god => escapeHtml(formatGod(god))).join("<br>")}</td>
                <td>${escapeHtml(family.count)}</td>
                <td>${escapeHtml(family.prompt)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `);
  }

  function buildUsefulElement(chart) {
    const stats = elementStats(chart);
    const strongest = stats.strongest.map(item => `${item.elementEnglish} (${item.element})`).join(", ");
    const least = stats.least.map(item => `${item.elementEnglish} (${item.element})`).join(", ");

    return section("Useful-Element Direction", `
      <p>
        This is a directional hint, not a formal Yong Shen ruling. The static engine counts elements but does not evaluate every seasonal strength rule, luck cycle, or full classical structure.
      </p>
      <p>
        Based only on this chart count, the balancing direction starts with the quietest element: <strong>${escapeHtml(least)}</strong>.
        The strongest repeated material is <strong>${escapeHtml(strongest)}</strong>, so the reading treats it as familiar chart terrain that should be used with awareness.
      </p>
    `);
  }

  function buildRelationshipNotes(chart) {
    const families = familyStats(godStats(chart));

    return section("Relationship and Family-Role Notes", `
      <p>
        This section avoids fixed gendered predictions. It reads relationship dynamics through the counted Ten Archetype families: support, exchange, standards, expression, and peers.
      </p>
      <ul class="reading-list">
        ${families.map(family => `
          <li>
            <strong>${escapeHtml(family.label)} · count ${escapeHtml(family.count)}</strong>
            <br>In relationship reflection, this family points to ${escapeHtml(family.prompt)}.
          </li>
        `).join("")}
      </ul>
    `);
  }

  function buildCareerAndIndustry(chart) {
    const bazi = engine();
    const hourGod = chart.pillars[3].stemGod;
    const top = godStats(chart).filter(item => item.count > 0).slice(0, 3);

    return section("Career and Work Direction", `
      <p>
        The strongest career line in this browser reading comes from the Hour Stem: <strong>${escapeHtml(formatGod(hourGod))}</strong>.
        ${escapeHtml(bazi.careerByHourGod(hourGod))}
      </p>
      <p>
        The top repeated archetypes refine the work style:
        ${top.map(item => `${item.archetype} points to ${item.brief}`).map(escapeHtml).join("; ")}.
        Choose roles, industries, or projects that let these chart signals operate cleanly rather than forcing every strength into the same job shape.
      </p>
    `);
  }

  function buildNamingDirection(chart) {
    const stats = elementStats(chart);
    const least = stats.least.map(item => `${item.elementEnglish} (<span lang="zh-Hans">${item.element}</span>)`).join(", ");

    return section("Naming and Renaming Element Direction", `
      <p>
        For names, aliases, brands, or creative identities, this page gives only an element direction. The data-driven prompt is the least represented element:
        <strong>${least}</strong>.
      </p>
      <p>
        Treat this as a symbolic design direction rather than a rule. A name can gently invite the quieter element while still respecting sound, language, culture, and personal taste.
      </p>
    `);
  }

  function buildNayinDepth(chart) {
    return section("Nayin Depth Layer", `
      <p>
        Nayin is used here as a poetic layer attached to each stem-branch pair. It does not override the Day Master, Ten Archetypes, or element count; it adds image language to the same four pillars.
      </p>
      <ul class="reading-list">
        ${chart.pillars.map(pillar => `
          <li>
            <strong>${escapeHtml(pillar.nameEnglish)} · <span lang="zh-Hans">${escapeHtml(pillar.ganzhi)}</span> · ${escapeHtml(pillar.nayinEnglish)} (<span lang="zh-Hans">${escapeHtml(pillar.nayin)}</span>)</strong>
            <br>This Nayin image belongs to the ${escapeHtml(PILLAR_CONTEXT[pillar.name] || "pillar field")} and should be read beside ${escapeHtml(formatGod(pillar.stemGod))}.
          </li>
        `).join("")}
      </ul>
    `);
  }

  function buildReading(tier, chart) {
    const parts = [
      buildIntro(tier, chart),
      buildDayMasterSection(chart),
      buildPillarOverview(chart),
      buildTopArchetypes(chart),
      buildElementSnapshot(chart),
      buildCareerOneLine(chart)
    ];

    if (tier === "deep" || tier === "master") {
      parts.push(
        buildAllArchetypes(chart),
        buildElementDepth(chart),
        buildLifeStages(chart),
        buildCombos(chart),
        buildThreeYearPrompts(chart)
      );
    }

    if (tier === "master") {
      parts.push(
        buildStructure(chart),
        buildUsefulElement(chart),
        buildRelationshipNotes(chart),
        buildCareerAndIndustry(chart),
        buildNamingDirection(chart),
        buildNayinDepth(chart)
      );
    }

    parts.push(buildOutro());
    return parts.join("");
  }

  function missingChartHtml() {
    return `
      <article class="chart-required">
        <h2>Generate your chart first</h2>
        <p>
          Please use the free calculator first to generate your chart, then return here.
          <a href="calculator.html">Open Calculator</a>
        </p>
        <p>
          Your PayPal approval has been received in this browser session, but the reading engine needs the local BaZi chart saved by the calculator before it can write the report.
        </p>
      </article>
    `;
  }

  function showReadingHtml(html, options = {}) {
    const { hideOffers = true } = options;
    const offers = document.getElementById("reading-offers");
    const content = document.getElementById("reading-content");
    const body = document.getElementById("reading-content-body");

    if (offers && hideOffers) offers.hidden = true;
    if (content) content.hidden = false;

    if (!body) return;
    body.innerHTML = html;

    if (content) {
      content.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function revealReading(tier) {
    const bazi = engine();
    const chart = loadStoredChart();
    let html = "";

    if (!bazi || !chart) {
      html = missingChartHtml();
    } else {
      html = buildReading(tier, chart);
      saveReadingBackup({
        tier,
        source: sourceMeta(chart),
        generatedAt: new Date().toISOString(),
        html
      });
      syncRecoveryPanel();
    }

    showReadingHtml(html);
  }

  function setStatus(tier, message) {
    const status = document.getElementById(`paypal-status-${tier}`);
    if (status) status.textContent = message;
  }

  function renderPayPalButton(tier) {
    const paypal = window.paypal_sdk;
    const config = TIERS[tier];
    const selector = `#paypal-button-${tier}`;
    const target = document.querySelector(selector);

    if (!target) return;

    if (!paypal || typeof paypal.Buttons !== "function") {
      setStatus(tier, "PayPal checkout is temporarily unavailable. Please try again later.");
      return;
    }

    paypal.Buttons({
      style: {
        layout: "vertical",
        color: "gold",
        shape: "rect",
        label: "paypal",
        height: 45
      },
      createOrder: (data, actions) => actions.order.create({
        purchase_units: [{
          description: `${config.label} BaZi Reading`,
          custom_id: `mystic-east-${tier}`,
          payee: {
            email_address: "1131718642@qq.com"
          },
          amount: {
            currency_code: "USD",
            value: config.price
          }
        }]
      }),
      onApprove: (data, actions) => actions.order.capture().then(() => {
        setStatus(tier, "Payment approved. Opening your reading.");
        revealReading(tier);
      }),
      onCancel: () => {
        setStatus(tier, "Payment was cancelled before approval.");
      },
      onError: () => {
        setStatus(tier, "PayPal could not complete this checkout. Please try again.");
      }
    }).render(selector).catch(() => {
      setStatus(tier, "PayPal could not render this button. Refresh this page and try again.");
    });
  }

  function initPayPalButtons() {
    Object.keys(TIERS).forEach(renderPayPalButton);
  }

  function syncRecoveryPanel() {
    const panel = document.getElementById("reading-recovery");
    const meta = document.getElementById("reading-recovery-meta");
    const open = document.getElementById("reading-recovery-open");
    const download = document.getElementById("reading-recovery-download");
    const clear = document.getElementById("reading-recovery-clear");
    const backup = loadReadingBackup();

    if (!panel || !meta || !open || !download || !clear) return;

    if (!backup) {
      panel.hidden = true;
      meta.textContent = "";
      return;
    }

    panel.hidden = false;
    meta.textContent = backupMetaText(backup);
    open.onclick = () => showReadingHtml(backup.html, { hideOffers: false });
    download.onclick = () => downloadBackup(backup);
    clear.onclick = () => {
      clearReadingBackup();
      syncRecoveryPanel();
    };
  }

  function initPrintButton() {
    document.addEventListener("click", event => {
      const button = event.target.closest("[data-print-reading]");
      if (!button) return;
      window.print();
    });
  }

  function init() {
    initPayPalButtons();
    initPrintButton();
    syncRecoveryPanel();
  }

  window.MysticReadingEngine = {
    TIERS,
    loadStoredChart,
    buildReading,
    revealReading,
    init
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
