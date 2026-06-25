/* ═══════════════════════════════════════════
   COMPONENTS — sidebar, search, scroll spy
═══════════════════════════════════════════ */

/* ── SIDEBAR ── */
const Sidebar = {
  open(html) {
    document.getElementById('sidebar-content').innerHTML = html;
    document.getElementById('sidebar').classList.add('is-open');
    document.getElementById('sidebar-overlay').classList.add('is-open');
    document.body.style.overflow = 'hidden';
  },
  close() {
    document.getElementById('sidebar').classList.remove('is-open');
    document.getElementById('sidebar-overlay').classList.remove('is-open');
    document.body.style.overflow = '';
  },
};

/* ── PROGRAM SCORING ENGINE ── */
const ProgramScorer = {
  // Topic keyword sets — checked against program name + college name
  TOPICS: {
    ux:          ['interaction','user experience','ux','hci','human-computer','human computer','交互','用户体验','人机交互'],
    product:     ['product design','product development','integrated product','产品设计','产品开发','工业设计'],
    service:     ['service design','服务设计'],
    research:    ['design studies','design research','设计研究','design thinking'],
    digital:     ['digital media','media design','数字媒体','new media','数字'],
    ai:          ['artificial intelligence','machine learning','computational','智能','人工智能','数据','data science'],
    tech:        ['technology','innovation','engineering design','科技','技术创新'],
    game:        ['game','entertainment design','游戏','entertainment technology'],
    xr:          ['xr','vr ','ar ','immersive','mixed reality','extended reality','沉浸','虚拟现实','增强现实'],
    brand:       ['brand','communication design','graphic design','visual communication','品牌','视觉传达','平面设计'],
    media:       ['media','communication','advertising','传播','媒体','广告'],
    film:        ['film','screen','motion','影视','电影','舞台','戏剧','剧场','演出','布景','scenic','theatre','theater','stage design','production design'],
    animation:   ['animation','motion design','动画'],
    arch:        ['architecture','建筑','architectural'],
    space:       ['spatial design','space design','interior design','室内设计','空间设计','布展','陈列','空间叙事','展陈','动线','空间呈现'],
    landscape:   ['landscape','景观'],
    urban:       ['urban','city design','planning','城市规划','urban design','城市设计'],
    sustainable: ['sustainable','sustainability','可持续','environmental'],
    parametric:  ['parametric','computational design','参数化','digital fabrication','bim','数字化交付','正向设计'],
    industrial:  ['industrial design','product engineering','工业设计','设计工程'],
    engineering: ['engineering','mechatronics','工程','机械'],
    social:      ['social innovation','social design','社会创新','social impact'],
    fashion:     ['fashion','textile','时尚','服装'],
    creative:    ['creative technology','creative computing','创意科技'],
    visual:      ['visual art','fine art','visual design','视觉艺术','纯艺','当代艺术','艺术展','展览设计','curator','exhibition','gallery','美术馆','策展'],
    strategy:    ['strategy','management','innovation management','策略','管理'],
  },

  // Industry → relevant topic clusters
  IND_TOPICS: {
    internet: ['ux','product','digital','ai','tech','service','research'],
    hardware: ['industrial','engineering','product','tech','ai','parametric','ux'],
    culture:  ['game','xr','animation','film','digital','media','creative','visual'],
    brand:    ['brand','media','visual','creative','social','service','strategy'],
    arch:     ['arch','space','urban','landscape','parametric','sustainable','industrial'],
  },

  extractTopics(text) {
    const t = text.toLowerCase();
    const found = new Set();
    for (const [topic, kws] of Object.entries(this.TOPICS)) {
      if (kws.some(kw => t.includes(kw))) found.add(topic);
    }
    return found;
  },

  // Score a single program against role context
  // primary_tags define the core identity — high weight, prevents擦边 programs from winning
  // secondary_tags are real but supporting — low weight, only lift programs already near the top
  score(prog, roleText, companyText, industryId) {
    const primary   = new Set(prog.primary_tags   || prog.keyword_tags || []);
    const secondary = new Set(prog.secondary_tags || []);
    const targetTopics = this.extractTopics(roleText + ' ' + companyText);
    const indTopics = new Set(this.IND_TOPICS[industryId] || []);

    // Primary hits — must match core identity of the program
    const primaryRoleHits = [...targetTopics].filter(t => primary.has(t)).length;
    const primaryIndHits  = [...indTopics].filter(t => primary.has(t)).length;
    // Secondary hits — supporting signal, lower weight
    const secRoleHits = [...targetTopics].filter(t => secondary.has(t)).length;
    const secIndHits  = [...indTopics].filter(t => secondary.has(t)).length;
    // Industry tag in candidate pool
    const tagBonus = (prog.industry_tags || []).includes(industryId) ? 10 : 0;
    // Prestige — higher weight so name schools win when primary match is equal
    const prestige = (prog.prestige_score || 55) * 0.5;

    return primaryRoleHits * 40 + prestige + primaryIndHits * 12
         + secRoleHits * 8 + secIndHits * 4 + tagBonus;
  },

  // Return top N programs scored for a role, one per school, grouped by country group
  topByGroup(roleText, companyText, industryId, maxPerGroup = 3) {
    const programs = DATA.programs.filter(p => (p.industry_tags || []).includes(industryId));
    const groups = ['US','UK','HK_SG','OTHER'];
    const result = {};

    groups.forEach(group => {
      const countryList = DATA.school_priority._meta.country_groups[group];
      const inGroup = programs.filter(p => countryList.includes(p.country));
      // Score and sort
      const scored = inGroup
        .map(p => ({ p, score: this.score(p, roleText, companyText, industryId) }))
        .sort((a, b) => b.score - a.score);
      // One per school, top N
      const usedSchools = new Set();
      const picks = [];
      for (const { p } of scored) {
        if (picks.length >= maxPerGroup) break;
        const key = p.school_en || p.school_zh;
        if (!usedSchools.has(key)) {
          usedSchools.add(key);
          picks.push({ school_en: p.school_en, school_zh: p.school_zh, prog: p });
        }
      }
      result[group] = picks;
    });
    return result;
  },

  // Country quota: how many schools to show per country group in flat rec lists
  // Total should add up to the desired max (10)
  COUNTRY_QUOTA: { US: 4, UK: 4, HK_SG: 2, OTHER: 0 },

  // Return flat top N across countries respecting COUNTRY_QUOTA, one school per slot, best program per school
  topFlat(roleText, companyText, industryId, total = 10) {
    const programs = DATA.programs.filter(p => (p.industry_tags || []).includes(industryId));
    const groups = DATA.school_priority._meta.country_groups;
    const picks = [];

    for (const [group, quota] of Object.entries(this.COUNTRY_QUOTA)) {
      if (quota <= 0) continue;
      const countryList = groups[group] || [];
      const inGroup = programs.filter(p => countryList.includes(p.country));
      const scored = inGroup
        .map(p => ({ p, score: this.score(p, roleText, companyText, industryId) }))
        .sort((a, b) => b.score - a.score);
      const usedSchools = new Set();
      let taken = 0;
      for (const { p } of scored) {
        if (taken >= quota) break;
        const key = p.school_en || p.school_zh;
        if (!usedSchools.has(key)) {
          usedSchools.add(key);
          picks.push({ school_en: p.school_en, school_zh: p.school_zh, prog: p });
          taken++;
        }
      }
    }
    return picks;
  },

  // Return top schools for a group, one best-matching program per school, max maxSchools schools
  topForGroup(roleText, companyText, industryId, group, maxSchools = 10) {
    const countryList = DATA.school_priority._meta.country_groups[group] || [];
    const programs = DATA.programs.filter(p =>
      (p.industry_tags || []).includes(industryId) && countryList.includes(p.country)
    );
    // Score every program, then group by school keeping only the best program per school
    const schoolMap = {};
    programs.forEach(p => {
      const key = p.school_en || p.school_zh;
      const s = this.score(p, roleText, companyText, industryId);
      if (!schoolMap[key] || s > schoolMap[key].score) {
        schoolMap[key] = { school_en: p.school_en, school_zh: p.school_zh, prog: p, score: s };
      }
    });
    return Object.values(schoolMap)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSchools);
  },
};

