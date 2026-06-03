const TRACK_LABELS = {
  '英国本科三年时间轴+1年制研究生':   '💡 本科 3年 + 研1年',
  '英国本科三年时间轴+1.5年制研究生': '💡 本科 3年 + 研1.5年',
  '美国本科四年时间轴+1年制研究生':   '💡 本科 4年 + 研1年',
  '美国本科四年时间轴+2年制研究生':   '💡 本科 4年 + 研2年',
};

const PHASE_TO_SEM = {
  '开学':'autumn','秋季学期':'autumn','递交研究生申请':'autumn',
  '秋招':'autumn','笔试和测试':'autumn','面试':'autumn',
  '圣诞寒假':'winter','圣诞假（约3–5周）':'winter','圣诞假':'winter',
  '拿offer-就业':'winter','拿offer':'winter',
  '春季学期':'spring','复活节春假':'spring','春假（约1周）':'spring',
  '春季学期后段':'spring','春招补录+社招':'spring','毕业':'spring',
  '就业':'spring','春季学期毕业设计':'spring',
  '暑假':'summer','大一暑假（约3个月）':'summer','大二暑假':'summer',
  '大三暑假':'summer','大四暑假':'summer','研一暑假':'summer',
  '夏季学期（含期末考）':'summer','夏季学期（毕业设计）':'summer','夏季学期':'summer',
  '实习2':'summer','实习3':'summer','实习4':'summer','实习5':'summer',
  '求职作品集+投递':'summer',
};
const SEMS = ['autumn','winter','spring','summer'];
const SEM_LABELS = { autumn:'秋季学期', winter:'寒假', spring:'春季学期', summer:'暑假 / 夏季' };

const ACT_KEYS   = ['internship','summer_program','business_practice','masterclass','gpa_support'];
const ACT_LABELS = { internship:'实习', summer_program:'夏校/冬校', business_practice:'商业实践', masterclass:'大师课', gpa_support:'GPA支持' };
const ACT_CLS    = { internship:'blue', summer_program:'lime' };
const TAG_JUMP   = { '实习':'internship','夏校':'summer','冬校':'summer','商业实践':'bizpractice','大师课':'masterclass','GPA':'other' };

const TAG_CLASS = v => {
  if(!v) return '';
  if(v.includes('实习')) return 'internship';
  if(v.includes('夏校')||v.includes('冬校')) return 'summer';
  if(v.includes('商业实践')) return 'biz';
  if(v.includes('大师课')) return 'master';
  return 'gpa';
};

function cellTag(v) {
  if(!v) return '';
  const cls = TAG_CLASS(v);
  const jump = Object.entries(TAG_JUMP).find(([k])=>v.includes(k))?.[1];
  const onclick = jump ? `onclick="Router.goToCoursesTab('${jump}')"` : '';
  return `<span class="tl-tag tl-tag--${cls}" ${onclick} title="${jump?'点击跳转到对应课程':''}">${v}</span>`;
}

