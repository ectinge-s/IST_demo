// ── Timeline page — Gantt-style month-based layout ──────────────────────────
// Vertical axis: 关键节点 / 专业成长 / 求职准备
// Horizontal axis: 12 months starting Sep (1=Sep … 12=Aug)
// Overlapping bars in same category auto-stack into sub-rows

const MONTHS  = ['Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug'];
const CATS    = ['关键节点','专业成长','求职准备'];
const CAT_CLS = { '关键节点':'milestone', '专业成长':'growth', '求职准备':'career' };

// courseTab values map to courses tab IDs in the main site
const TL_RAW = [
  // ── 英本3年 ──
  {track:"uk3",year:"大一",category:"专业成长",label:"安心办",type:"gpa",start:1,end:4,courseTab:null},
  {track:"uk3",year:"大一",category:"专业成长",label:"安心办",type:"gpa",start:6,end:9,courseTab:null},
  {track:"uk3",year:"大一",category:"专业成长",label:"夏冬校",type:"summer",start:10,end:12,courseTab:"summer"},
  {track:"uk3",year:"大二",category:"专业成长",label:"安心办",type:"gpa",start:1,end:4,courseTab:null},
  {track:"uk3",year:"大二",category:"专业成长",label:"安心办",type:"gpa",start:6,end:9,courseTab:null},
  {track:"uk3",year:"大二",category:"专业成长",label:"商业实践",type:"biz",start:4,end:7,courseTab:"bizpractice"},
  {track:"uk3",year:"大二",category:"专业成长",label:"大师课",type:"master",start:5,end:8,courseTab:"masterclass"},
  {track:"uk3",year:"大二",category:"专业成长",label:"夏冬校",type:"summer",start:10,end:12,courseTab:"summer"},
  {track:"uk3",year:"大二",category:"求职准备",label:"实习",type:"internship",start:10,end:12,courseTab:"internship"},
  {track:"uk3",year:"大三",category:"关键节点",label:"递交研究生申请",type:"milestone",start:1,end:4,courseTab:null},
  {track:"uk3",year:"大三",category:"专业成长",label:"毕无忧",type:"gpa",start:5,end:8,courseTab:null},
  {track:"uk3",year:"大三",category:"求职准备",label:"实习",type:"internship",start:10,end:12,courseTab:"internship"},
  {track:"uk3",year:"大三",category:"求职准备",label:"作品集+投递",type:"internship",start:11,end:12,courseTab:null},
  // ── 美本4年 ──
  {track:"us4",year:"大一",category:"专业成长",label:"安心办",type:"gpa",start:1,end:4,courseTab:null},
  {track:"us4",year:"大一",category:"专业成长",label:"夏冬校",type:"summer",start:10,end:12,courseTab:"summer"},
  {track:"us4",year:"大二",category:"专业成长",label:"安心办",type:"gpa",start:1,end:4,courseTab:null},
  {track:"us4",year:"大二",category:"专业成长",label:"商业实践",type:"biz",start:4,end:7,courseTab:"bizpractice"},
  {track:"us4",year:"大二",category:"专业成长",label:"夏冬校（科研）",type:"summer",start:10,end:12,courseTab:"summer"},
  {track:"us4",year:"大二",category:"求职准备",label:"实习",type:"internship",start:10,end:12,courseTab:"internship"},
  {track:"us4",year:"大三",category:"专业成长",label:"安心办",type:"gpa",start:1,end:4,courseTab:null},
  {track:"us4",year:"大三",category:"专业成长",label:"毕无忧",type:"gpa",start:5,end:9,courseTab:null},
  {track:"us4",year:"大三",category:"专业成长",label:"大师课",type:"master",start:4,end:7,courseTab:"masterclass"},
  {track:"us4",year:"大三",category:"求职准备",label:"实习",type:"internship",start:10,end:12,courseTab:"internship"},
  {track:"us4",year:"大四",category:"关键节点",label:"递交研究生申请",type:"milestone",start:1,end:6,courseTab:null},
  {track:"us4",year:"大四",category:"求职准备",label:"实习",type:"internship",start:10,end:12,courseTab:"internship"},
  {track:"us4",year:"大四",category:"求职准备",label:"作品集+投递",type:"internship",start:11,end:12,courseTab:null},
  // ── 建筑5年 ──
  {track:"arch5",year:"大一",category:"专业成长",label:"安心办",type:"gpa",start:1,end:4,courseTab:null},
  {track:"arch5",year:"大一",category:"专业成长",label:"夏冬校",type:"summer",start:10,end:12,courseTab:"summer"},
  {track:"arch5",year:"大二",category:"专业成长",label:"安心办",type:"gpa",start:1,end:4,courseTab:null},
  {track:"arch5",year:"大二",category:"专业成长",label:"商业实践",type:"biz",start:4,end:7,courseTab:"bizpractice"},
  {track:"arch5",year:"大二",category:"专业成长",label:"夏冬校（科研）",type:"summer",start:10,end:12,courseTab:"summer"},
  {track:"arch5",year:"大二",category:"求职准备",label:"实习",type:"internship",start:10,end:12,courseTab:"internship"},
  {track:"arch5",year:"大三",category:"专业成长",label:"安心办",type:"gpa",start:1,end:4,courseTab:null},
  {track:"arch5",year:"大三",category:"专业成长",label:"大师课",type:"master",start:4,end:7,courseTab:"masterclass"},
  {track:"arch5",year:"大三",category:"求职准备",label:"实习",type:"internship",start:10,end:12,courseTab:"internship"},
  {track:"arch5",year:"大四",category:"专业成长",label:"安心办",type:"gpa",start:1,end:4,courseTab:null},
  {track:"arch5",year:"大四",category:"专业成长",label:"科研",type:"summer",start:1,end:4,courseTab:"summer"},
  {track:"arch5",year:"大四",category:"求职准备",label:"实习",type:"internship",start:10,end:12,courseTab:"internship"},
  {track:"arch5",year:"大五",category:"关键节点",label:"递交研究生申请",type:"milestone",start:1,end:6,courseTab:null},
  {track:"arch5",year:"大五",category:"专业成长",label:"毕无忧",type:"gpa",start:5,end:9,courseTab:null},
  {track:"arch5",year:"大五",category:"求职准备",label:"实习",type:"internship",start:10,end:12,courseTab:"internship"},
  {track:"arch5",year:"大五",category:"求职准备",label:"作品集+投递",type:"internship",start:11,end:12,courseTab:null},
  // ── 研1年 ──
  {track:"pg1",year:"研一",category:"关键节点",label:"入学",type:"milestone",start:1,end:1,courseTab:null},
  {track:"pg1",year:"研一",category:"求职准备",label:"秋招+笔试",type:"internship",start:1,end:2,courseTab:null},
  {track:"pg1",year:"研一",category:"求职准备",label:"面试",type:"internship",start:2,end:5,courseTab:null},
  {track:"pg1",year:"研一",category:"求职准备",label:"拿offer",type:"internship",start:4,end:6,courseTab:null},
  {track:"pg1",year:"研一",category:"求职准备",label:"春招补录+社招",type:"internship",start:6,end:12,courseTab:null},
  {track:"pg1",year:"研一",category:"关键节点",label:"毕业",type:"milestone",start:12,end:12,courseTab:null},
  // ── 研1.5年 ──
  {track:"pg15",year:"研一",category:"关键节点",label:"入学",type:"milestone",start:1,end:1,courseTab:null},
  {track:"pg15",year:"研一",category:"专业成长",label:"安心办",type:"gpa",start:1,end:4,courseTab:null},
  {track:"pg15",year:"研一",category:"求职准备",label:"大厂实习投递",type:"internship",start:6,end:8,courseTab:null},
  {track:"pg15",year:"研一",category:"求职准备",label:"面试",type:"internship",start:7,end:9,courseTab:null},
  {track:"pg15",year:"研一",category:"求职准备",label:"实习",type:"internship",start:8,end:9,courseTab:"internship"},
  {track:"pg15",year:"研二",category:"关键节点",label:"毕业",type:"milestone",start:3,end:4,courseTab:null},
  {track:"pg15",year:"研二",category:"求职准备",label:"秋招+笔试",type:"internship",start:1,end:2,courseTab:null},
  {track:"pg15",year:"研二",category:"求职准备",label:"面试",type:"internship",start:2,end:3,courseTab:null},
  {track:"pg15",year:"研二",category:"求职准备",label:"拿offer",type:"internship",start:3,end:4,courseTab:null},
  {track:"pg15",year:"研二",category:"求职准备",label:"春招补录+社招",type:"internship",start:6,end:12,courseTab:null},
  // ── 研2年 ──
  {track:"pg2",year:"研一",category:"关键节点",label:"入学",type:"milestone",start:1,end:1,courseTab:null},
  {track:"pg2",year:"研一",category:"专业成长",label:"安心办",type:"gpa",start:1,end:4,courseTab:null},
  {track:"pg2",year:"研一",category:"求职准备",label:"大厂实习投递",type:"internship",start:6,end:8,courseTab:null},
  {track:"pg2",year:"研一",category:"求职准备",label:"面试+实习offer",type:"internship",start:7,end:9,courseTab:null},
  {track:"pg2",year:"研一",category:"求职准备",label:"实习",type:"internship",start:8,end:12,courseTab:"internship"},
  {track:"pg2",year:"研二",category:"专业成长",label:"安心办",type:"gpa",start:1,end:4,courseTab:null},
  {track:"pg2",year:"研二",category:"求职准备",label:"秋招+笔试",type:"internship",start:1,end:2,courseTab:null},
  {track:"pg2",year:"研二",category:"求职准备",label:"面试",type:"internship",start:2,end:5,courseTab:null},
  {track:"pg2",year:"研二",category:"求职准备",label:"拿offer",type:"internship",start:4,end:6,courseTab:null},
  {track:"pg2",year:"研二",category:"求职准备",label:"春招补录+社招",type:"internship",start:6,end:9,courseTab:null},
  {track:"pg2",year:"研二",category:"关键节点",label:"毕业",type:"milestone",start:12,end:12,courseTab:null},
];

// Pre-compute ordered years per track
const TL_YEAR_ORDER = {};
TL_RAW.forEach(r => {
  if (!TL_YEAR_ORDER[r.track]) TL_YEAR_ORDER[r.track] = [];
  if (!TL_YEAR_ORDER[r.track].includes(r.year)) TL_YEAR_ORDER[r.track].push(r.year);
});

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

  let html = '';
  let gridRow = 2;

  // Header (gridRow=1)
  html += `<div class="tl-gh" style="grid-column:1;grid-row:1">年级</div>`;
  html += `<div class="tl-gh tl-gh--cat" style="grid-column:2;grid-row:1">维度</div>`;
  MONTHS.forEach((m, i) =>
    html += `<div class="tl-gh" style="grid-column:${i+3};grid-row:1">${m}</div>`
  );

  segments.forEach((seg, si) => {
    const rows  = TL_RAW.filter(r => r.track === seg.track);
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
