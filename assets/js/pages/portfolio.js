const PORT_CATS = ['全部','HCI','空间计算 XR','建筑 & 参数化','游戏设计','创意编程','沉浸式体验','服务设计','数字媒体艺术','影视 & VFX','城市设计'];
const PORT_COLORS = ['#1F28E8','#E87B1F','#2E7D32','#9B1FE8','#C62828','#00695C','#1565C0','#4E342E','#AD1457','#37474F'];
const PORT_DATA = Array.from({length:20},(_,i)=>({
  id:`p${i+1}`, title:`作品集 ${i+1}`, student:`学生姓名`,
  school: ['CMU','RCA','MIT','UCL','Cornell'][i%5],
  cat: PORT_CATS[1 + i%10],
  tags: [PORT_CATS[1+i%10], ['HCI','XR','参数化','游戏','编程'][i%5]],
  color: PORT_COLORS[i%10],
}));

const PortfolioPage = {
  build() {
    const cats = document.getElementById('portfolio-cats');
    cats.innerHTML = PORT_CATS.map((c,i) =>
      `<button class="portfolio-cat-btn${i===0?' is-active':''}"
               onclick="PortfolioPage.filter('${c}',this)">${c}</button>`
    ).join('');
    this._render('全部');
  },
  filter(cat, btn) {
    document.querySelectorAll('.portfolio-cat-btn').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    this._render(cat);
  },
  _render(cat) {
    const items = cat === '全部' ? PORT_DATA : PORT_DATA.filter(p => p.cat === cat);
    document.getElementById('portfolio-grid').innerHTML = items.map(p => `
      <div class="port-card" onclick="alert('学生作品集页面（开发中）')">
        <div class="port-card__img" style="background:${p.color}">
          <span class="port-card__cat-tag">${p.cat}</span>
        </div>
        <div class="port-card__body">
          <div class="port-card__title">${p.title}</div>
          <div class="port-card__student">${p.student} · ${p.school}</div>
          <div class="port-card__tags">${p.tags.map(t=>`<span class="port-card__tag">${t}</span>`).join('')}</div>
        </div>
      </div>`).join('');
  },
};
window.PortfolioPage = PortfolioPage;
