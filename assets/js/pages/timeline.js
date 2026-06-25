// ── Timeline page — Gantt-style month-based layout ──────────────────────────
// Vertical axis: 关键节点 / 专业成长 / 求职准备
// Horizontal axis: 12 months starting Sep (1=Sep … 12=Aug)
// Overlapping bars in same category auto-stack into sub-rows

const MONTHS  = ['Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug'];
const CATS    = ['关键节点','专业成长','求职准备'];
const CAT_CLS = { '关键节点':'milestone', '专业成长':'growth', '求职准备':'career' };

// courseTab values map to courses tab IDs in the main site
// Data loaded from data/timeline.json via DATA.timeline

// Pre-compute ordered years per track (built lazily on first render)
let TL_YEAR_ORDER = {};

// Greedy lane-packing: given bars[], return [{...bar, lane}]
function tlPackLanes(bars) {
  const lanes = [];
  return bars.map(bar => {
    for (let li = 0; li < lanes.length; li++) {
      if (!lanes[li].some(b => bar.start <= b.end && bar.end >= b.start)) {
        lanes[li].push(bar);
        return { ...bar, lane: li };
      }
    }
    lanes.push([bar]);
    return { ...bar, lane: lanes.length - 1 };
  });
}

// Build gantt HTML for given segments [{track, isPg}]
function tlBuildGantt(segments) {
  if (!segments.length) return '<div class="tl-gantt-empty">请至少选择一个阶段</div>';

  const tlData = DATA.timeline || [];
  let html = '';
  let gridRow = 2;

  // Header (gridRow=1)
  html += `<div class="tl-gh" style="grid-column:1;grid-row:1">年级</div>`;
  html += `<div class="tl-gh tl-gh--cat" style="grid-column:2;grid-row:1">维度</div>`;
  MONTHS.forEach((m, i) =>
    html += `<div class="tl-gh" style="grid-column:${i+3};grid-row:1">${m}</div>`
  );

  segments.forEach((seg, si) => {
    const rows  = tlData.filter(r => r.track === seg.track);
    const years = TL_YEAR_ORDER[seg.track] || [];

    if (si > 0) {
      html += `<div class="tl-seg-div" style="grid-row:${gridRow}"></div>`;
      gridRow++;
    }

    years.forEach(year => {
      html += `<div class="tl-year-band" style="grid-row:${gridRow}">${year}</div>`;
      gridRow++;
      const yearStartRow = gridRow;

      CATS.forEach(cat => {
        const catBars = rows.filter(r => r.year === year && r.category === cat);
        if (!catBars.length) return;

        const packed   = tlPackLanes(catBars);
        const numLanes = Math.max(...packed.map(b => b.lane)) + 1;
        const catCls   = CAT_CLS[cat];

        for (let li = 0; li < numLanes; li++) {
          if (li === 0) {
            html += `<div class="tl-cat tl-cat--${catCls}" style="grid-column:2;grid-row:${gridRow}/${gridRow+numLanes}">${cat}</div>`;
          }
          MONTHS.forEach((_, mi) =>
            html += `<div class="tl-mc${mi%2?' tl-mc--odd':''}" style="grid-column:${mi+3};grid-row:${gridRow}"></div>`
          );
          packed.filter(b => b.lane === li).forEach(bar => {
            const cs = bar.start + 2, ce = bar.end + 3;
            const linked  = bar.courseTab ? ' is-linked' : '';
            const onclick = bar.courseTab
              ? ` onclick="Router.goToCoursesTab('${bar.courseTab}')" title="点击跳转课程页面"`
              : '';
            html += `<div class="tl-bar tl-bar--${bar.type}${linked}" style="grid-column:${cs}/${ce};grid-row:${gridRow};z-index:2"${onclick}>${bar.label}</div>`;
          });
          gridRow++;
        }
      });

      const span = gridRow - yearStartRow;
      if (span > 0) {
        html += `<div class="tl-yl" style="grid-column:1;grid-row:${yearStartRow}/${gridRow}">${year}</div>`;
      }
    });
  });

  return html;
}

const TimelinePage = {
  _selUg: 'uk3',
  _selPg: 'pg1',

  build() {
    // Build TL_YEAR_ORDER from loaded data
    TL_YEAR_ORDER = {};
    (DATA.timeline || []).forEach(r => {
      if (!TL_YEAR_ORDER[r.track]) TL_YEAR_ORDER[r.track] = [];
      if (!TL_YEAR_ORDER[r.track].includes(r.year)) TL_YEAR_ORDER[r.track].push(r.year);
    });

    // Controls already in index.html; just set defaults + wire events
    this._setActive('tl-tabs-ug', this._selUg);
    this._setActive('tl-tabs-pg', this._selPg);

    document.querySelectorAll('#tl-tabs-ug .tl-seg-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        this._selUg = btn.dataset.val;
        this._setActive('tl-tabs-ug', this._selUg);
        this._render();
      });
    });
    document.querySelectorAll('#tl-tabs-pg .tl-seg-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        this._selPg = btn.dataset.val;
        this._setActive('tl-tabs-pg', this._selPg);
        this._render();
      });
    });

    this._render();
  },

  _setActive(groupId, val) {
    document.querySelectorAll(`#${groupId} .tl-seg-tab`).forEach(b =>
      b.classList.toggle('is-active', b.dataset.val === val)
    );
  },

  _render() {
    const segments = [];
    if (this._selUg) segments.push({ track: this._selUg });
    if (this._selPg) segments.push({ track: this._selPg });
    const wrap = document.getElementById('tl-gantt-wrap');
    const el   = document.getElementById('tl-gantt');
    if (!segments.length) {
      if (wrap) wrap.innerHTML = '<div class="tl-gantt-empty">请至少选择一个阶段</div>';
      return;
    }
    if (wrap && !el) {
      wrap.innerHTML = '<div class="tl-gantt" id="tl-gantt"></div>';
    }
    const g = document.getElementById('tl-gantt');
    if (g) g.innerHTML = tlBuildGantt(segments);
  },
};

window.TimelinePage = TimelinePage;
