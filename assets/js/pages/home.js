/* ═══════════════════════════════════════════
   HOME PAGE
═══════════════════════════════════════════ */
const HomePage = {
  build() {
    this.buildInstructors();
    this.buildResources();
    this.buildCourses();
  },

  buildInstructors() {
    this._renderInstructors('all');
  },

  filterInstructors(type, btn) {
    document.querySelectorAll('#instructor-tabs .filter-btn').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    this._renderInstructors(type);
  },

  _renderInstructors(type) {
    const grid = document.getElementById('instructors-grid');
    if (!grid) return;
    const items = type === 'all' ? DATA.instructors : DATA.instructors.filter(i => i.tag === type);
    const INITIAL = 6;
    const cards = items.map(inst => this._instructorCard(inst));
    const visible = cards.slice(0, INITIAL).join('');
    const hidden  = cards.slice(INITIAL).join('');
    const hasMore = cards.length > INITIAL;
    grid.innerHTML = visible
      + (hasMore ? `<div class="inst-more" id="inst-more" style="display:none">${hidden}</div>` : '');
    // Re-render expand button
    const btn = document.getElementById('inst-expand-btn');
    if (btn) btn.style.display = hasMore ? '' : 'none';
    if (btn) { btn.textContent = '展开查看更多'; btn.dataset.open = '0'; }
  },

  toggleInstructors() {
    const more = document.getElementById('inst-more');
    const btn  = document.getElementById('inst-expand-btn');
    if (!more) return;
    const isOpen = btn.dataset.open === '1';
    more.style.display = isOpen ? 'none' : 'contents';
    btn.textContent = isOpen ? '展开查看更多' : '收起';
    btn.dataset.open = isOpen ? '0' : '1';
  },

  _instructorCard(inst) {
    const tagClsMap = { 'tag-blue': 'primary', 'tag-lime': 'accent', 'tag-gray': 'surface', 'tag-purple': 'primary' };
    const tagCls = tagClsMap[inst.tag_cls] || 'surface';
    // Append role-appropriate suffix to pseudonym
    const base = inst.pseudonym || inst.name;
    const suffix = inst.tag === 'academic' ? '老师'
                 : inst.tag === 'industry' ? '老师'
                 : inst.tag === 'overseas' ? '教授'
                 : '';
    const displayName = base + suffix;
    const avatar = `<div class="person-card__avatar">${base.slice(-1)}</div>`;
    const nameRow = `<div class="person-card__name">${displayName}</div>`;
    const roleTag = `<span class="tag tag--${tagCls}" style="margin-top:6px;">${inst.role}</span>`;

    let body = '';
    if (inst.tag === 'industry') {
      body = `${nameRow}
        <div class="person-card__title">${inst.title || ''}</div>
        ${inst.intro ? `<div class="person-card__sub">${inst.intro}</div>` : ''}`;
    } else if (inst.tag === 'academic') {
      body = `${nameRow}
        <div class="person-card__title">${inst.school || (inst.placeholder ? '待补充' : '')}</div>
        ${inst.academic_branch ? `<div class="person-card__sub">${inst.academic_branch}</div>` : ''}`;
    } else if (inst.tag === 'alumni') {
      const dirs = (inst.directions || []).join('　/　');
      body = `${nameRow}
        <div class="person-card__title">${inst.school || ''}</div>
        ${dirs ? `<div class="person-card__sub">${dirs}</div>` : ''}`;
    } else if (inst.tag === 'overseas') {
      body = `${nameRow}
        <div class="person-card__title">${inst.school || (inst.placeholder ? '待补充' : '')}</div>
        ${inst.title ? `<div class="person-card__sub">${inst.title}</div>` : ''}`;
    } else {
      body = `${nameRow}<div class="person-card__title">${inst.title || ''}</div>`;
    }

    return `<div class="person-card">${avatar}${body}${roleTag}</div>`;
  },

  buildResources() {
    const grid = document.getElementById('resources-grid');
    if (!grid) return;
    this._renderResources('all');

    document.querySelectorAll('.resource-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.resource-filter-btn').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        this._renderResources(btn.dataset.type);
      });
    });
  },

  _renderResources(type) {
    const grid = document.getElementById('resources-grid');
    const items = type === 'all' ? DATA.resources : DATA.resources.filter(r => r.type === type);
    grid.innerHTML = items.map(r => `
      <div class="resource-card">
        <div class="resource-card__type">${r.type}</div>
        <div class="resource-card__name">${r.name}</div>
        <div class="resource-card__desc">${r.desc}</div>
      </div>`).join('');
  },

  buildCourses() {
    const TABS = [
      { id: 'internship',    label: '就业实习课程' },
      { id: 'summer',        label: '海外冬夏校' },
      { id: 'admission',     label: '核心升学课程' },
      { id: 'masterclass',   label: '海外大师课' },
      { id: 'bizpractice',   label: '商业实践课程' },
      { id: 'other',         label: '其他' },
    ];

    const bar = document.getElementById('courses-tab-bar');
    const panels = document.getElementById('courses-tab-panels');

    bar.innerHTML = TABS.map((t, i) =>
      `<button class="tab-btn${i === 0 ? ' is-active' : ''}" data-tab="${t.id}"
               onclick="Tabs.switchCourse('${t.id}', this)">${t.label}</button>`
    ).join('');

    panels.innerHTML = TABS.map((t, i) => {
      const items = DATA.courses.filter(c => c.tab === t.id);
      let content;
      if (t.id === 'internship') {
        content = this._buildInternshipPanel(items);
      } else if (items.length && !items[0].placeholder) {
        content = this._buildCourseGrid(items);
      } else {
        content = this._buildPlaceholderGrid(t.label);
      }
      return `<div class="tab-panel${i === 0 ? ' is-active' : ''}" id="tab-${t.id}">${content}</div>`;
    }).join('');
  },

  _buildInternshipPanel(allItems) {
    const INDUSTRIES = ['互联网科技','智能实体产业','数字文化娱乐','品牌与服务','建筑环境科技'];
    const INDUSTRY_IDS = ['internet','hardware','culture','brand','arch'];

    // Map industry name to items (internship + mentoring combined)
    const internItems = DATA.courses.filter(c => c.tab === 'internship' || c.tab === 'mentoring');

    const filterBar = `
      <div class="filter-bar" style="margin-bottom:16px;">
        <span class="filter-bar__label">按类型</span>
        <button class="filter-btn is-active" data-itype="all" onclick="HomePage._filterInterns('all',this)">全部</button>
        <button class="filter-btn" data-itype="岗位制实习（实地）" onclick="HomePage._filterInterns('岗位制实习（实地）',this)">岗位制实习</button>
        <button class="filter-btn" data-itype="行业导师带训（线上）" onclick="HomePage._filterInterns('行业导师带训（线上）',this)">导师带训</button>
        <span class="filter-bar__label" style="margin-left:12px;">按企业性质</span>
        <button class="filter-btn is-active" data-icat="all" onclick="HomePage._filterInternsCat('all',this)">全部</button>
        <button class="filter-btn" data-icat="头部大厂" onclick="HomePage._filterInternsCat('头部大厂',this)">头部大厂</button>
        <button class="filter-btn" data-icat="行业名企" onclick="HomePage._filterInternsCat('行业名企',this)">行业名企</button>
        <button class="filter-btn" data-icat="创意工作室" onclick="HomePage._filterInternsCat('创意工作室',this)">创意工作室</button>
        <button class="filter-btn" data-icat="其他" onclick="HomePage._filterInternsCat('其他',this)">其他</button>
      </div>`;

    const grid = `<div class="grid-4" id="internship-grid" style="background:var(--color-border);gap:3px;">
      ${internItems.map(c => this._internCard(c)).join('')}
    </div>`;

    return filterBar + grid;
  },

  _internCard(c) {
    const statusCls = c.enrollment_status === '招募中' ? 'course-card__badge--status-open' :
                      c.enrollment_status === '已满' ? 'course-card__badge--status-full' : '';
    return `<div class="course-card" data-ptype="${c.program_type}" data-cat="${c.category}">
      <div class="course-card__img">
        ${c.poster ? `<img src="${c.poster}" alt="${c.company}" loading="lazy">` : `<span style="opacity:.4">${c.program_type === '行业导师带训（线上）' ? '导师带训' : '岗位实习'}</span>`}
        <span class="course-card__img-label">${c.category || '其他'}</span>
      </div>
      <div class="course-card__body">
        <div class="course-card__company">${c.company}</div>
        <div class="course-card__role">${c.role_or_course}</div>
        <div class="course-card__meta">
          ${c.location ? `<span class="course-card__badge">${c.location}</span>` : ''}
          ${c.duration ? `<span class="course-card__badge">${c.duration}</span>` : ''}
          ${c.enrollment_status ? `<span class="course-card__badge ${statusCls}">${c.enrollment_status}</span>` : ''}
          ${c.price_rmb ? `<span class="course-card__badge course-card__badge--price">${c.price_rmb}</span>` : ''}
        </div>
      </div>
    </div>`;
  },

  _filterInterns(type, btn) {
    document.querySelectorAll('[data-itype]').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    const cat = document.querySelector('[data-icat].is-active')?.dataset.icat || 'all';
    this._applyInternFilter(type, cat);
  },

  _filterInternsCat(cat, btn) {
    document.querySelectorAll('[data-icat]').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    const type = document.querySelector('[data-itype].is-active')?.dataset.itype || 'all';
    this._applyInternFilter(type, cat);
  },

  _applyInternFilter(type, cat) {
    document.querySelectorAll('#internship-grid .course-card').forEach(card => {
      const typeMatch = type === 'all' || card.dataset.ptype === type;
      const catMatch  = cat  === 'all' || card.dataset.cat  === cat;
      card.style.display = (typeMatch && catMatch) ? '' : 'none';
    });
  },

  _buildCourseGrid(items) {
    return `<div class="grid-4" style="background:var(--color-border);gap:3px;">
      ${items.map(c => `
        <div class="course-card">
          <div class="course-card__img">
            ${c.poster ? `<img src="${c.poster}" alt="${c.company}" loading="lazy">` : `<span style="opacity:.4">${c.program_type}</span>`}
          </div>
          <div class="course-card__body">
            <div class="course-card__company">${c.company}</div>
            <div class="course-card__role">${c.role_or_course}</div>
            <div class="course-card__meta">
              ${c.price_rmb ? `<span class="course-card__badge course-card__badge--price">${c.price_rmb}</span>` : ''}
            </div>
          </div>
        </div>`).join('')}
    </div>`;
  },

  _buildPlaceholderGrid(label) {
    return `<div class="grid-4" style="background:var(--color-border);gap:3px;">
      ${Array.from({length:8}, (_,i) => `
        <div class="course-card">
          <div class="course-card__img"><span style="opacity:.3">${label} ${i+1}</span></div>
          <div class="course-card__body">
            <div class="course-card__company" style="color:var(--color-border)">████████</div>
            <div class="course-card__role" style="color:var(--color-border)">████</div>
          </div>
        </div>`).join('')}
    </div>`;
  },
};
// expose for inline event handlers
window.HomePage = HomePage;