/* ── SCHOOL HELPERS ── */
const Schools = {
  groupOf(country) {
    if (country === 'US') return 'US';
    if (country === 'UK') return 'UK';
    if (country === 'HK' || country === 'SG') return 'HK_SG';
    return 'OTHER';
  },

  // Shared item renderer — shows school name + program EN name + program ZH name
  _itemHtml(school_en, school_zh, p) {
    const url = p.program_url || 'https://www.google.com/search?q=' + encodeURIComponent((school_en||school_zh||'') + ' ' + (p.program_name_en||''));
    return `
      <div class="school-list-item">
        <div class="school-list-item__name">${school_en || school_zh} <span class="zh">${school_zh}</span></div>
        <div class="school-list-item__prog" onclick="window.open('${url}','_blank')" style="cursor:pointer">
          ${p.program_name_en || p.program_name_zh}
        </div>
        <div class="school-list-item__meta">${p.program_name_zh || ''}</div>
      </div>`;
  },

  // Render a flat list of school picks (used by both company + job sidebars)
  _renderFlat(picks) {
    if (!picks.length) return `<p class="u-muted" style="padding:16px 0;font-size:13px;">暂无数据</p>`;
    return `<div class="school-list">${picks.map(s => this._itemHtml(s.prog.school_en, s.prog.school_zh, s.prog)).join('')}</div>`;
  },

  // Role-aware flat list for company sidebar (10 schools, quota by country)
  pickForCompany(industryId, total = 10, roleText = '', companyText = '') {
    return ProgramScorer.topFlat(roleText, companyText, industryId, total);
  },

  // Role-aware flat list for job sidebar (same format, same quota)
  pickForJob(industryId, roleText = '', companyText = '') {
    return ProgramScorer.topFlat(roleText, companyText, industryId, 10);
  },

  // For the country-tabbed "可匹配院校专业" full view — ALL programs for industry,
  // grouped by school, schools sorted by best program score, all programs shown per school
  renderFullList(industryId, group, roleText = '', companyText = '') {
    const countryList = DATA.school_priority._meta.country_groups[group] || [];
    const programs = DATA.programs.filter(p =>
      (p.industry_tags || []).includes(industryId) && countryList.includes(p.country)
    );
    if (!programs.length) return `<p class="u-muted" style="padding:16px 0;font-size:13px;">暂无数据</p>`;

    // Group by school, score each program
    const schoolMap = {};
    programs.forEach(p => {
      const key = p.school_en || p.school_zh;
      if (!schoolMap[key]) schoolMap[key] = { school_en: p.school_en, school_zh: p.school_zh, progs: [], topScore: 0 };
      const s = ProgramScorer.score(p, roleText, companyText, industryId);
      schoolMap[key].progs.push({ p, s });
      if (s > schoolMap[key].topScore) schoolMap[key].topScore = s;
    });

    // Sort schools by top score, then programs within each school by score
    const sorted = Object.values(schoolMap).sort((a, b) => b.topScore - a.topScore);

    return `<div class="school-list">${sorted.map(s => {
      const sortedProgs = s.progs.sort((a, b) => b.s - a.s);
      return `<div class="school-list-item">
        <div class="school-list-item__name">${s.school_en || s.school_zh} <span class="zh">${s.school_zh}</span></div>
        ${sortedProgs.map(({ p }) => {
          const url = p.program_url || 'https://www.google.com/search?q=' + encodeURIComponent((s.school_en||s.school_zh||'') + ' ' + (p.program_name_en||''));
          return `<div class="school-list-item__prog" onclick="window.open('${url}','_blank')" style="cursor:pointer">
            ${p.program_name_en || p.program_name_zh}
          </div>
          <div class="school-list-item__meta">${p.program_name_zh || ''}</div>`;
        }).join('')}
      </div>`;
    }).join('')}</div>`;
  },

  // Legacy — kept for section header school grid (small picks per group)
  pickForSidebar(industryId, maxPerGroup = 3, roleText = '', companyText = '') {
    return ProgramScorer.topByGroup(roleText, companyText, industryId, maxPerGroup);
  },
};

