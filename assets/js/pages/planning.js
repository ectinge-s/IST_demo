/* ═══════════════════════════════════════════
   PLANNING PAGE
═══════════════════════════════════════════ */
const INDUSTRIES = [
  { id:'internet', name:'互联网科技',   num:'01', acad:'用户体验与人机智能',    acadEn:'UX & Human-Computer Intelligence',
    scope:'互联网大厂 · SaaS工具 · AI产品与大模型 · 数字化平台' },
  { id:'hardware', name:'智能实体产业', num:'02', acad:'工业工程与智能制造',    acadEn:'Industrial Systems & Intelligent Manufacturing',
    scope:'智能手机与OS · 新能源汽车座舱 · 机器人 · IoT智能家居' },
  { id:'culture',  name:'数字文化娱乐', num:'03', acad:'叙事交互与沉浸体验',    acadEn:'Narrative Experience & Immersive Media',
    scope:'互动游戏 · 沉浸式装置 · 演出科技与舞台 · 影视XR制作' },
  { id:'brand',    name:'品牌与服务',   num:'04', acad:'社会创新与产品策略',    acadEn:'Social Innovation & Product Strategy',
    scope:'设计咨询 · 广告创意 · 教育科技 · 医疗健康 · 企业数字化' },
  { id:'arch',     name:'建筑环境科技', num:'05', acad:'空间设计与智能环境',    acadEn:'Spatial Design & Intelligent Environments',
    scope:'建筑设计院 · 景观与城市设计 · 智慧建造 · 数字孪生城市' },
];

// Geometric line glyphs per industry (2px stroke, currentColor) — brand-consistent iconography
const IND_ICONS = {
  internet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="4" r="1.7"/><circle cx="5" cy="18" r="1.7"/><circle cx="19" cy="18" r="1.7"/><path d="M12 9V5.7M10 14l-3.4 2.7M14 14l3.4 2.7"/></svg>',
  hardware: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="7" width="10" height="10" rx="1.5"/><rect x="10" y="10" width="4" height="4" rx=".5"/><path d="M10 7V4.2M14 7V4.2M10 19.8V17M14 19.8V17M7 10H4.2M7 14H4.2M19.8 10H17M19.8 14H17"/></svg>',
  culture:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="14" rx="2"/><path d="M10.5 9.4l4.2 2.6-4.2 2.6z"/></svg>',
  brand:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".9" fill="currentColor" stroke="none"/></svg>',
  arch:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 20h17"/><rect x="6" y="9" width="5" height="11"/><rect x="13" y="5" width="5" height="15"/><path d="M8 12.2h1M8 15.2h1M15 8.2h1M15 11.2h1M15 14.2h1"/></svg>',
};