const TimelinePage = {
  build() {
    const rows = DATA.timeline || [];
    if (!rows.length) { document.getElementById('track-tabs').innerHTML = '<p>数据加载中…</p>'; return; }

    const tracks = [...new Set(rows.map(r=>r.track))];
    const tabsEl   = document.getElementById('track-tabs');
    const panelsEl = document.getElementById('track-panels');

    tabsEl.innerHTML = tracks.map((t,i) =>
      `<button class="track-tab${i===0?' is-active':''}"
               onclick="Tabs.switchTrack('tl${i}',this)">
        ${TRACK_LABELS[t]||t}
      </button>`
    ).join('');

    panelsEl.innerHTML = tracks.map((t,i) => {
      const trows = rows.filter(r=>r.track===t);
      const years = [...new Set(trows.map(r=>r.year))].filter(Boolean);

      // Build grid: year → sem → { phases[], months[], activities{} }
      const grid = {};
      years.forEach(y => {
        grid[y] = {};
        SEMS.forEach(s => {
          grid[y][s] = { phases:[], months:[], activities:{} };
          ACT_KEYS.forEach(k => grid[y][s].activities[k] = []);
        });
      });

      trows.forEach(r => {
        if(!r.year) return;
        const phase = (r.phase||'').trim();
        const sem = PHASE_TO_SEM[phase] || 'autumn';
        const cell = grid[r.year][sem];
        // Collect phases (skip pure activity/date rows like 实习2, 求职...)
        const skipPhases = new Set(['实习2','实习3','实习4','实习5','求职作品集+投递']);
        if(phase && !cell.phases.includes(phase) && !skipPhases.has(phase))
          cell.phases.push(phase);
        // Collect months
        const mo = (r.month_period||'').trim();
        if(mo && !cell.months.includes(mo))
          cell.months.push(mo);
        // Collect activities
        ACT_KEYS.forEach(k => {
          if(r[k]) r[k].split(/[,，、]+/).map(v=>v.trim()).filter(Boolean).forEach(v => {
            if(!cell.activities[k].includes(v)) cell.activities[k].push(v);
          });
        });
      });

      // Build table
      // Columns: 年级 | 学期 | 阶段 | 月份 | internship | summer | biz | masterclass | gpa
      let tbl = `<div style="overflow-x:auto"><table class="tl-table" style="width:100%;min-width:800px;">
        <thead><tr>
          <th class="tl-th-label" style="width:60px;">年级</th>
          <th class="tl-th-label" style="width:90px;">学期</th>
          <th class="tl-th-label" style="width:160px;">阶段</th>
          <th class="tl-th-label" style="width:130px;">月份</th>
          ${ACT_KEYS.map(k => {
            const c = ACT_CLS[k]||'';
            return `<th class="tl-th-label${c?' tl-th-label--'+c:''}">${ACT_LABELS[k]}</th>`;
          }).join('')}
        </tr></thead>
        <tbody>`;

      years.forEach(y => {
        // Which semesters have any content for this year?
        const activeSems = SEMS.filter(s =>
          grid[y][s].phases.length ||
          ACT_KEYS.some(k => grid[y][s].activities[k].length)
        );
        if(!activeSems.length) return;

        activeSems.forEach((s, si) => {
          const cell = grid[y][s];
          const hasActs = ACT_KEYS.some(k => cell.activities[k].length);
          const phases = cell.phases.join(' · ') || '—';
          const months = cell.months
            .filter((v,i,a) => a.indexOf(v)===i)  // dedupe
            .join(' / ');

          tbl += `<tr>
            ${si===0 ? `<td class="tl-cell" style="font-weight:700;vertical-align:top;background:var(--color-surface);text-align:center;" rowspan="${activeSems.length}">${y}</td>` : ''}
            <td class="tl-cell" style="font-size:11px;color:var(--color-primary-bright);font-weight:600;white-space:nowrap;">${SEM_LABELS[s]}</td>
            <td class="tl-cell" style="font-size:11px;color:var(--color-text-muted);">${phases}</td>
            <td class="tl-cell" style="font-size:10px;color:var(--color-text-muted);">${months}</td>
            ${ACT_KEYS.map(k =>
              `<td class="tl-cell">${cell.activities[k].map(cellTag).join('')}</td>`
            ).join('')}
          </tr>`;
        });
      });

      tbl += `</tbody></table></div>`;

      return `<div class="track-panel${i===0?' is-active':''}" id="track-tl${i}">
        <p style="font-size:12px;color:var(--color-text-secondary);margin-bottom:16px;padding:10px 14px;background:var(--color-surface);border-left:3px solid var(--color-primary);border-radius:var(--radius-sm);">
          按学年与学期规划关键任务节点。点击课程标签可跳转至对应课程产品页面。
        </p>
        ${tbl}
      </div>`;
    }).join('');
  },
};
window.TimelinePage = TimelinePage;