/* ── SEARCH ── */
const Search = {
  init() {
    const input = document.getElementById('search-input');
    const results = document.getElementById('search-results');
    if (!input) return;

    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      if (q.length < 2) { results.classList.remove('is-open'); return; }
      this.render(q, results);
    });

    document.addEventListener('click', e => {
      if (!e.target.closest('.navbar__search-wrap')) results.classList.remove('is-open');
    });

    input.addEventListener('keydown', e => {
      if (e.key === 'Escape') { results.classList.remove('is-open'); input.blur(); }
    });
  },

  render(q, container) {
    const hits = { companies: [], jobs: [], schools: [] };

    // Companies
    const seenCo = new Set();
    DATA.careers.forEach(c => {
      if (seenCo.has(c.company)) return;
      if (c.company.toLowerCase().includes(q) || c.industry.toLowerCase().includes(q)) {
        hits.companies.push(c);
        seenCo.add(c.company);
      }
    });

    // Job directions
    const seenJob = new Set();
    DATA.careers.forEach(c => {
      if (seenJob.has(c.direction_zh)) return;
      if (c.direction_zh.toLowerCase().includes(q) || c.direction_en.toLowerCase().includes(q) || c.job_title_en.toLowerCase().includes(q)) {
        hits.jobs.push(c);
        seenJob.add(c.direction_zh);
      }
    });

    // Schools
    const seenSch = new Set();
    DATA.programs.forEach(p => {
      const key = p.school_en;
      if (seenSch.has(key)) return;
      if ((p.school_en + p.school_zh + p.program_name_en).toLowerCase().includes(q)) {
        hits.schools.push(p);
        seenSch.add(key);
      }
    });

    const total = hits.companies.length + hits.jobs.length + hits.schools.length;
    if (!total) {
      container.innerHTML = `<div class="search-results__empty">未找到相关结果</div>`;
      container.classList.add('is-open');
      return;
    }

    let html = '';
    if (hits.companies.length) {
      html += `<div class="search-results__group-label">企业</div>`;
      hits.companies.slice(0,4).forEach(c => {
        html += `<div class="search-result-item" onclick="Search.jumpTo('company','${c.id}')">
          <div class="search-result-item__title">${c.company}</div>
          <div class="search-result-item__sub">${c.industry} · ${c.tier}</div>
        </div>`;
      });
    }
    if (hits.jobs.length) {
      html += `<div class="search-results__group-label">岗位方向</div>`;
      hits.jobs.slice(0,4).forEach(c => {
        html += `<div class="search-result-item" onclick="Search.jumpTo('job','${c.industry}','${c.direction_zh.replace(/'/g,"\\'")}')">
          <div class="search-result-item__title">${c.direction_zh}</div>
          <div class="search-result-item__sub">${c.direction_en} · ${c.industry}</div>
        </div>`;
      });
    }
    if (hits.schools.length) {
      html += `<div class="search-results__group-label">院校</div>`;
      hits.schools.slice(0,4).forEach(p => {
        html += `<div class="search-result-item" onclick="Search.jumpTo('school','${encodeURIComponent(p.school_en)}')">
          <div class="search-result-item__title">${p.school_en} ${p.school_zh}</div>
          <div class="search-result-item__sub">${p.program_name_en}</div>
        </div>`;
      });
    }

    container.innerHTML = html;
    container.classList.add('is-open');
  },

  jumpTo(type, ...args) {
    document.getElementById('search-results').classList.remove('is-open');
    document.getElementById('search-input').value = '';
    if (type === 'company') {
      Router.go('planning');
      setTimeout(() => {
        const career = DATA.careers.find(c => c.id === args[0]);
        if (career) PlanningPage.openCompanySidebar(career);
      }, 300);
    } else if (type === 'job') {
      Router.goToIndustry(args[0]);
    } else if (type === 'school') {
      Router.go('planning');
    }
  },
};

