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

/* ── SCHOOL HELPERS ── */
const Schools = {
  // Get country group key for a program
  groupOf(country) {
    if (country === 'US') return 'US';
    if (country === 'UK') return 'UK';
    if (country === 'HK' || country === 'SG') return 'HK_SG';
    return 'OTHER';
  },

  // Pick up to maxPerGroup programs per country group, one per school,
  // ordered by school_priority list.
  pickForSidebar(industryId, maxPerGroup = 3) {
    const programs = DATA.programs.filter(p => p.industry_tags.includes(industryId));
    const priority = DATA.school_priority;
    const groups = ['US','UK','HK_SG','OTHER'];
    const result = {};

    groups.forEach(group => {
      const countryList = priority._meta.country_groups[group];
      const prioList = priority[group];
      const usedSchools = new Set();
      const picks = [];

      for (const s of prioList) {
        if (picks.length >= maxPerGroup) break;
        const match = programs.find(p =>
          countryList.includes(p.country) &&
          (p.school_en === s.school_en || p.school_zh === s.school_zh) &&
          !usedSchools.has(s.school_en)
        );
        if (match) {
          usedSchools.add(s.school_en);
          picks.push({ school_en: s.school_en, school_zh: s.school_zh, prog: match });
        }
      }
      result[group] = picks;
    });
    return result;
  },

  // Pick top 5 programs for company sidebar (across all countries, one per school)
  pickForCompany(industryId, total = 5) {
    const programs = DATA.programs.filter(p => p.industry_tags.includes(industryId));
    const allPrio = [
      ...DATA.school_priority.US,
      ...DATA.school_priority.UK,
      ...DATA.school_priority.HK_SG,
      ...DATA.school_priority.OTHER,
    ];
    const usedSchools = new Set();
    const picks = [];

    for (const s of allPrio) {
      if (picks.length >= total) break;
      const match = programs.find(p =>
        (p.school_en === s.school_en || p.school_zh === s.school_zh) &&
        !usedSchools.has(s.school_en)
      );
      if (match) {
        usedSchools.add(s.school_en);
        picks.push({ school_en: s.school_en, school_zh: s.school_zh, prog: match });
      }
    }
    return picks;
  },

  // Render full list (all programs for industry + country group) for the "view all" sidebar
  renderFullList(industryId, group) {
    const countryList = DATA.school_priority._meta.country_groups[group];
    const programs = DATA.programs.filter(p =>
      p.industry_tags.includes(industryId) && countryList.includes(p.country)
    );
    // Group by school using priority order
    const prioList = DATA.school_priority[group];
    const schoolMap = {};
    programs.forEach(p => {
      const key = p.school_en || p.school_zh;
      if (!schoolMap[key]) schoolMap[key] = { school_en: p.school_en, school_zh: p.school_zh, progs: [] };
      schoolMap[key].progs.push(p);
    });

    // Sort schools by priority
    const prioKeys = prioList.map(s => s.school_en);
    const sorted = Object.values(schoolMap).sort((a, b) => {
      const ai = prioKeys.indexOf(a.school_en);
      const bi = prioKeys.indexOf(b.school_en);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });

    if (!sorted.length) return `<p class="u-muted" style="padding:16px 0;font-size:13px;">暂无数据</p>`;

    return sorted.map(s => `
      <div class="school-list-item">
        <div class="school-list-item__name">
          ${s.school_en} <span class="zh">${s.school_zh}</span>
        </div>
        ${s.progs.map(p => `
          <div class="school-list-item__prog"
               onclick="window.open('${p.program_url || 'https://www.google.com/search?q=' + encodeURIComponent(p.school_en + ' ' + p.program_name_en)}','_blank')">
            ${p.program_name_en || p.program_name_zh}
          </div>
          <div class="school-list-item__meta">
            ${[p.gpa_requirement, p.language_scores].filter(Boolean).join(' · ')}
          </div>
        `).join('')}
      </div>`).join('');
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
      if (seenJob.has(c.job_direction)) return;
      if (c.job_direction.toLowerCase().includes(q) || c.job_title_en.toLowerCase().includes(q)) {
        hits.jobs.push(c);
        seenJob.add(c.job_direction);
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
        html += `<div class="search-result-item" onclick="Search.jumpTo('job','${c.industry}','${c.job_direction.replace(/'/g,"\\'")}')">
          <div class="search-result-item__title">${c.job_direction}</div>
          <div class="search-result-item__sub">${c.industry}</div>
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