const PlanningPage = {
  build() {
    this._buildNav();
    this._buildSections();
    ScrollSpy.init();
    this._initRailCollapse();
  },

  _buildNav() {
    const nav = document.getElementById('industry-nav');
    nav.innerHTML = INDUSTRIES.map((ind, i) => `
      <button class="industry-nav__btn${i===0?' is-active':''}"
              id="nav-${ind.id}"
              onclick="Router.goToIndustry('${ind.id}')">
        <span class="ind-ico">${IND_ICONS[ind.id]||''}</span>
        <span class="ind-meta">
          <span class="ind-num">${ind.num}</span>
          <span class="ind-name">${ind.name}</span>
          <span class="ind-acad">${ind.acad}</span>
          <span class="ind-acad-en">${ind.acadEn}</span>
        </span>
        <span class="ind-arrow">→</span>
      </button>`).join('');
  },

  _initRailCollapse() {
    const nav = document.getElementById('industry-nav');
    if (!nav) return;
    const navbarH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--navbar-h'), 10) || 56;
    // A 1px sentinel sits just above the rail. While it stays below the navbar
    // line the rail shows full cards; once it scrolls past (rail pins) → collapse.
    // IntersectionObserver fires on the display:none → visible transition too, so
    // arriving on the page at the top always resolves to the expanded state.
    let sentinel = document.getElementById('industry-nav-sentinel');
    if (!sentinel) {
      sentinel = document.createElement('div');
      sentinel.id = 'industry-nav-sentinel';
      sentinel.setAttribute('aria-hidden', 'true');
      sentinel.style.cssText = 'height:1px;width:100%;pointer-events:none;';
      nav.parentNode.insertBefore(sentinel, nav);
    }
    if (this._railIO) this._railIO.disconnect();
    this._railIO = new IntersectionObserver((entries) => {
      entries.forEach(e => nav.classList.toggle('is-collapsed', !e.isIntersecting));
    }, { rootMargin: `-${navbarH + 1}px 0px 0px 0px`, threshold: 0 });
    this._railIO.observe(sentinel);
  },

  _buildSections() {
    const container = document.getElementById('industry-sections');
    const taxo = DATA.taxonomy;

    container.innerHTML = INDUSTRIES.map(ind => {
      const t = taxo[ind.name] || {};
      const intro = t.industry_subfields ? t.industry_subfields.join('，') : '';
      // intro text from taxonomy subfields or fallback
      const introText = (t.legacy_subdirections || []).slice(0,3).join(' · ');

      // Companies for this industry (all entries, may have duplicates per company)
      const companies = DATA.careers.filter(c => c.industry === ind.name);
      const tiers = [...new Set(companies.map(c => c.tier))];

      // Deduplicated company list for tags (max 20 unique companies)
      const uniqueCompanies = [];
      const seenCompanies = new Set();
      for (const c of companies) {
        if (!seenCompanies.has(c.company)) {
          seenCompanies.add(c.company);
          uniqueCompanies.push(c);
        }
        if (uniqueCompanies.length >= 25) break;
      }

      // Job directions — deduplicated by direction_zh
      const directions = [...new Map(companies.map(c => [c.direction_zh, c])).values()];

      // Core skills from taxonomy
      const skills = (t.legacy_subdirections || []).concat(t.new_subdirections || []);

      // School match partial — use first direction as default context for section header
      const defaultDir = directions[0] ? directions[0].direction_zh : '';
      const schoolPicks = Schools.pickForSidebar(ind.id, 3, defaultDir, '');

      const copy = PlanningPage._getIntro(ind.id);
      return `
      <div class="industry-section" id="sec-${ind.id}">
        <div class="industry-section__header">
          <span class="industry-section__num">${ind.num}</span>
          <div style="flex:1">
            <div class="industry-section__title">${ind.name}<span class="industry-section__acad">— ${ind.acad}</span></div>
            <div class="industry-section__scope">${ind.scope}</div>
          </div>
          <div class="cv-actions">
            <button class="cv-btn cv-btn--primary" onclick="ImageModal.open('assets/img/cv_journey/${ind.id}.png','${ind.name} 求职旅程')">成功求职案例 →</button>
            <button class="cv-btn cv-btn--secondary" onclick="Router.goToPortfolioFilter('${ind.acad}')">优秀作品集 →</button>
          </div>
        </div>

        <div class="industry-section__intro" id="intro-wrap-${ind.id}">
          <p class="intro-short">${copy.short}</p>
          <div class="intro-full" id="intro-full-${ind.id}" style="display:none;">
            ${copy.full}
            <div class="intro-tags">
              <div class="intro-tag-row">
                <span class="intro-tag-label">核心学术方向</span>
                <span>${copy.skills}</span>
              </div>
              <div class="intro-tag-row">
                <span class="intro-tag-label">代表升学项目</span>
                <span>${copy.programs}</span>
              </div>
            </div>
          </div>
          <button class="intro-expand-btn" onclick="PlanningPage.toggleIntro('${ind.id}',this)">
            展开详情 <span class="intro-expand-arrow">↓</span>
          </button>
        </div>

        <div class="industry-cols">
          <!-- Col 1: Companies -->
          <div class="industry-col">
            <div class="industry-col__label">就业企业</div>
            <div class="company-filter" id="cfilter-${ind.id}">
              <button class="company-filter__btn is-active" data-tier="all"
                      onclick="PlanningPage.filterTier('${ind.id}','all',this)">全部</button>
              ${tiers.map(t => `
                <button class="company-filter__btn" data-tier="${t}"
                        onclick="PlanningPage.filterTier('${ind.id}','${t}',this)">${t}</button>`).join('')}
            </div>
            <div class="company-tag-cloud" id="colist-${ind.id}">
              ${uniqueCompanies.map(c => `
                <span class="company-tag" data-tier="${c.tier}"
                      onclick="PlanningPage.openCompanyGroupSidebar('${ind.name.replace(/'/g,"\\'")}','${c.company.replace(/'/g,"\\'")}')">
                  ${c.company}
                </span>`).join('')}
            </div>
          </div>

          <!-- Col 2: Job directions -->
          <div class="industry-col">
            <div class="industry-col__label">岗位方向</div>
            <ul class="job-dir-list">
              ${directions.map(c => `
                <li class="job-dir-list__item"
                    onclick="PlanningPage.openJobSidebar('${ind.id}','${c.direction_zh.replace(/'/g,"\\'")}')">
                  <span>${c.direction_zh}</span>
                  <span class="job-dir-list__item-en">${c.direction_en}</span>
                  <span class="job-dir-list__count">${companies.filter(x=>x.direction_zh===c.direction_zh).length}</span>
                </li>`).join('')}
            </ul>
          </div>

          <!-- Col 3: Core skills -->
          <div class="industry-col">
            <div class="industry-col__label">核心学术方向</div>
            <div class="skill-tags" style="margin-bottom:16px;">
              ${(t.legacy_subdirections||[]).map((s,i) =>
                `<span class="skill-tag${i<3?' skill-tag--key':''}">${s}</span>`
              ).join('')}
              ${(t.new_subdirections||[]).slice(0,4).map(s =>
                `<span class="skill-tag">${s}</span>`
              ).join('')}
            </div>
            <div class="industry-col__label">常用工具</div>
            <div class="skill-tags">
              ${(t.tools_hint||[]).map(s =>
                `<span class="skill-tag">${s}</span>`
              ).join('')}
            </div>
          </div>
        </div>

        <!-- School match area -->
        <div class="school-match-area">
          <div class="school-match-area__header">
            <div class="school-match-area__title">代表性可匹配院校</div>
            <div class="school-match-area__actions">
              <div class="country-pills" id="cpills-${ind.id}">
                ${[['US','🇺🇸 美国'],['UK','🇬🇧 英国'],['HK_SG','🇭🇰 港新'],['OTHER','🌏 其他']].map((g,i) =>
                  `<button class="country-pill${i===0?' is-active':''}" data-group="${g[0]}"
                           onclick="PlanningPage.switchCountry('${ind.id}','${g[0]}',this)">${g[1]}</button>`
                ).join('')}
              </div>
              <button class="school-match-area__view-all"
                      onclick="PlanningPage.openFullSchoolSidebar('${ind.id}', document.querySelector('#cpills-${ind.id} .country-pill.is-active')?.dataset.group || 'US')">
                查看全部 →
              </button>
            </div>
          </div>
          ${['US','UK','HK_SG','OTHER'].map((g,i) => `
            <div class="school-country-panel${i===0?'':' u-visually-hidden'}" id="sgrid-${ind.id}-${g}">
              ${this._renderSchoolGrid(ind.id, g, schoolPicks)}
            </div>`).join('')}
        </div>
      </div>`;
    }).join('');
  },

  _getIntro(indId) {
    const COPY = {
      internet: {
        short: '你每天打开的 APP、调用的 AI 助手、甚至戴在脸上的 XR 眼镜，背后都有一套被精心设计的"使用感受"。这不是偶然——它来自一批专门研究"人与技术如何交互"的设计师和研究员的工作成果。',
        full: '<p><strong>用户体验与人机智能方向</strong>，是目前全球吸纳"艺术 × 科技"交叉人才规模最大、增速最快的赛道。随着 AI 从工具变成产品的核心，行业对设计师的要求早已超越界面美观：你需要理解用户的认知模型、能设计 AI 交互的反馈逻辑、会用数据验证设计假设，还要能用 Figma 之外的工具快速搭出可测试的原型。</p><p>对标企业从 Meta、Google、Apple 的空间计算团队，到 DeepSeek、Anthropic 的 AI 产品组，再到字节跳动、阿里巴巴、腾讯的核心 UX 部门——这条赛道的岗位在全球范围内持续增长，且向具备研究能力与技术素养的复合背景人才显著倾斜。</p>',
        skills: '人机交互（HCI）· 交互设计 · 认知心理学 · AI 设计 · 计算机图形学',
        programs: 'CMU MHCI · MIT Media Lab · UCL HCI · RCA Information Experience Design · NYU ITP',
      },
      hardware: {
        short: '手机、汽车、机器人、智能家居——这些产品之间的竞争差距，越来越不取决于硬件参数，而取决于"用起来有多顺手、多聪明"。智能实体产业，是将交互设计能力延伸进真实物理世界的赛道。',
        full: '<p><strong>工业工程与智能制造方向</strong>，聚焦于有形产品的交互体验设计：从操作系统级的 UI 动效规范，到多屏融合的智能座舱 HMI，再到具备自主行为的人形机器人交互界面——每一个层次都需要兼懂工业结构逻辑、用户感知规律和实时系统约束的设计师。</p><p>中国是目前全球智能终端、新能源汽车与机器人产业增长最快的市场。小米、理想、蔚来、小鹏、宇树等企业正以惊人速度扩张设计团队；华为、OPPO、vivo 的系统级交互设计岗位需求稳定且待遇领先。随着出海战略推进，对双语和国际视野人才的需求正持续上升——这条赛道的国内就业确定性，在五大方向中最高。</p>',
        skills: '工业设计 · 交互设计 · 人因工程 · 认知心理学 · 设计工程',
        programs: 'RCA Design Products · RISD Industrial Design · IC+RCA IDE · TU Delft Design for Interaction · Georgia Tech Human Factors',
      },
      culture: {
        short: '观众正在从"被动观看"变成"主动参与"。一场演唱会的实时 XR 舞台、一座美术馆里触摸即可改变的数字装置、一款让你在游戏里真正迷失的沉浸叙事世界——这些体验的背后，是创意、技术与空间三种能力的高度融合。',
        full: '<p><strong>叙事交互与沉浸体验方向</strong>，是目前创意自由度与技术含量并重的赛道。从 teamLab 的全球互动艺术装置、米哈游的游戏视觉研发，到蔡国强工作室的国际大型装置制作、黑弓 Blackbow 的沉浸式文旅项目——这条赛道的从业者需要能用 TouchDesigner 写实时互动逻辑、能主导一场展览的空间叙事策划，甚至能作为创意技术专家连接导演意图与工程实现。</p><p>这条赛道的特点是：<strong>作品集决定一切</strong>。课程期间的创作积累、参与艺术节和展览的实战经历，比任何资格证书都更有说服力。它与演出、影视、游戏等成熟产业紧密相连，岗位稳定性与创作自由度兼而有之。</p>',
        skills: '创意编程 · 新媒体艺术 · 交互设计 · 游戏设计 · 舞台 / 空间设计 · 计算机图形学',
        programs: 'NYU ITP / Game Center · RCA Digital Direction · CMU Entertainment Technology · Goldsmiths Computational Arts · UCLA DMA',
      },
      brand: {
        short: '当一个问题复杂到无法用单一产品解决，就需要服务设计——把用户从接触品牌的第一秒到完成体验的最后一步，整体设计成一个有逻辑、有温度的过程。这条赛道横跨设计咨询、广告创意与企业数字化服务，共同的要求是：能看懂全局、会讲策略、能推动多方协作落地。',
        full: '<p><strong>社会创新与产品策略方向</strong>，培养的是设计中的"策略型人才"。在 IDEO、frog 这样的顶级设计咨询公司，你需要同时具备用户研究的严谨性、品牌叙事的感染力和前端原型的实现能力；在麦肯锡设计或奥美，你的设计方案需要能被高管听懂、被工程团队执行、被用户真实喜欢。</p><p>随着企业 AI 服务化与品牌体验数字化的浪潮，这类具备策略思维的设计人才正从"高级加分项"变成"核心刚需"。这条赛道的毕业生路径宽阔：可以是设计师，可以是产品经理，也可以是在咨询公司为财富 500 强制定创新策略的设计顾问。</p>',
        skills: '服务设计 · 交互设计 · 设计管理 · 创意技术 · 设计策略',
        programs: 'RCA Service Design · RCA Global Innovation Design · TU Delft Design for Interaction · CMU MHCI · UCL Design & Innovation',
      },
      arch: {
        short: '建筑与空间设计行业正在经历一场比多数人预期更彻底的转型。传统建筑师的工作方式正被参数化设计、BIM 协同与城市数据分析重塑；而"空间如何与人互动"这个命题，从品牌旗舰店到国家文化遗产的数字化保护，都在呼唤兼备空间素养与数字技术能力的新型设计师。',
        full: '<p><strong>空间设计与智能环境方向</strong>，覆盖从顶尖国际建筑事务所到中国国家级城市规划院的完整就业图谱。在 ZHA 或 BIG，你需要用 Grasshopper 生成参数化形态；在 Gensler，你需要用行为数据驱动商业空间策略；在中国城市规划设计研究院，你需要用 GIS 与数字孪生工具参与国土空间规划；在 KKAA 或如恩，你需要对材料工艺与文化叙事有独立而深刻的理解。</p><p>这条赛道与国家城镇化战略、智慧城市建设和文化遗产数字化保护高度绑定，在技术升级周期内具有稳定的长期需求。对于有建筑学、城市规划或景观设计背景，同时希望将数字技术能力融入创作实践的学生，这是一条兼具深度与广度的职业路径。</p>',
        skills: '计算设计 · 建筑 / 景观设计 · 城市设计 · 数据可视化 · 可持续设计',
        programs: 'Harvard GSD · Columbia GSAPP · UCL Bartlett · MIT SMArchS Computation · ETH Zürich Architecture',
      },
    };
    return COPY[indId] || { short:'', full:'', skills:'', programs:'' };
  },

  _renderSchoolGrid(indId, group, picks) {
    const groupPicks = picks[group] || [];
    if (!groupPicks.length) {
      return `<div class="school-grid__placeholder">该地区数据建设中，请联系升学顾问获取定制匹配方案</div>`;
    }
    return `<div class="school-grid">
      ${groupPicks.map(s => `
        <div class="school-grid-card">
          <div class="school-grid-card__name">
            ${s.school_en} <span class="zh">${s.school_zh}</span>
          </div>
          <div class="school-grid-card__progs">
            <div class="school-grid-card__prog"
                 onclick="window.open('${s.prog.program_url || 'https://www.google.com/search?q=' + encodeURIComponent(s.school_en + ' ' + s.prog.program_name_en)}','_blank')">
              ${s.prog.program_name_en || s.prog.program_name_zh}
            </div>
            <div class="school-grid-card__meta">
              ${s.prog.program_name_zh || ''}
            </div>
          </div>
        </div>`).join('')}
    </div>`;
  },

  switchCountry(indId, group, btn) {
    document.querySelectorAll(`#cpills-${indId} .country-pill`).forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    document.querySelectorAll(`[id^="sgrid-${indId}-"]`).forEach(p => p.classList.add('u-visually-hidden'));
    const panel = document.getElementById(`sgrid-${indId}-${group}`);
    if (panel) {
      panel.classList.remove('u-visually-hidden');
      // Lazy-render if not yet rendered
      if (!panel.dataset.rendered) {
        const picks = Schools.pickForSidebar(indId, 3, panel.dataset.roleText || '', panel.dataset.companyText || '');
        panel.innerHTML = this._renderSchoolGrid(indId, group, picks);
        panel.dataset.rendered = '1';
      }
    }
  },

  openFullSchoolSidebar(indId, group) {
    const ind = INDUSTRIES.find(i => i.id === indId);
    const GROUPS = [['US','🇺🇸 美国'],['UK','🇬🇧 英国'],['HK_SG','🇭🇰 港新'],['OTHER','🌏 其他']];
    const activeGroup = group || 'US';

    const tabs = GROUPS.map(([g, label]) =>
      `<button class="country-tab${g===activeGroup?' is-active':''}"
               onclick="Tabs.switchCountrySidebar('${g}',this)">${label}</button>`
    ).join('');

    const panels = GROUPS.map(([g]) => `
      <div class="country-tab-panel${g===activeGroup?' is-active':''}" data-group="${g}">
        ${Schools.renderFullList(indId, g, '', '')}
      </div>`).join('');

    Sidebar.open(`
      <div class="sidebar__header">
        <div class="sidebar__eyebrow">${ind.name} · 院校匹配</div>
        <div class="sidebar__title">可匹配院校专业</div>
        <div class="sidebar__subtitle">${ind.acad}</div>
      </div>
      <div class="sidebar__body">
        <div class="country-tabs">${tabs}</div>
        ${panels}
      </div>`);
  },

  openCompanyGroupSidebar(industryName, companyName) {
    const IND_ID = {'互联网科技':'internet','智能实体产业':'hardware','数字文化娱乐':'culture','品牌与服务':'brand','建筑环境科技':'arch'};
    const jobs = DATA.careers.filter(c => c.industry === industryName && c.company === companyName);
    if (!jobs.length) return;
    const first = jobs[0];
    const indId = IND_ID[industryName] || 'internet';
    const jobContext = jobs.map(j => j.direction_zh).join(' ');
    const schoolPicks = Schools.pickForCompany(indId, 10, jobContext, companyName);

    const jobsHtml = jobs.map((c, i) => `
      <div class="sidebar__job-entry${i > 0 ? ' sidebar__job-entry--divider' : ''}">
        <div class="sidebar__section">
          <p style="font-weight:600;margin:0 0 2px">${c.job_title_zh}</p>
          <p style="font-size:12px;color:var(--color-text-muted);margin:0 0 4px">${c.job_title_en}</p>
          ${c.department ? `<p style="font-size:12px;color:var(--color-text-muted);">${c.department}</p>` : ''}
        </div>
        <div class="sidebar__section">
          <div class="sidebar__section-label">岗位职责</div>
          <p>${c.responsibilities}</p>
        </div>
        <div class="sidebar__section">
          <div class="sidebar__section-label">人才要求</div>
          <p>${c.talent_summary}</p>
        </div>
        ${c.tools ? `
        <div class="sidebar__section">
          <div class="sidebar__section-label">核心工具</div>
          <div class="sidebar__tags">${c.tools.split(/[,，、]/).map(t=>t.trim()).filter(Boolean)
            .map(t=>`<span class="sidebar__tag">${t}</span>`).join('')}</div>
        </div>` : ''}
        <div class="sidebar__section">
          <div class="sidebar__section-label">薪资参考</div>
          <span class="salary-badge">${c.salary_usd}</span>
          ${c.career_path ? `<p style="font-size:12px;color:var(--color-text-muted);margin-top:6px;">${c.career_path}</p>` : ''}
        </div>
      </div>`).join('<hr class="sidebar__divider">');

    Sidebar.open(`
      <div class="sidebar__header">
        <div class="sidebar__eyebrow">${industryName} · ${first.tier}</div>
        <div class="sidebar__title">${companyName}</div>
        <div class="sidebar__subtitle">${jobs.length > 1 ? jobs.length + ' 个岗位方向' : first.department}</div>
      </div>
      <div class="sidebar__body">
        ${jobsHtml}
        <hr class="sidebar__divider">
        <div class="sidebar__section">
          <div class="sidebar__section-label">代表性学历背景</div>
          ${Schools._renderFlat(schoolPicks)}
        </div>
      </div>`);
  },

  openCompanySidebar(c) {
    if (!c) return;
    this.openCompanyGroupSidebar(c.industry, c.company);
  },

  openJobSidebar(indId, directionZh) {
    const ind = INDUSTRIES.find(i => i.id === indId);
    const jobs = DATA.careers.filter(c => c.direction_zh === directionZh && c.industry === ind.name);
    const job = jobs[0] || {};
    const companyContext = jobs.map(j => j.company).join(' ');
    const roleContext = [directionZh, job.direction_en || '', jobs.map(j => j.responsibilities || '').join(' ')].join(' ');
    const schoolPicks = Schools.pickForJob(indId, roleContext, companyContext);
    const dirEn = job.direction_en || '';
    Sidebar.open(`
      <div class="sidebar__header">
        <div class="sidebar__eyebrow">${ind.name}</div>
        <div class="sidebar__title">${directionZh}</div>
        <div class="sidebar__subtitle">${dirEn}</div>
      </div>
      <div class="sidebar__body">
        ${job.responsibilities ? `
          <div class="sidebar__section">
            <div class="sidebar__section-label">典型职责</div>
            <p>${job.responsibilities}</p>
          </div>` : ''}
        ${job.tools ? `
          <div class="sidebar__section">
            <div class="sidebar__section-label">核心工具</div>
            <div class="sidebar__tags">${job.tools.split(/[,，、]/).map(t=>t.trim()).filter(Boolean)
              .map(t=>`<span class="sidebar__tag">${t}</span>`).join('')}</div>
          </div>` : ''}
        <hr class="sidebar__divider">
        <div class="sidebar__section">
          <div class="sidebar__section-label">代表性可匹配专业</div>
          ${Schools._renderFlat(schoolPicks)}
        </div>
      </div>`);
  },

  toggleIntro(indId, btn) {
    const full = document.getElementById('intro-full-' + indId);
    const isOpen = full.style.display !== 'none';
    full.style.display = isOpen ? 'none' : 'block';
    btn.innerHTML = isOpen
      ? '展开详情 <span class="intro-expand-arrow">↓</span>'
      : '收起 <span class="intro-expand-arrow">↑</span>';
  },

  filterTier(indId, tier, btn) {
    document.querySelectorAll(`#cfilter-${indId} .company-filter__btn`).forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    document.querySelectorAll(`#colist-${indId} .company-tag`).forEach(tag => {
      if (tier === 'all') { tag.classList.remove('is-active','is-dimmed'); }
      else if (tag.dataset.tier === tier) { tag.classList.add('is-active'); tag.classList.remove('is-dimmed'); }
      else { tag.classList.add('is-dimmed'); tag.classList.remove('is-active'); }
    });
  },
};
window.PlanningPage = PlanningPage;