/* ── SCROLL SPY ── */
const ScrollSpy = {
  init() {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const id = e.target.id.replace('sec-', '');
          document.querySelectorAll('.industry-nav__btn').forEach(b => b.classList.remove('is-active'));
          document.getElementById('nav-' + id)?.classList.add('is-active');
        }
      });
    }, { rootMargin: '-120px 0px -60% 0px' });

    document.querySelectorAll('.industry-section').forEach(el => observer.observe(el));
  },
};

// ── Shared Image Modal ────────────────────────────────────────────
const ImageModal = {
  _el: null,

  _build() {
    if (this._el) return;
    const el = document.createElement('div');
    el.className = 'img-modal-backdrop';
    el.innerHTML = `
      <div class="img-modal-flipper">
        <div class="img-modal-inner">
          <img id="img-modal-img" src="" alt="">
          <button class="img-modal-close" id="img-modal-close">✕</button>
        </div>
      </div>`;
    document.body.appendChild(el);
    // close on backdrop click
    el.addEventListener('click', e => { if (e.target === el) this.close(); });
    el.querySelector('#img-modal-close').addEventListener('click', () => this.close());
    // close on Escape
    document.addEventListener('keydown', e => { if (e.key === 'Escape') this.close(); });
    this._el = el;
  },

  open(src, alt = '') {
    this._build();
    this._el.querySelector('#img-modal-img').src = src;
    this._el.querySelector('#img-modal-img').alt = alt;
    this._el.style.display = 'flex';
    // force reflow before adding class so transition fires
    this._el.offsetHeight;
    this._el.classList.add('is-visible');
    document.body.style.overflow = 'hidden';
  },

  close() {
    if (!this._el) return;
    this._el.classList.remove('is-visible');
    document.body.style.overflow = '';
    setTimeout(() => { if (this._el) this._el.style.display = 'none'; }, 300);
  },
};
window.ImageModal = ImageModal;
